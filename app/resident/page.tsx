"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Map from "@/components/Map";

interface Product {
  sku: string;
  name: string;
  price_pence: number;
  unit: string;
}

interface TraderStop {
  trader_id: string;
  trader_name: string;
  scheduled_time: string;
  lat: number;
  lng: number;
  available_products: Product[];
}

interface LookupResult {
  lsoa_code: string;
  lsoa_name: string;
  borough: string;
  lat: number;
  lng: number;
  upcoming_stops: TraderStop[];
}

type ViewState =
  | { step: "postcode" }
  | { step: "stops"; data: LookupResult }
  | { step: "order"; data: LookupResult; stop: TraderStop }
  | {
      step: "confirmed";
      data: LookupResult;
      stop: TraderStop;
      items: Record<string, number>;
      orderId: string;
    };

function formatPrice(pence: number): string {
  return "£" + (pence / 100).toFixed(2);
}

function formatStopTime(iso: string): { day: string; time: string } {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { day, time };
}

function OrderSummaryLine({
  name,
  quantity,
  totalPence,
}: {
  name: string;
  quantity: number;
  totalPence: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-sm text-foreground">
        {name} <span className="text-muted-foreground">x{quantity}</span>
      </span>
      <span className="text-sm font-medium tabular-nums">
        {formatPrice(totalPence)}
      </span>
    </div>
  );
}

export default function ResidentPage() {
  const [view, setView] = useState<ViewState>({ step: "postcode" });
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/resident/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? "Could not find your area. Check your postcode."
        );
      }
      const data: LookupResult = await res.json();
      setView({ step: "stops", data });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectStop(data: LookupResult, stop: TraderStop) {
    const initial: Record<string, number> = {};
    for (const p of stop.available_products) {
      initial[p.sku] = 0;
    }
    setQuantities(initial);
    setView({ step: "order", data, stop });
  }

  function updateQuantity(sku: string, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [sku]: Math.max(0, (prev[sku] ?? 0) + delta),
    }));
  }

  async function handlePlaceOrder(stop: TraderStop, data: LookupResult) {
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([sku, qty]) => ({ sku, qty }));

    if (items.length === 0) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/resident/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trader_id: stop.trader_id,
          lsoa_code: data.lsoa_code,
          scheduled_time: stop.scheduled_time,
          items,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Could not place your order.");
      }
      const result = await res.json();
      setView({
        step: "confirmed",
        data,
        stop,
        items: quantities,
        orderId: result.order_id,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function calculateTotal(products: Product[]): number {
    return products.reduce(
      (sum, p) => sum + p.price_pence * (quantities[p.sku] ?? 0),
      0
    );
  }

  const orderedProducts =
    view.step === "confirmed"
      ? view.stop.available_products.filter(
          (p) => (view.items[p.sku] ?? 0) > 0
        )
      : [];

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-lg">
        {/* Postcode entry */}
        {view.step === "postcode" && (
          <div className="animate-fade-in-up">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Find food near you</CardTitle>
                <CardDescription className="leading-relaxed">
                  Enter your postcode and we will show you upcoming trader stops
                  in your area.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleLookup}
                  className="flex flex-col gap-3"
                  aria-label="Postcode lookup"
                >
                  <Input
                    placeholder="e.g. E2 6BG"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    aria-label="Your postcode"
                    aria-describedby={error ? "lookup-error" : undefined}
                    aria-invalid={error ? true : undefined}
                    required
                    autoComplete="postal-code"
                    className="h-12 text-base"
                  />
                  {error && (
                    <p
                      id="lookup-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {error}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full text-base"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2
                          className="size-4 animate-spin-slow"
                          aria-hidden="true"
                        />
                        Searching...
                      </span>
                    ) : (
                      "Find food near me"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stop listing */}
        {view.step === "stops" && (
          <div className="flex flex-col gap-5 animate-fade-in-up">
            <div
              role="img"
              aria-label={`Map showing trader stops near ${view.data.lsoa_name}`}
            >
              <Map
                center={[view.data.lat, view.data.lng]}
                markers={[
                  {
                    lat: view.data.lat,
                    lng: view.data.lng,
                    label: "Your area",
                    type: "resident" as const,
                  },
                  ...view.data.upcoming_stops.map((s) => ({
                    lat: s.lat,
                    lng: s.lng,
                    label: s.trader_name,
                    type: "stop" as const,
                  })),
                ]}
              />
            </div>

            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">Upcoming stops</h2>
              <span className="text-sm text-muted-foreground">
                {view.data.upcoming_stops.length} near {view.data.borough}
              </span>
            </div>

            {view.data.upcoming_stops.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No stops scheduled in your area yet. Check back soon.
                  </p>
                </CardContent>
              </Card>
            )}

            {view.data.upcoming_stops.map((stop) => {
              const { day, time } = formatStopTime(stop.scheduled_time);
              return (
                <Card key={stop.trader_id} className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {stop.trader_name}
                    </CardTitle>
                    <CardDescription>
                      {day} at {time}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div
                      className="flex flex-wrap gap-1.5"
                      aria-label={`Available: ${stop.available_products.map((p) => p.name).join(", ")}`}
                    >
                      {stop.available_products.slice(0, 4).map((p) => (
                        <Badge key={p.sku} variant="secondary">
                          {p.name}
                        </Badge>
                      ))}
                      {stop.available_products.length > 4 && (
                        <Badge variant="outline">
                          +{stop.available_products.length - 4} more
                        </Badge>
                      )}
                    </div>
                    <Button
                      className="h-11 w-full text-sm"
                      onClick={() => handleSelectStop(view.data, stop)}
                    >
                      Order from {stop.trader_name}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}

            <Button
              variant="ghost"
              className="h-11 w-full text-sm"
              onClick={() => setView({ step: "postcode" })}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Try a different postcode
            </Button>
          </div>
        )}

        {/* Order builder */}
        {view.step === "order" && (
          <div className="flex flex-col gap-5 animate-fade-in-up">
            <button
              onClick={() => setView({ step: "stops", data: view.data })}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label="Back to all stops"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              All stops
            </button>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {view.stop.trader_name}
                </CardTitle>
                <CardDescription>
                  Select items to pre-order for collection.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="flex flex-col divide-y divide-border/60"
                  role="list"
                  aria-label="Available products"
                >
                  {view.stop.available_products.map((product) => {
                    const qty = quantities[product.sku] ?? 0;
                    return (
                      <div
                        key={product.sku}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                        role="listitem"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium leading-snug">
                            {product.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatPrice(product.price_pence)} / {product.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => updateQuantity(product.sku, -1)}
                            disabled={qty === 0}
                            aria-label={`Remove one ${product.name}`}
                          >
                            -
                          </Button>
                          <span
                            className="w-8 text-center text-sm tabular-nums"
                            aria-live="polite"
                            aria-atomic="true"
                          >
                            {qty}
                          </span>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={() => updateQuantity(product.sku, 1)}
                            aria-label={`Add one ${product.name}`}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-3 pt-4">
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatPrice(
                      calculateTotal(view.stop.available_products)
                    )}
                  </span>
                </div>
                <Button
                  className="h-12 w-full text-base"
                  disabled={
                    loading ||
                    calculateTotal(view.stop.available_products) === 0
                  }
                  onClick={() => handlePlaceOrder(view.stop, view.data)}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2
                        className="size-4 animate-spin-slow"
                        aria-hidden="true"
                      />
                      Placing order...
                    </span>
                  ) : (
                    `Place order — ${formatPrice(calculateTotal(view.stop.available_products))}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Confirmation */}
        {view.step === "confirmed" &&
          (() => {
            const { day, time } = formatStopTime(view.stop.scheduled_time);
            const confirmedTotal = orderedProducts.reduce(
              (sum, p) => sum + p.price_pence * (view.items[p.sku] ?? 0),
              0
            );
            return (
              <div className="flex flex-col gap-6 animate-fade-in-up">
                <div className="flex flex-col items-center gap-4 pt-4">
                  <div className="animate-check-pop">
                    <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2
                        className="size-12 text-primary"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <h2 className="text-2xl font-bold tracking-tight">
                      Order confirmed
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Reference:{" "}
                      <span className="font-mono text-xs">
                        {view.orderId}
                      </span>
                    </p>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Collection details</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        When
                      </span>
                      <span className="text-base font-semibold">
                        {day} at {time}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Trader
                      </span>
                      <span className="text-base">
                        {view.stop.trader_name}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Your items</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col">
                    <div className="flex flex-col divide-y divide-border/60">
                      {orderedProducts.map((p) => (
                        <OrderSummaryLine
                          key={p.sku}
                          name={p.name}
                          quantity={view.items[p.sku] ?? 0}
                          totalPence={
                            p.price_pence * (view.items[p.sku] ?? 0)
                          }
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="text-base font-bold tabular-nums">
                        {formatPrice(confirmedTotal)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  variant="outline"
                  className="h-11 w-full text-sm"
                  render={<Link href="/" />}
                >
                  Back to home
                </Button>
              </div>
            );
          })()}
      </div>
    </main>
  );
}
