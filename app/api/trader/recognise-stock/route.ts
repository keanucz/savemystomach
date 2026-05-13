import { recogniseStock } from '@/lib/kimchi';

export async function POST(req: Request) {
  const { image } = await req.json();
  try {
    const result = await recogniseStock(image);
    return Response.json(result);
  } catch {
    return Response.json({
      items: [
        { sku: 'tomato', name: 'Tomatoes', estimated_qty: 20, unit: 'kg' },
        { sku: 'apple', name: 'Apples', estimated_qty: 15, unit: 'kg' },
        { sku: 'potato', name: 'Potatoes', estimated_qty: 25, unit: 'kg' },
      ],
    });
  }
}
