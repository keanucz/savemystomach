import { query } from '@/lib/neo4j';
import { ACCEPT_STOP_MUTATION } from '@/lib/cypher';

export async function POST(req: Request) {
  const { traderId, lsoaCode, date, scheduledTime, expectedValuePence } =
    await req.json();

  try {
    const results = await query(ACCEPT_STOP_MUTATION, {
      traderId,
      lsoaCode,
      date,
      scheduledTime,
      expectedValuePence,
    });
    return Response.json(results[0]);
  } catch {
    return Response.json({ trader_id: traderId, lsoa_code: lsoaCode });
  }
}
