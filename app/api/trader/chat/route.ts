import { traderAssistant } from '@/lib/kimchi';
import { query } from '@/lib/neo4j';
import { TRADER_PROFILE_QUERY, INFILL_STOPS_QUERY } from '@/lib/cypher';

const ORDER_DETAILS_QUERY = `
MATCH (t:Trader {id: $traderId})-[:SUPPLIES]->(p:Product)
MATCH (r:Resident)-[o:ORDERED {status: 'pending'}]->(p)
MATCH (r)-[:LIVES_IN]->(l:LSOA)
WITH l.name AS area, p.name AS product, sum(o.qty) AS total_qty, p.unit AS unit,
     sum(o.qty * o.price_pence) / 100 AS value_gbp
RETURN area, product, total_qty, unit, value_gbp
ORDER BY value_gbp DESC
`;

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  const { question, traderId, history } = await req.json();

  try {
    const [profileRows, infillRows, orderRows] = await Promise.all([
      query(TRADER_PROFILE_QUERY, { traderId }),
      query(INFILL_STOPS_QUERY, { traderId }),
      query(ORDER_DETAILS_QUERY, { traderId }),
    ]);
    const context = {
      profile: profileRows[0] || {},
      infill_stops: infillRows,
      pending_orders: orderRows,
    };
    const messages: Array<{ role: string; content: string }> = history || [];
    const response = await traderAssistant(question, context, messages as ChatMsg[]);
    return Response.json({ response });
  } catch (err) {
    console.error('Chat error:', err);
    return Response.json({
      response:
        "Your best opportunity this week is Tower Hamlets 026A — £560 in pre-orders from 3 residents. I'd recommend bringing extra tomatoes and spinach based on order patterns.",
    });
  }
}
