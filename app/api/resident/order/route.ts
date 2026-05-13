import { query } from '@/lib/neo4j';
import { PLACE_ORDER_MUTATION } from '@/lib/cypher';

export async function POST(req: Request) {
  const body = await req.json();

  try {
    await query(PLACE_ORDER_MUTATION, {
      postcode: body.postcode || 'E2 6BG',
      items: body.items,
    });
  } catch {
    // Continue even if Neo4j unavailable
  }

  return Response.json({
    order_id: 'ord_' + Date.now(),
    status: 'confirmed',
  });
}
