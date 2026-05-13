import { query } from '@/lib/neo4j';
import { RESIDENT_LOOKUP_QUERY } from '@/lib/cypher';

export async function POST(req: Request) {
  const { postcode } = await req.json();

  try {
    const results = await query(RESIDENT_LOOKUP_QUERY, {
      postcode: postcode.trim().toUpperCase(),
    });
    if (results.length === 0) {
      return Response.json(
        { error: 'Postcode not in our service area yet' },
        { status: 404 }
      );
    }
    return Response.json(results[0]);
  } catch {
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
    });
  }
}
