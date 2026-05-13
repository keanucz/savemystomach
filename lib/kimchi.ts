import OpenAI from 'openai';

const KIMCHI_TIMEOUT_MS = Number(process.env.KIMCHI_TIMEOUT_MS) || 45_000;
const KIMCHI_MAX_RETRIES = Number(process.env.KIMCHI_MAX_RETRIES);
const maxRetries = Number.isFinite(KIMCHI_MAX_RETRIES) ? KIMCHI_MAX_RETRIES : 1;

let _llm: OpenAI | null = null;

function getLlm(): OpenAI {
  if (!_llm) {
    _llm = new OpenAI({
      baseURL: process.env.KIMCHI_BASE_URL || 'https://api.kimchi.dev/v1',
      apiKey: process.env.KIMCHI_API_KEY || 'placeholder',
      timeout: KIMCHI_TIMEOUT_MS,
      maxRetries,
    });
  }
  return _llm;
}

function safeParseStockJson(raw: string): {
  items: Array<{
    sku: string;
    name: string;
    estimated_qty: number;
    unit: string;
  }>;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { items: [] };
  }
  if (!parsed || typeof parsed !== 'object' || !('items' in parsed)) {
    return { items: [] };
  }
  const itemsRaw = (parsed as { items?: unknown }).items;
  if (!Array.isArray(itemsRaw)) return { items: [] };

  const items: Array<{
    sku: string;
    name: string;
    estimated_qty: number;
    unit: string;
  }> = [];
  for (const row of itemsRaw) {
    if (!row || typeof row !== 'object') continue;
    const o = row as Record<string, unknown>;
    const sku = typeof o.sku === 'string' ? o.sku : '';
    const name = typeof o.name === 'string' ? o.name : '';
    const unit = typeof o.unit === 'string' ? o.unit : '';
    const qty =
      typeof o.estimated_qty === 'number' && Number.isFinite(o.estimated_qty)
        ? o.estimated_qty
        : 0;
    if (!sku && !name) continue;
    items.push({ sku, name, estimated_qty: qty, unit });
  }
  return { items };
}

export async function recogniseStock(
  imageBase64: string
): Promise<{
  items: Array<{
    sku: string;
    name: string;
    estimated_qty: number;
    unit: string;
  }>;
}> {
  const response = await getLlm().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Identify fresh produce in this image. Return ONLY valid JSON in this exact shape: {"items": [{"sku": "...", "name": "...", "estimated_qty": <number>, "unit": "..."}]}. Use these SKUs only: tomato, spinach, apple, potato, carrot, bread, milk, eggs. If you can't tell, estimate conservatively.`,
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ],
    response_format: { type: 'json_object' },
  });
  const raw = response.choices[0]?.message?.content ?? '{"items":[]}';
  return safeParseStockJson(raw);
}

export async function traderAssistant(
  question: string,
  context: Record<string, unknown>
): Promise<string> {
  const response = await getLlm().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are SaveMyStomach's trader assistant. You help market traders identify profitable food desert infill stops along their weekly market circuit. The trader's current context: ${JSON.stringify(context)}. Be concise, practical, friendly. Use British English. Don't make up numbers — if you don't have data, say so.`,
      },
      { role: 'user', content: question },
    ],
    max_tokens: 250,
  });
  return response.choices[0]?.message?.content || '';
}

/** Lightweight OpenAI-compatible availability check (no chat completion). */
export async function pingKimchiApi(signal?: AbortSignal): Promise<void> {
  await getLlm().models.list({ signal });
}
