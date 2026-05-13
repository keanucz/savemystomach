import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TraderPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trader Dashboard</CardTitle>
            <CardDescription className="leading-relaxed">
              Manage your routes, stock, and customer orders from here. We are
              still building this out.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/40 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Dashboard launching soon. You will be able to view pre-orders,
                plan routes, and update your stock.
              </p>
            </div>
            <Button
              variant="outline"
              className="h-11 w-full text-sm"
              render={<Link href="/" />}
            >
              Back to home
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
