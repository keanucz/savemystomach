import { traderAssistant } from '@/lib/kimchi';
import { getTraderProfile } from '@/lib/trader-profile';
import { isDemoFallbackAllowed } from '@/lib/demo-fallback';
import { logApiEvent } from '@/lib/api-log';

const ROUTE = 'POST /api/trader/chat';

const STUB_RESPONSE =
  "Your best opportunity this week is Tower Hamlets 026A — £340 in pre-orders from 3 residents, fitting neatly into your Thursday route. I'd recommend bringing extra tomatoes and spinach based on order patterns.";

export async function POST(req: Request) {
  const started = performance.now();
  let traderIdForLog = '';
  try {
    const body = await req.json();
    const question =
      typeof body.question === 'string' ? body.question.trim() : '';
    traderIdForLog =
      typeof body.traderId === 'string' ? body.traderId.trim() : '';
    if (!question || !traderIdForLog) {
      return Response.json(
        { error: 'question and traderId are required' },
        { status: 400 }
      );
    }

    const profile = await getTraderProfile(traderIdForLog);
    if (!profile) {
      return Response.json({ error: 'Trader not found' }, { status: 404 });
    }

    const response = await traderAssistant(
      question,
      profile as Record<string, unknown>
    );
    return Response.json({ response });
  } catch (err) {
    const duration_ms = Math.round(performance.now() - started);
    if (err instanceof SyntaxError) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    logApiEvent('error', ROUTE, 'chat failed', {
      duration_ms,
      trader_id: traderIdForLog || undefined,
      error_name: err instanceof Error ? err.name : 'Error',
      error_message: err instanceof Error ? err.message : String(err),
    });

    if (!isDemoFallbackAllowed()) {
      return Response.json(
        { error: 'Assistant temporarily unavailable' },
        { status: 503 }
      );
    }

    return Response.json({ response: STUB_RESPONSE, demo: true });
  }
}
