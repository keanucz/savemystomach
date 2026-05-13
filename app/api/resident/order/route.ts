import { query, toFiniteNumber } from '@/lib/neo4j';
import { PLACE_ORDER_MUTATION } from '@/lib/cypher';
import { compactUkPostcode } from '@/lib/postcode';
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

    const lsoaCode =
      typeof body.lsoa_code === 'string' && body.lsoa_code.trim()
        ? body.lsoa_code.trim()
        : '';
    if (!traderId?.trim()) {
      return Response.json(
        { error: 'trader_id is required so demand is attributed to the correct trader' },
        { status: 400 }
      );
    }
    if (!lsoaCode) {
      return Response.json(
        { error: 'lsoa_code is required and must match your area' },
        { status: 400 }
      );
    }

    const rows = await query<{ items_ordered?: unknown }>(
      PLACE_ORDER_MUTATION,
      {
        traderId: traderId.trim(),
        postcodeCompact: compactUkPostcode(postcode),
        lsoaCode,
        items,
      }
    );
    const ordered = toFiniteNumber(rows[0]?.items_ordered, 0);
    if (ordered !== items.length) {
      return Response.json(
        {
          error:
            "Could not place order: check postcode and area match this trader's stop, and every item is in stock for this trader.",
        },
        { status: 400 }
      );
    }

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
      demo_reason:
        'Neo4j could not save this order (check NEO4J_URI / credentials).',
    });
  }
}
