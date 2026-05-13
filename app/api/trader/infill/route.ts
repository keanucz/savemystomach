import { query } from '@/lib/neo4j';
import { INFILL_STOPS_QUERY } from '@/lib/cypher';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const traderId = searchParams.get('traderId') || 'trader_001';

  try {
    const results = await query(INFILL_STOPS_QUERY, { traderId });
    return Response.json(results);
  } catch {
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
