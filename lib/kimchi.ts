import OpenAI from 'openai';

export const llm = new OpenAI({
  baseURL: process.env.KIMCHI_BASE_URL || 'https://api.kimchi.dev/v1',
  apiKey: process.env.KIMCHI_API_KEY || 'placeholder',
});

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
  const response = await llm.chat.completions.create({
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
  return JSON.parse(response.choices[0].message.content || '{"items":[]}');
}

export async function traderAssistant(
  question: string,
  context: Record<string, unknown>
): Promise<string> {
  const response = await llm.chat.completions.create({
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
  return response.choices[0].message.content || '';
}
