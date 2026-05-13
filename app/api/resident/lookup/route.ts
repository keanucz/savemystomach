import { query } from '@/lib/neo4j';
import { RESIDENT_LOOKUP_QUERY } from '@/lib/cypher';
import { isDemoFallbackAllowed } from '@/lib/demo-fallback';
import { logApiEvent } from '@/lib/api-log';

const ROUTE = 'POST /api/resident/lookup';

function redactPostcode(pc: string): string {
  const p = pc.trim().toUpperCase().replace(/\s+/g, '');
  if (p.length <= 3) return '…';
  return p.slice(0, 3) + '…';
}

export async function POST(req: Request) {
  const started = performance.now();
  let postcode = '';
  try {
    const body = await req.json();
    postcode =
      typeof body.postcode === 'string' ? body.postcode.trim().toUpperCase() : '';
    if (!postcode) {
      return Response.json({ error: 'postcode is required' }, { status: 400 });
    }

    const results = await query(RESIDENT_LOOKUP_QUERY, {
      postcode,
    });
    if (results.length === 0) {
      return Response.json(
        { error: 'Postcode not in our service area yet' },
        { status: 404 }
      );
    }
    return Response.json(results[0]);
  } catch (err) {
    const duration_ms = Math.round(performance.now() - started);
    logApiEvent('error', ROUTE, 'lookup failed', {
      duration_ms,
      postcode_area: postcode ? redactPostcode(postcode) : undefined,
      error_name: err instanceof Error ? err.name : 'Error',
      error_message: err instanceof Error ? err.message : String(err),
    });

    if (!isDemoFallbackAllowed()) {
      return Response.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    return Response.json({
      lsoa_code: 'E01004297',
      lsoa_name: 'Tower Hamlets 026A',
      borough: 'Tower Hamlets',
      lat: 51.5238,
      lng: -0.0588,
      upcoming_stops: [
        {
          trader_id: 'trader_001',
          trader_name: 'Cotswold Fruit & Veg',
          scheduled_time: '2026-05-14T17:00:00',
          lat: 51.524,
          lng: -0.0585,
          available_products: [
            { sku: 'tomato', name: 'Tomatoes', price_pence: 280, unit: 'kg' },
            {
              sku: 'spinach',
              name: 'Spinach',
              price_pence: 180,
              unit: '500g',
            },
            {
              sku: 'apple',
              name: 'Apples',
              price_pence: 350,
              unit: '1kg bag',
            },
            { sku: 'potato', name: 'Potatoes', price_pence: 200, unit: 'kg' },
            { sku: 'carrot', name: 'Carrots', price_pence: 150, unit: 'kg' },
          ],
        },
      ],
      demo: true,
    });
  }
}
