import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-4 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Fresh food, delivered to
            <br />
            <span className="text-primary">forgotten neighbourhoods</span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Connecting communities with local traders who bring fruit, veg, and
            essentials straight to your street.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button
            size="lg"
            className="h-12 px-6 text-base"
            render={<Link href="/resident" />}
          >
            Find food near me
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-6 text-base"
            render={<Link href="/trader" />}
          >
            I sell food
          </Button>
        </div>

        <div
          className="flex flex-col gap-6 border-t border-border/60 pt-8 sm:flex-row sm:gap-10"
          aria-label="How it works"
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">
              1. Enter your postcode
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              We find traders scheduled near you.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">
              2. Pick your items
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              Browse what each van carries and order ahead.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">
              3. Collect on the day
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground">
              Your order is ready when the van arrives.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
