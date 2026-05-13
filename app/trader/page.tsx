'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const TRADER_ID = 'trader_001';

interface CircuitStop {
  market: string;
  day: string;
  town: string;
}

interface Product {
  sku: string;
  name: string;
  price_pence: number;
  unit: string;
}

interface TraderProfile {
  name: string;
  business: string;
  circuit: CircuitStop[];
  products: Product[];
}

interface InfillStop {
  lsoa_name: string;
  lsoa_code: string;
  borough: string;
  lat: number;
  lng: number;
  demand_gbp: number;
  residents: number;
  market_a: string;
  market_b: string;
  day: string;
}

interface StockItem {
  sku: string;
  name: string;
  estimated_qty: number;
  unit: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function formatDay(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1, 3);
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object';
}

function isTraderProfile(x: unknown): x is TraderProfile {
  if (!isRecord(x)) return false;
  return typeof x.name === 'string' && Array.isArray(x.circuit);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function TraderPage() {
  const [profile, setProfile] = useState<TraderProfile | null>(null);
  const [stops, setStops] = useState<InfillStop[]>([]);
  const [acceptedStops, setAcceptedStops] = useState<Set<string>>(new Set());
  const [acceptingStop, setAcceptingStop] = useState<string | null>(null);

  const [initializing, setInitializing] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [infillBanner, setInfillBanner] = useState<string | null>(null);

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockLoading, setStockLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setInitializing(true);
    setBootError(null);
    setInfillBanner(null);
    try {
      const [profileRes, infillRes] = await Promise.all([
        fetch(`/api/trader/profile?traderId=${TRADER_ID}`),
        fetch(`/api/trader/infill?traderId=${TRADER_ID}`),
      ]);
      const profileRaw: unknown = await profileRes.json();
      const infillRaw: unknown = await infillRes.json();

      if (!profileRes.ok || !isTraderProfile(profileRaw)) {
        const msg =
          isRecord(profileRaw) && typeof profileRaw.error === 'string'
            ? profileRaw.error
            : 'Could not load trader profile.';
        setBootError(msg);
        setProfile(null);
        setStops([]);
        return;
      }
      setProfile(profileRaw);

      if (!infillRes.ok || !Array.isArray(infillRaw)) {
        const msg =
          isRecord(infillRaw) && typeof infillRaw.error === 'string'
            ? infillRaw.error
            : 'Could not load route suggestions.';
        setInfillBanner(msg);
        setStops([]);
      } else {
        setStops(infillRaw as InfillStop[]);
      }
    } catch {
      setBootError('Network error loading dashboard.');
      setProfile(null);
      setStops([]);
    } finally {
      setInitializing(false);
    }
  }, []);

  const refreshInfill = useCallback(async () => {
    if (!profile) return;
    try {
      const infillRes = await fetch(
        `/api/trader/infill?traderId=${TRADER_ID}`
      );
      const infillRaw: unknown = await infillRes.json();
      if (infillRes.ok && Array.isArray(infillRaw)) {
        setStops(infillRaw as InfillStop[]);
        setInfillBanner(null);
      } else if (!infillRes.ok) {
        const msg =
          isRecord(infillRaw) && typeof infillRaw.error === 'string'
            ? infillRaw.error
            : 'Could not refresh route suggestions.';
        setInfillBanner(msg);
      }
    } catch {
      /* ignore background refresh errors */
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const id = window.setInterval(() => void refreshInfill(), 25000);
    const onVis = () => {
      if (document.visibilityState === 'visible') void refreshInfill();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [profile, refreshInfill]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleAcceptStop = useCallback(async (stop: InfillStop) => {
    setAcceptingStop(stop.lsoa_code);
    try {
      const res = await fetch('/api/trader/accept-stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traderId: TRADER_ID,
          lsoaCode: stop.lsoa_code,
          date: '2026-05-14',
          scheduledTime: '2026-05-14T17:00:00',
          expectedValuePence: stop.demand_gbp * 100,
        }),
      });
      if (res.ok) {
        setAcceptedStops((prev) => new Set([...prev, stop.lsoa_code]));
        toast.success(`Stop confirmed: ${stop.lsoa_name}`);
        void refreshInfill();
      } else {
        let msg = 'Could not confirm stop.';
        try {
          const body: unknown = await res.json();
          if (isRecord(body) && typeof body.error === 'string') msg = body.error;
        } catch {
          /* ignore */
        }
        toast.error(msg);
      }
    } catch {
      toast.error('Failed to accept stop. Please try again.');
    } finally {
      setAcceptingStop(null);
    }
  }, [refreshInfill]);

  const handleStockUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setStockLoading(true);
      setStockItems([]);
      try {
        const base64 = await fileToBase64(file);
        const res = await fetch('/api/trader/recognise-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });
        const data: unknown = await res.json();
        if (!res.ok) {
          const msg =
            isRecord(data) && typeof data.error === 'string'
              ? data.error
              : 'Stock recognition failed.';
          toast.error(msg);
          return;
        }
        const items = isRecord(data) && Array.isArray(data.items) ? data.items : [];
        setStockItems(items as StockItem[]);
        toast.success(`Identified ${items.length} items`);
      } catch {
        toast.error('Failed to recognise stock. Please try again.');
      } finally {
        setStockLoading(false);
      }
    },
    []
  );

  const handleSendMessage = useCallback(
    async (question: string) => {
      if (!question.trim()) return;
      const userMsg: ChatMessage = { role: 'user', content: question };
      setMessages((prev) => [...prev, userMsg]);
      setChatInput('');
      setChatLoading(true);
      try {
        const res = await fetch('/api/trader/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, traderId: TRADER_ID }),
        });
        const data: unknown = await res.json();
        if (!res.ok) {
          const msg =
            isRecord(data) && typeof data.error === 'string'
              ? data.error
              : 'Assistant unavailable.';
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: msg },
          ]);
          return;
        }
        const reply =
          isRecord(data) && typeof data.response === 'string'
            ? data.response
            : 'No response from assistant.';
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: reply },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, I could not get a response. Please try again.',
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    []
  );

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading trader dashboard...</p>
      </div>
    );
  }

  if (bootError || !profile) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Dashboard unavailable</CardTitle>
            <CardDescription>{bootError ?? 'Trader profile could not be loaded.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => void loadDashboard()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-4 pb-8">
      {/* Header card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{profile.name}</CardTitle>
          <CardDescription>{profile.business}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profile.circuit.map((stop) => (
              <Badge key={`${stop.market}-${stop.day}`} variant="secondary">
                {stop.town} {formatDay(stop.day)}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Infill stops */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Profitable detours along your route
        </h2>
        <p className="mb-2 text-xs text-muted-foreground">
          Only areas with over £50 in pending orders for your stall appear here.
          Demand updates about every 25 seconds, or when you return to this tab.
        </p>
        {infillBanner ? (
          <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            {infillBanner}
          </p>
        ) : null}
        <div className="space-y-3">
          {stops.map((stop) => {
            const isAccepted = acceptedStops.has(stop.lsoa_code);
            const isAccepting = acceptingStop === stop.lsoa_code;
            return (
              <Card
                key={stop.lsoa_code}
                className={isAccepted ? 'opacity-60' : ''}
              >
                <CardHeader>
                  <CardTitle>
                    {stop.lsoa_name}{' '}
                    <span className="font-normal text-muted-foreground">
                      &middot; {stop.borough}
                    </span>
                  </CardTitle>
                  {isAccepted && (
                    <Badge variant="secondary">Confirmed &#10003;</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-2xl font-bold">
                    &pound;{stop.demand_gbp}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stop.residents} resident{stop.residents !== 1 ? 's' : ''}{' '}
                    &middot; between {stop.market_a} and {stop.market_b} &middot;{' '}
                    {stop.day}
                  </p>
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={isAccepted || isAccepting}
                    onClick={() => handleAcceptStop(stop)}
                  >
                    {isAccepting
                      ? 'Accepting...'
                      : isAccepted
                        ? 'Accepted'
                        : 'Accept stop'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Stock recognition */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Update your stock</h2>
        <Card>
          <CardContent className="space-y-3">
            <Input
              type="file"
              accept="image/*"
              onChange={handleStockUpload}
              aria-label="Upload stock image"
            />
            {stockLoading && (
              <p className="text-sm text-muted-foreground">
                Identifying produce...
              </p>
            )}
            {stockItems.length > 0 && (
              <ul className="space-y-1">
                {stockItems.map((item) => (
                  <li key={item.sku} className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">&#10003;</span>
                    <span>
                      {item.name} &mdash; {item.estimated_qty} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Chat section */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Ask SaveMyStomach</h2>
        <Card>
          <CardContent className="space-y-3">
            {/* Suggestion chips */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {[
                  "What's my best stop this week?",
                  'Which products should I bring more of?',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-colors hover:bg-muted"
                    onClick={() => handleSendMessage(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            {messages.length > 0 && (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'ml-auto max-w-[80%] bg-blue-100 text-right'
                        : 'mr-auto max-w-[80%] bg-gray-100 text-left'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {chatLoading && (
                  <div className="mr-auto max-w-[80%] rounded-lg bg-gray-100 px-3 py-2 text-sm text-muted-foreground">
                    Thinking...
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(chatInput);
              }}
            >
              <Input
                placeholder="Ask a question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                aria-label="Chat message"
              />
              <Button type="submit" disabled={chatLoading || !chatInput.trim()}>
                Send
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
