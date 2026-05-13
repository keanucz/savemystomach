import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export const llm = new OpenAI({
  baseURL: process.env.KIMCHI_BASE_URL || 'https://api.openai.com/v1',
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

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export async function traderAssistant(
  question: string,
  context: Record<string, unknown>,
  history: ChatMsg[] = []
): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are SaveMyStomach's trader assistant. You help market traders understand demand in food desert areas and plan profitable infill stops along their weekly market circuit.

The trader's current data:
${JSON.stringify(context, null, 2)}

Be concise, practical, friendly. Use British English. Reference specific numbers from the data. If asked about orders, use the pending_orders data which shows exactly what products residents have ordered, broken down by area.`,
    },
    ...history.map((m) => ({ role: m.role, content: m.content }) as ChatCompletionMessageParam),
    { role: 'user', content: question },
  ];

  const response = await llm.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 400,
  });
  return response.choices[0].message.content || '';
}
