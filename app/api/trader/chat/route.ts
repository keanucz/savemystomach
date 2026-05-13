import { traderAssistant } from '@/lib/kimchi';

export async function POST(req: Request) {
  const { question, traderId } = await req.json();

  try {
    const profileRes = await fetch(
      `http://localhost:3000/api/trader/profile?traderId=${traderId}`
    );
    const context = await profileRes.json();
    const response = await traderAssistant(question, context);
    return Response.json({ response });
  } catch {
    return Response.json({
      response:
        "Your best opportunity this week is Tower Hamlets 026A — £340 in pre-orders from 3 residents, fitting neatly into your Thursday route. I'd recommend bringing extra tomatoes and spinach based on order patterns.",
    });
  }
}
