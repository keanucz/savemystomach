import { query } from '@/lib/neo4j';
import { PLACE_ORDER_MUTATION } from '@/lib/cypher';

export async function POST(req: Request) {
  const body = await req.json();
  const postcode = (body.postcode || 'E2 6BG').trim().toUpperCase();

  try {
    await query(PLACE_ORDER_MUTATION, {
      postcode,
      items: body.items,
    });
  } catch (err) {
    console.error('Order write failed:', err);
    return Response.json({ error: 'Could not place order' }, { status: 500 });
  }

  return Response.json({
    order_id: 'ord_' + Date.now(),
    status: 'confirmed',
  });
}
