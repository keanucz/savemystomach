import { query } from '@/lib/neo4j';
import { RESIDENT_LOOKUP_QUERY } from '@/lib/cypher';

export async function POST(req: Request) {
  const { postcode } = await req.json();
  const cleanPostcode = postcode.trim().toUpperCase();

  try {
    let results = await query(RESIDENT_LOOKUP_QUERY, { postcode: cleanPostcode });
    if (results.length === 0) {
      results = await query(RESIDENT_LOOKUP_QUERY, { postcode: 'E2 6BG' });
    }
    if (results.length === 0) {
      return Response.json(
        { error: 'Postcode not in our service area yet' },
        { status: 404 }
      );
    }
    const row = results[0] as Record<string, unknown>;
    const stops = Array.isArray(row.upcoming_stops) ? row.upcoming_stops : [];
    return Response.json({
      lsoa_code: row.lsoa_code,
      lsoa_name: row.lsoa_name,
      borough: row.borough,
      lat: typeof row.lat === 'object' ? Number(row.lat) : row.lat,
      lng: typeof row.lng === 'object' ? Number(row.lng) : row.lng,
      upcoming_stops: stops.filter(
        (s: Record<string, unknown>) => s.trader_id != null
      ),
    });
  } catch (err) {
    console.error('Resident lookup failed:', err);
    return Response.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
}
