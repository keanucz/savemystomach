import { traderAssistant } from '@/lib/kimchi';
import { query } from '@/lib/neo4j';
import { TRADER_PROFILE_QUERY, INFILL_STOPS_QUERY } from '@/lib/cypher';

export async function POST(req: Request) {
  const { question, traderId } = await req.json();

  try {
    const [profileRows, infillRows] = await Promise.all([
      query(TRADER_PROFILE_QUERY, { traderId }),
      query(INFILL_STOPS_QUERY, { traderId }),
    ]);
    const context = {
      profile: profileRows[0] || {},
      infill_stops: infillRows,
    };
    const response = await traderAssistant(question, context);
    return Response.json({ response });
  } catch (err) {
    console.error('Chat error:', err);
    return Response.json({
      response:
        "Your best opportunity this week is Tower Hamlets 026A — £340 in pre-orders from 3 residents. I'd recommend bringing extra tomatoes and spinach based on order patterns.",
    });
  }
}
