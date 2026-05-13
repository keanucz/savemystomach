import { query } from '@/lib/neo4j';
import { pingKimchiApi } from '@/lib/kimchi';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const started = performance.now();
  const { searchParams } = new URL(req.url);
  const includeKimchi =
    process.env.HEALTH_CHECK_KIMCHI === 'true' ||
    searchParams.get('kimchi') === '1';

  try {
    await query<{ ok: number }>('RETURN 1 AS ok');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Neo4j unreachable';
    return Response.json(
      {
        ok: false,
        neo4j: 'error',
        error: message,
        duration_ms: Math.round(performance.now() - started),
      },
      { status: 503 }
    );
  }

  let kimchi: 'skipped' | 'ok' | 'error' = 'skipped';
  let kimchi_error: string | undefined;

  if (includeKimchi) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 5000);
    try {
      await pingKimchiApi(ac.signal);
      kimchi = 'ok';
    } catch (e) {
      kimchi = 'error';
      kimchi_error = e instanceof Error ? e.message : String(e);
    } finally {
      clearTimeout(t);
    }
  }

  const body: Record<string, unknown> = {
    ok: true,
    neo4j: 'ok',
    kimchi,
    duration_ms: Math.round(performance.now() - started),
  };
  if (kimchi_error) body.kimchi_error = kimchi_error;

  if (includeKimchi && kimchi === 'error') {
    return Response.json(body, { status: 503 });
  }

  return Response.json(body);
}
