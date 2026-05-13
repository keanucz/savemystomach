import { query } from '@/lib/neo4j';
import { PLACE_ORDER_MUTATION } from '@/lib/cypher';
import { isDemoFallbackAllowed } from '@/lib/demo-fallback';
import { logApiEvent, truncateId } from '@/lib/api-log';

const ROUTE = 'POST /api/resident/order';

type OrderItem = { sku: string; qty: number };

function parseItems(raw: unknown): OrderItem[] | null {
  if (!Array.isArray(raw)) return null;
  const out: OrderItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') return null;
    const o = row as Record<string, unknown>;
    if (typeof o.sku !== 'string' || !o.sku.trim()) return null;
    if (typeof o.qty !== 'number' || !Number.isFinite(o.qty) || o.qty <= 0)
      return null;
    if (!Number.isInteger(o.qty)) return null;
    out.push({ sku: o.sku.trim(), qty: o.qty });
  }
  return out;
}

export async function POST(req: Request) {
  const started = performance.now();
  let traderId: string | undefined;
  try {
    const body = await req.json();
    traderId =
      typeof body.trader_id === 'string' ? body.trader_id : undefined;

    const items = parseItems(body.items);
    if (!items || items.length === 0) {
      return Response.json(
        { error: 'items must be a non-empty array of { sku, qty }' },
        { status: 400 }
      );
    }

    const postcode =
      typeof body.postcode === 'string' && body.postcode.trim()
        ? body.postcode.trim().toUpperCase()
        : 'E2 6BG';

    await query(PLACE_ORDER_MUTATION, {
      postcode,
      items,
    });

    return Response.json({
      order_id: 'ord_' + Date.now(),
      status: 'confirmed',
    });
  } catch (err) {
    const duration_ms = Math.round(performance.now() - started);
    logApiEvent('error', ROUTE, 'place order failed', {
      duration_ms,
      trader_id: traderId ? truncateId(traderId) : undefined,
      error_name: err instanceof Error ? err.name : 'Error',
      error_message: err instanceof Error ? err.message : String(err),
    });

    if (!isDemoFallbackAllowed()) {
      return Response.json(
        { error: 'Order service temporarily unavailable' },
        { status: 503 }
      );
    }

    return Response.json({
      order_id: 'ord_demo_' + Date.now(),
      status: 'confirmed',
      demo: true,
    });
  }
}
