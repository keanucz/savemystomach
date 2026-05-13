"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
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
  demo?: boolean;
}

type ViewState =
  | { step: "postcode" }
  | { step: "stops"; data: LookupResult }
  | { step: "order"; data: LookupResult; stop: TraderStop }
      | {
      step: "confirmed";
      stop: TraderStop;
      items: Record<string, number>;
      orderId: string;
      orderDemo?: boolean;
      orderDemoReason?: string;
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

export default function ResidentPage() {
  const [view, setView] = useState<ViewState>({ step: "postcode" });
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setLookupError(null);
    try {
      const res = await fetch("/api/resident/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcode }),
      });
      const data: LookupResult & { error?: string; demo?: boolean } =
        await res.json();
      if (!res.ok || data.error) {
        setLookupError(
          typeof data.error === "string"
            ? data.error
            : "Something went wrong. Please try again."
        );
        return;
      }
      if (!data.lsoa_code || !Array.isArray(data.upcoming_stops)) {
        setLookupError("Unexpected response from server.");
        return;
      }
      setView({ step: "stops", data });
    } finally {
      setLoading(false);
    }
  }

  function handleSelectStop(data: LookupResult, stop: TraderStop) {
    setOrderError(null);
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

  async function handlePlaceOrder(stop: TraderStop, lsoaCode: string) {
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([sku, qty]) => ({ sku, qty }));

    if (items.length === 0) return;

    setLoading(true);
    setOrderError(null);
    try {
      const res = await fetch("/api/resident/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postcode: postcode.trim().toUpperCase() || undefined,
          trader_id: stop.trader_id,
          lsoa_code: lsoaCode,
          scheduled_time: stop.scheduled_time,
          items,
        }),
      });
      const result: {
        order_id?: string;
        error?: string;
        demo?: boolean;
        demo_reason?: string;
      } = await res.json();
      if (!res.ok || result.error || !result.order_id) {
        setOrderError(
          typeof result.error === "string"
            ? result.error
            : "Could not place order. Please try again."
        );
        return;
      }
      setView({
        step: "confirmed",
        stop,
        items: quantities,
        orderId: result.order_id,
        orderDemo: result.demo === true,
        orderDemoReason:
          typeof result.demo_reason === "string"
            ? result.demo_reason
            : undefined,
      });
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

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-md">
        {view.step === "postcode" && (
          <Card>
            <CardHeader>
              <CardTitle>Find food near you</CardTitle>
              <CardDescription>
                Enter your postcode and we&apos;ll show you upcoming trader
                stops in your area.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="flex flex-col gap-3">
                <Input
                  placeholder="E2 6BG"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  aria-label="Enter your postcode"
                  required
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Searching..." : "Find food near me"}
                </Button>
                {lookupError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {lookupError}
                  </p>
                ) : null}
              </form>
            </CardContent>
          </Card>
        )}

        {view.step === "stops" && (
          <div className="flex flex-col gap-4">
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

            {view.data.demo && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                Demo data: the live postcode lookup is unavailable.
              </p>
            )}

            <h2 className="text-lg font-semibold">Upcoming trader stops</h2>

            {view.data.upcoming_stops.map((stop) => {
              const { day, time } = formatStopTime(stop.scheduled_time);
              return (
                <Card key={stop.trader_id}>
                  <CardHeader>
                    <CardTitle>{stop.trader_name}</CardTitle>
                    <CardDescription>
                      {day} at {time}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-1">
                      {stop.available_products.slice(0, 3).map((p) => (
                        <Badge key={p.sku} variant="secondary">
                          {p.name}
                        </Badge>
                      ))}
                      {stop.available_products.length > 3 && (
                        <Badge variant="outline">
                          +{stop.available_products.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleSelectStop(view.data, stop)}
                    >
                      Order from this stop
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {view.step === "order" && (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{view.stop.trader_name}</CardTitle>
                <CardDescription>Select your items</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {view.stop.available_products.map((product) => (
                  <div
                    key={product.sku}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(product.price_pence)} / {product.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => updateQuantity(product.sku, -1)}
                        aria-label={`Decrease ${product.name} quantity`}
                      >
                        -
                      </Button>
                      <span className="w-6 text-center">
                        {quantities[product.sku] ?? 0}
                      </span>
                      <Button
                        size="icon-sm"
                        variant="outline"
                        onClick={() => updateQuantity(product.sku, 1)}
                        aria-label={`Increase ${product.name} quantity`}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>
                    {formatPrice(
                      calculateTotal(view.stop.available_products)
                    )}
                  </span>
                </div>
                <Button
                  className="w-full"
                  disabled={
                    loading ||
                    calculateTotal(view.stop.available_products) === 0
                  }
                  onClick={() =>
                    handlePlaceOrder(view.stop, view.data.lsoa_code)
                  }
                >
                  {loading
                    ? "Placing order..."
                    : `Place order — ${formatPrice(calculateTotal(view.stop.available_products))}`}
                </Button>
                {orderError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {orderError}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}

        {view.step === "confirmed" && (() => {
          const { day, time } = formatStopTime(view.stop.scheduled_time);
          return (
            <Card>
              <CardHeader className="items-center text-center">
                <CheckCircle2
                  className="size-16 text-green-500"
                  aria-hidden="true"
                />
                <CardTitle className="text-xl">Order confirmed</CardTitle>
                <CardDescription>
                  Order ID: {view.orderId}
                  {view.orderDemo && (
                    <span className="mt-1 block text-amber-700 dark:text-amber-400">
                      {view.orderDemoReason ??
                        "This confirmation was not saved to the live database (demo fallback)."}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 text-center">
                <p className="text-2xl font-bold">
                  Your van arrives {day} at {time}
                </p>
                <div className="w-full space-y-1 text-sm">
                  {view.stop.available_products
                    .filter((p) => (view.items[p.sku] ?? 0) > 0)
                    .map((p) => (
                      <div
                        key={p.sku}
                        className="flex justify-between"
                      >
                        <span>
                          {p.name} x{view.items[p.sku]}
                        </span>
                        <span>
                          {formatPrice(
                            p.price_pence * (view.items[p.sku] ?? 0)
                          )}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>
    </main>
  );
}
