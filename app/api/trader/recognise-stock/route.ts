import { recogniseStock } from '@/lib/kimchi';
import { isDemoFallbackAllowed } from '@/lib/demo-fallback';
import { logApiEvent } from '@/lib/api-log';

const ROUTE = 'POST /api/trader/recognise-stock';

const MAX_IMAGE_CHARS = 12_000_000;

export async function POST(req: Request) {
  const started = performance.now();
  try {
    const body = await req.json();
    const image = typeof body.image === 'string' ? body.image : '';
    if (!image) {
      return Response.json({ error: 'image is required' }, { status: 400 });
    }
    if (image.length > MAX_IMAGE_CHARS) {
      return Response.json({ error: 'image payload too large' }, { status: 400 });
    }

    const result = await recogniseStock(image);
    return Response.json(result);
  } catch (err) {
    const duration_ms = Math.round(performance.now() - started);
    logApiEvent('error', ROUTE, 'recognise stock failed', {
      duration_ms,
      error_name: err instanceof Error ? err.name : 'Error',
      error_message: err instanceof Error ? err.message : String(err),
    });

    if (!isDemoFallbackAllowed()) {
      return Response.json(
        { error: 'Recognition service temporarily unavailable' },
        { status: 503 }
      );
    }

    return Response.json({
      items: [
        { sku: 'tomato', name: 'Tomatoes', estimated_qty: 20, unit: 'kg' },
        { sku: 'apple', name: 'Apples', estimated_qty: 15, unit: 'kg' },
        { sku: 'potato', name: 'Potatoes', estimated_qty: 25, unit: 'kg' },
      ],
      demo: true,
    });
  }
}
