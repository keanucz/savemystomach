import { query } from '@/lib/neo4j';
import { TRADER_PROFILE_QUERY } from '@/lib/cypher';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const traderId = searchParams.get('traderId') || 'trader_001';

  try {
    const results = await query(TRADER_PROFILE_QUERY, { traderId });
    if (results.length === 0) {
      return Response.json({ error: 'Trader not found' }, { status: 404 });
    }
    return Response.json(results[0]);
  } catch {
    return Response.json({
      name: 'James Whitaker',
      business: 'Cotswold Fruit & Veg',
      circuit: [
        { market: 'Banbury Market', day: 'thursday', town: 'Banbury' },
        { market: 'Witney Market', day: 'friday', town: 'Witney' },
        {
          market: 'Stratford-upon-Avon Market',
          day: 'friday',
          town: 'Stratford-upon-Avon',
        },
      ],
      products: [
        { sku: 'tomato', name: 'Tomatoes', price_pence: 280, unit: 'kg' },
        { sku: 'spinach', name: 'Spinach', price_pence: 180, unit: '500g' },
        {
          sku: 'apple',
          name: 'Apples',
          price_pence: 350,
          unit: '1kg bag',
        },
        { sku: 'potato', name: 'Potatoes', price_pence: 200, unit: 'kg' },
        { sku: 'carrot', name: 'Carrots', price_pence: 150, unit: 'kg' },
      ],
    });
  }
}
