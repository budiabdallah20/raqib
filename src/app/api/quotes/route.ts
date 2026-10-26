import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/security';

// ───────────────────────────────────────────────────────
// GET /api/quotes — آيات ومثل مصري نشطة لمكوّن التدوير
// { quran: Quote[], proverbs: Quote[] }
// ───────────────────────────────────────────────────────
export async function GET() {
  try {
    await requireUser();

    const quotes = await prisma.quote.findMany({
      where: { active: true },
      select: {
        id: true,
        kind: true,
        text: true,
        source: true,
      },
      orderBy: [{ kind: 'asc' }, { id: 'asc' }],
    });

    return Response.json({
      quran: quotes.filter((q) => q.kind === 'QURAN'),
      proverbs: quotes.filter((q) => q.kind === 'PROVERB'),
    });
  } catch (error) {
    return handleApiError(error, 'تعذر إتمام الطلب');
  }
}
