import { Prisma, PrismaClient } from '@prisma/client';
import { decryptSensitive, encryptSensitive, isEncrypted } from './crypto';

/**
 * Neon Postgres: عند استهداف مُجمِّع PgBouncer (hostname فيه -pooler)
 * لازم نشغّل وضع PgBouncer لـ Prisma (يمنع prepared statements المخزنة لكل جلسة
 * لأن transaction pooling لا يضمن نفس الـ backend لكل statement).
 * appends ?pgbouncer=true وقت التشغيل — ينجو من أي `neon env pull` يعيد كتابة .env.
 */
function normalizeDatabaseUrl() {
  let url = process.env.DATABASE_URL;
  if (!url) return;
  if (!/^postgres/i.test(url)) return; // SQLite المحلي — لا تقديس
  if (url.includes('-pooler') && !/pgbouncer=/.test(url)) {
    url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true';
    process.env.DATABASE_URL = url;
  }
}
normalizeDatabaseUrl();

/* ------------------------------------------------------------------ */
/* تشفير PII الشفاف على مستوى Prisma                                  */
/* ------------------------------------------------------------------ */

type FieldMode = 'deterministic' | 'random';

/**
 * deterministic: حقول فريدة/قابلة للبحث بالمساواة — نفس القيمة = نفس ciphertext.
 * random: نصوص حرة حساسة — IV عشوائي لكل كتابة.
 */
const FIELD_POLICY: Record<string, Record<string, FieldMode>> = {
  User: {
    email: 'deterministic',
    phone: 'deterministic',
    studentCode: 'deterministic',
    nationalId: 'deterministic',
  },
  StudentNote: { title: 'random', body: 'random' },
  TaskSubmission: { feedback: 'random' },
  Notification: { body: 'random' },
  Lecture: { geofence: 'random' },
  AuditLog: { detail: 'random' },
};

function contextOf(model: string, field: string) {
  return `${model}.${field}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !Buffer.isBuffer(value)
  );
}

/** تشفير data قبل الكتابة — يتعامل مع create/update/upsert/createMany المتداخلة. */
function transformWriteData(model: string, value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => transformWriteData(model, item));
  if (!isPlainObject(value)) return value;

  const policy = FIELD_POLICY[model];
  if (!policy) return value;

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    const mode = policy[key];
    if (mode && typeof child === 'string') {
      result[key] = encryptSensitive(
        child,
        contextOf(model, key),
        mode === 'deterministic',
      );
      continue;
    }
    if (mode && child === null) {
      result[key] = null;
      continue;
    }
    result[key] = transformWriteData(model, child);
  }
  return result;
}

/** تحويل شروط where للحقول الحتمية فقط — يدعم equals/in/not دون لمس contains. */
function transformWhereField(
  model: string,
  field: string,
  value: unknown,
): unknown {
  const mode = FIELD_POLICY[model]?.[field];
  if (mode !== 'deterministic') return value;

  const encrypt = (raw: string) =>
    encryptSensitive(raw, contextOf(model, field), true);

  if (typeof value === 'string') return encrypt(value);
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'string' ? encrypt(item) : item));
  }
  if (!isPlainObject(value)) return value;

  const result: Record<string, unknown> = {};
  for (const [operator, operand] of Object.entries(value)) {
    if (operator === 'equals' && typeof operand === 'string') {
      result[operator] = encrypt(operand);
    } else if (operator === 'in' && Array.isArray(operand)) {
      result[operator] = operand.map((item) =>
        typeof item === 'string' ? encrypt(item) : item,
      );
    } else if (operator === 'not' && typeof operand === 'string') {
      result[operator] = encrypt(operand);
    } else {
      // contains/startsWith/endsWith/mode/lt/gt… لا تُشفّر:
      // البحث الجزئي فوق ciphertext غير ممكن، والمسارات التي تحتاجه تستخدم مساواة.
      result[operator] = operand;
    }
  }
  return result;
}

function transformWhere(model: string, value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => transformWhere(model, item));
  if (!isPlainObject(value)) return value;

  const policy = FIELD_POLICY[model];
  if (!policy) return value;

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (policy[key]) {
      result[key] = transformWhereField(model, key, child);
    } else {
      result[key] = transformWhere(model, child);
    }
  }
  return result;
}

/** فك تشفير أي نص مشفّر في نتيجة القراءة (متسلسل/متداخل). */
function decryptResult(value: unknown): unknown {
  if (typeof value === 'string') {
    return isEncrypted(value) ? decryptSensitive(value) : value;
  }
  if (Array.isArray(value)) return value.map((item) => decryptResult(item));
  if (!isPlainObject(value)) return value;

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    result[key] = decryptResult(child);
  }
  return result;
}

const piiExtension = Prisma.defineExtension({
  name: 'raqib-pii-encryption',
  query: {
    $allModels: {
      async $allOperations({ model, args, query }) {
        if (!model || !FIELD_POLICY[model]) return query(args);

        const nextArgs = { ...(args as Record<string, unknown>) };
        for (const key of ['data', 'create', 'update']) {
          if (nextArgs[key] !== undefined) {
            nextArgs[key] = transformWriteData(model, nextArgs[key]);
          }
        }
        if (nextArgs.where !== undefined) {
          nextArgs.where = transformWhere(model, nextArgs.where);
        }

        const result = await query(nextArgs);
        return decryptResult(result);
      },
    },
  },
});

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends(piiExtension);
}

type ExtendedPrisma = ReturnType<typeof createPrismaClient>;
const globalForPrisma = globalThis as unknown as { prisma?: ExtendedPrisma };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * تقوية SQLite: تفعيل المفاتيح الأجنبية، WAL للقراءة المتزامنة،
 * و busy_timeout لتقليل أخطاء القفل تحت الضغط.
 */
async function hardenSqlite() {
  if (!process.env.DATABASE_URL?.startsWith('file:')) return;
  try {
    await prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;');
    await prisma.$queryRawUnsafe('PRAGMA foreign_keys=ON;');
    await prisma.$queryRawUnsafe('PRAGMA busy_timeout=5000;');
    await prisma.$queryRawUnsafe('PRAGMA synchronous=NORMAL;');
  } catch (error) {
    console.error('[raqib:db] Failed to apply SQLite hardening pragmas', error);
  }
}

void hardenSqlite();
