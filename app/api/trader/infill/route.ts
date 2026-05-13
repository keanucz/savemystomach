import { query } from '@/lib/neo4j';
import { INFILL_STOPS_QUERY } from '@/lib/cypher';
import { isDemoFallbackAllowed } from '@/lib/demo-fallback';
import { logApiEvent, truncateId } from '@/lib/api-log';

const ROUTE = 'GET /api/trader/infill';

export async function GET(req: Request) {
  const started = performance.now();
  const { searchParams } = new URL(req.url);
  const traderId = searchParams.get('traderId') || 'trader_001';

  try {
    const results = await query(INFILL_STOPS_QUERY, { traderId });
    return Response.json(results);
  } catch (err) {
    const duration_ms = Math.round(performance.now() - started);
    logApiEvent('error', ROUTE, 'infill query failed', {
      duration_ms,
      trader_id: truncateId(traderId),
      error_name: err instanceof Error ? err.name : 'Error',
      error_message: err instanceof Error ? err.message : String(err),
    });

    if (!isDemoFallbackAllowed()) {
      return Response.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    return Response.json([
      {
        lsoa_name: 'Tower Hamlets 026A',
        lsoa_code: 'E01004297',
        borough: 'Tower Hamlets',
        lat: 51.5238,
        lng: -0.0588,
        demand_gbp: 340,
        residents: 3,
        market_a: 'Whitechapel Market',
        market_b: 'Borough Market',
        day: 'thursday',
      },
      {
        lsoa_name: 'Hackney 015A',
        lsoa_code: 'E01001755',
        borough: 'Hackney',
        lat: 51.545,
        lng: -0.053,
        demand_gbp: 180,
        residents: 1,
        market_a: 'Whitechapel Market',
        market_b: 'Borough Market',
        day: 'thursday',
      },
    ]);
  }
}
