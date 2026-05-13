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
import Map from '@/components/Map';

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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function formatDay(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1, 3);
}

export default function TraderPage() {
  const [profile, setProfile] = useState<TraderProfile | null>(null);
  const [stops, setStops] = useState<InfillStop[]>([]);
  const [acceptedStops, setAcceptedStops] = useState<Set<string>>(new Set());
  const [acceptingStop, setAcceptingStop] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [profileRes, infillRes] = await Promise.all([
        fetch(`/api/trader/profile?traderId=${TRADER_ID}`),
        fetch(`/api/trader/infill?traderId=${TRADER_ID}`),
      ]);
      const profileData: TraderProfile = await profileRes.json();
      const infillData: InfillStop[] = await infillRes.json();
      setProfile(profileData);
      setStops(infillData);
    }
    loadData();
  }, []);

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
      }
    } catch {
      toast.error('Failed to accept stop. Please try again.');
    } finally {
      setAcceptingStop(null);
    }
  }, []);

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
        const data: { response: string } = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.response },
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

  if (!profile) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </main>
    );
  }

  const mapMarkers = stops.map((s) => ({
    lat: s.lat,
    lng: s.lng,
    label: `${s.lsoa_name} — £${s.demand_gbp}`,
    type: 'stop' as const,
  }));

  const circuitMarkers = profile.circuit.map((c) => ({
    lat: 0,
    lng: 0,
    label: c.market,
    type: 'market' as const,
  }));

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{profile.business}</CardTitle>
            <CardDescription>{profile.name}</CardDescription>
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

        {/* Map */}
        {stops.length > 0 && (
          <Map
            center={[stops[0].lat, stops[0].lng]}
            markers={mapMarkers}
            zoom={10}
          />
        )}

        {/* Infill stops */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Profitable detours along your route
          </h2>
          {stops.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No demand signals yet. Check back as residents place orders.
                </p>
              </CardContent>
            </Card>
          )}
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
                    <CardTitle className="text-base">
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
                      &middot; near {stop.market_a} &middot; {stop.day}
                    </p>
                    <Button
                      size="lg"
                      className="h-12 w-full text-base"
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

        {/* Chat */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">Ask SaveMyStomach</h2>
          <Card>
            <CardContent className="space-y-3 pt-4">
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2">
                  {[
                    "What's my best stop this week?",
                    'Which products should I bring more of?',
                    'How much demand is there in Tower Hamlets?',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                      onClick={() => handleSendMessage(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {messages.length > 0 && (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'ml-auto max-w-[80%] bg-primary/10 text-right'
                          : 'mr-auto max-w-[80%] bg-muted text-left'
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="mr-auto max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                      Thinking...
                    </div>
                  )}
                </div>
              )}

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
                  className="h-11"
                  aria-label="Chat message"
                />
                <Button
                  type="submit"
                  className="h-11"
                  disabled={chatLoading || !chatInput.trim()}
                >
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
