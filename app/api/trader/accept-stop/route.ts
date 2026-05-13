import { query } from '@/lib/neo4j';
import { ACCEPT_STOP_MUTATION } from '@/lib/cypher';
import { isDemoFallbackAllowed } from '@/lib/demo-fallback';
import { logApiEvent, truncateId } from '@/lib/api-log';

const ROUTE = 'POST /api/trader/accept-stop';

export async function POST(req: Request) {
  const started = performance.now();
  let traderId = '';
  let lsoaCode = '';
  try {
    const body = await req.json();
    traderId = typeof body.traderId === 'string' ? body.traderId : '';
    lsoaCode = typeof body.lsoaCode === 'string' ? body.lsoaCode : '';
    const date = typeof body.date === 'string' ? body.date : '';
    const scheduledTime =
      typeof body.scheduledTime === 'string' ? body.scheduledTime : '';
    const expectedValuePence =
      typeof body.expectedValuePence === 'number'
        ? body.expectedValuePence
        : 0;

    if (!traderId || !lsoaCode || !date || !scheduledTime) {
      return Response.json(
        { error: 'traderId, lsoaCode, date, and scheduledTime are required' },
        { status: 400 }
      );
    }

    const results = await query(ACCEPT_STOP_MUTATION, {
      traderId,
      lsoaCode,
      date,
      scheduledTime,
      expectedValuePence,
    });
    return Response.json(results[0]);
  } catch (err) {
    const duration_ms = Math.round(performance.now() - started);
    logApiEvent('error', ROUTE, 'accept stop failed', {
      duration_ms,
      trader_id: traderId ? truncateId(traderId) : undefined,
      lsoa: lsoaCode ? truncateId(lsoaCode, 16) : undefined,
      error_name: err instanceof Error ? err.name : 'Error',
      error_message: err instanceof Error ? err.message : String(err),
    });

    if (!isDemoFallbackAllowed()) {
      return Response.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    return Response.json({ trader_id: traderId, lsoa_code: lsoaCode, demo: true });
  }
}
