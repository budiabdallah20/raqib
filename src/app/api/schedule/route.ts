import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError, logAudit, sanitizeString } from '@/lib/security';

const slotInclude = {
  course: {
    select: {
      id: true,
      code: true,
      name: true,
      englishName: true,
      professor: { select: { name: true } },
    },
  },
};

const groupSchema = z
  .string()
  .trim()
  .min(1)
  .max(4)
  .regex(/^[A-Za-z0-9]$/, 'الجروب غير صحيح')
  .transform((v) => v.toUpperCase());

/** الترم الدراسي — T1 (فصل خريف) و T2 (فصل ربيع) بيدخل حيز التنفيذ بتاريخه المحدد */
const termSchema = z.enum(['T1', 'T2']).default('T1');

// ───────────────────────────────────────────────────────────────
// GET /api/schedule?group=B&term=T1
// ───────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const raw = url.searchParams.get('group') || '';
    const term = termSchema.safeParse(url.searchParams.get('term') || 'T1');
    if (!term.success) return jsonError('الترم غير صحيح');
    const activeTerm = term.data;

    let group: string;
    let myGroup: string | null = null;
    if (user.role === 'STUDENT') {
      const me = await prisma.user.findUnique({
        where: { id: user.id },
        select: { group: true },
      });
      myGroup = (me?.group || 'A').toUpperCase();
      // الطالب يستعرض جروبه أو الجروب الآخر للمعاينة فقط (قراءة بلا تعديل)
      const parsed = groupSchema.safeParse(raw);
      group = parsed.success ? parsed.data : myGroup;
    } else {
      const parsed = groupSchema.safeParse(raw || (user.role === 'ADMIN' ? 'B' : ''));
      if (user.role === 'ADMIN') {
        group = parsed.success ? parsed.data : 'B';
      } else {
        group = parsed.success ? parsed.data : 'B';
      }
    }

    const slots = await prisma.scheduleSlot.findMany({
      where: { group, term: activeTerm },
      include: slotInclude,
      orderBy: [{ day: 'asc' }, { period: 'asc' }],
    });

    const palette =
      user.role === 'ADMIN'
        ? await prisma.course.findMany({
            select: {
              id: true,
              code: true,
              name: true,
              englishName: true,
              professor: { select: { name: true } },
            },
            orderBy: { code: 'asc' },
          })
        : [];

    return Response.json({ group, term: activeTerm, myGroup, slots, palette });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}

// ───────────────────────────────────────────────────────────────
// POST /api/schedule — تعديل الجريد (الأدمن فقط)
// op: move | swap | create | update | delete | copyFrom
// ───────────────────────────────────────────────────────────────
const cellSchema = z.object({
  group: groupSchema,
  day: z.number().int().min(2).max(5, 'اليوم غير موجود في الجريد'),
  period: z.number().int().min(1).max(4, 'الحصة غير موجودة'),
});

const moveSchema = cellSchema.extend({ fromDay: z.number().int().min(2).max(5), fromPeriod: z.number().int().min(1).max(4) });
const swapSchema = z.object({
  a: cellSchema,
  b: cellSchema,
});
const createSchema = cellSchema.extend({
  courseId: z.string().min(1),
  kind: z.enum(['LECTURE', 'SECTION', 'LAB']).default('LECTURE'),
  room: z.string().trim().max(60).optional().or(z.literal('')),
  isVip: z.boolean().optional().default(false),
  teacherName: z.string().trim().max(80).optional().or(z.literal('')),
});
const updateSchema = cellSchema.extend({
  courseId: z.string().min(1).optional(),
  kind: z.enum(['LECTURE', 'SECTION', 'LAB']).optional(),
  room: z.string().trim().max(60).optional(),
  isVip: z.boolean().optional(),
  teacherName: z.string().trim().max(80).optional(),
});

const postSchema = z.object({
  op: z.enum(['move', 'swap', 'create', 'update', 'delete', 'copyFrom']),
  group: groupSchema,
  term: termSchema,
});

export async function POST(request: Request) {
  try {
    const user = await requireUser(['ADMIN']);
    const body = await request.json().catch(() => null);
    if (!body) return jsonError('بيانات غير صالحة');

    const base = postSchema.safeParse(body);
    if (!base.success) return jsonError(base.error.issues[0]?.message || 'بيانات غير صالحة');
    const { op, group, term } = base.data;

    let result: unknown;
    let auditDetail: unknown;

    if (op === 'copyFrom') {
      // نسخ جدول جروب آخر كنقطة بداية — الأدمن بعدها يحرك الكروت زي ما عايز
      const sourceRaw = typeof body.source === 'string' ? body.source.trim().toUpperCase() : '';
      const source = await groupSchema.safeParseAsync(sourceRaw);
      if (!source.success) return jsonError('الجروب المصدر غير صحيح');
      if (source.data === group) return jsonError('اختر جروبًا مختلفًا للنسخ منه');

      await prisma.$transaction([
        prisma.scheduleSlot.deleteMany({ where: { group, term } }),
        prisma.scheduleSlot.createMany({
          data: (
            await prisma.scheduleSlot.findMany({ where: { group: source.data, term } })
          ).map((slot) => ({
            group,
            day: slot.day,
            period: slot.period,
            term,
            courseId: slot.courseId,
            kind: slot.kind,
            room: slot.room,
            isVip: slot.isVip,
            teacherName: slot.teacherName,
          })),
        }),
      ]);
      result = { ok: true };
      auditDetail = { copiedFrom: source.data, into: group, term };
    } else if (op === 'move') {
      const parsed = moveSchema.safeParse(body);
      if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
      const { fromDay, fromPeriod, day, period } = parsed.data;
      if (fromDay === day && fromPeriod === period) {
        return Response.json({ ok: true, unchanged: true });
      }

      const slot = await prisma.scheduleSlot.findUnique({
        where: { group_day_period_term: { group, day: fromDay, period: fromPeriod, term } },
      });
      if (!slot) return jsonError('الكارت الأصلي غير موجود', 404);

      const target = await prisma.scheduleSlot.findUnique({
        where: { group_day_period_term: { group, day, period, term } },
      });
      if (target) return jsonError('التبديل بين كارتين يستخدم عملية swap', 409);

      const moved = await prisma.scheduleSlot.update({
        where: { id: slot.id },
        data: { day, period },
        include: slotInclude,
      });
      result = moved;
      auditDetail = { group, term, from: `d${fromDay}p${fromPeriod}`, to: `d${day}p${period}` };
    } else if (op === 'swap') {
      const parsed = swapSchema.safeParse(body);
      if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
      const { a, b } = parsed.data;
      if (a.group === b.group && a.day === b.day && a.period === b.period) {
        return Response.json({ ok: true, unchanged: true });
      }

      // swap آمن: حذف الاتنين + إعادة إنشاء مع بيانات بعض
      const [sa, sb] = await prisma.$transaction([
        prisma.scheduleSlot.findUnique({ where: { group_day_period_term: { group: a.group, day: a.day, period: a.period, term } } }),
        prisma.scheduleSlot.findUnique({ where: { group_day_period_term: { group: b.group, day: b.day, period: b.period, term } } }),
      ]);
      if (!sa || !sb) return jsonError('أحد الكارتين غير موجود', 404);
      if (sa.group !== sb.group) return jsonError('لا يمكن التبديل بين جروبين', 400);

      const payloadA = { courseId: sa.courseId, kind: sa.kind, room: sa.room, isVip: sa.isVip, teacherName: sa.teacherName };
      const payloadB = { courseId: sb.courseId, kind: sb.kind, room: sb.room, isVip: sb.isVip, teacherName: sb.teacherName };

      await prisma.$transaction([
        prisma.scheduleSlot.delete({ where: { id: sa.id } }),
        prisma.scheduleSlot.delete({ where: { id: sb.id } }),
        // جروب الخانتين نفسه (تأكدنا منه أعلاه) — لا تستخدم جروب الـ POST الخارجي
        prisma.scheduleSlot.create({ data: { group: sa.group, day: b.day, period: b.period, term, ...payloadA } }),
        prisma.scheduleSlot.create({ data: { group: sa.group, day: a.day, period: a.period, term, ...payloadB } }),
      ]);

      auditDetail = { group: sa.group, term, swap: [`d${a.day}p${a.period}`, `d${b.day}p${b.period}`] };
      result = { ok: true };
    } else if (op === 'create') {
      const parsed = createSchema.safeParse(body);
      if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
      const { day, period, courseId, kind, room, isVip, teacherName } = parsed.data;

      const exists = await prisma.scheduleSlot.findUnique({
        where: { group_day_period_term: { group, day, period, term } },
      });
      if (exists) return jsonError('الخانة مشغولة بالفعل', 409);

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) return jsonError('المقرر غير موجود', 404);

      const created = await prisma.scheduleSlot.create({
        data: {
          group,
          day,
          period,
          term,
          courseId,
          kind,
          room: room ? sanitizeString(room, 60) : null,
          isVip: !!isVip,
          teacherName: teacherName ? sanitizeString(teacherName, 80) : null,
        },
        include: slotInclude,
      });
      result = created;
      auditDetail = { group, term, at: `d${day}p${period}`, courseId };
    } else if (op === 'update') {
      const parsed = updateSchema.safeParse(body);
      if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
      const { day, period, ...patch } = parsed.data;

      const slot = await prisma.scheduleSlot.findUnique({
        where: { group_day_period_term: { group, day, period, term } },
      });
      if (!slot) return jsonError('الكارت غير موجود', 404);

      if (patch.courseId) {
        const course = await prisma.course.findUnique({ where: { id: patch.courseId } });
        if (!course) return jsonError('المقرر غير موجود', 404);
      }

      const updated = await prisma.scheduleSlot.update({
        where: { id: slot.id },
        data: {
          ...(patch.courseId ? { courseId: patch.courseId } : {}),
          ...(patch.kind ? { kind: patch.kind } : {}),
          ...(patch.room !== undefined ? { room: patch.room ? sanitizeString(patch.room, 60) : null } : {}),
          ...(patch.isVip !== undefined ? { isVip: patch.isVip } : {}),
          ...(patch.teacherName !== undefined
            ? { teacherName: patch.teacherName ? sanitizeString(patch.teacherName, 80) : null }
            : {}),
        },
        include: slotInclude,
      });
      result = updated;
      auditDetail = { group, term, at: `d${day}p${period}`, patch };
    } else {
      const parsed = cellSchema.safeParse(body);
      if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || 'بيانات غير صالحة');
      const { day, period } = parsed.data;

      const slot = await prisma.scheduleSlot.findUnique({
        where: { group_day_period_term: { group, day, period, term } },
      });
      if (!slot) return jsonError('الكارت غير موجود', 404);

      await prisma.scheduleSlot.delete({ where: { id: slot.id } });
      result = { ok: true };
      auditDetail = { group, term, deleted: `d${day}p${period}` };
    }

    await logAudit({
      user: { id: user.id, role: user.role },
      request,
      action: `SCHEDULE_${op.toUpperCase()}`,
      entity: 'ScheduleSlot',
      detail: auditDetail,
    });

    return Response.json({ ok: true, slot: result });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
