import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight">SaveMyStomach</h1>
          <p className="text-lg text-muted-foreground">
            Fresh food delivered to forgotten neighbourhoods
          </p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>How would you like to use SaveMyStomach?</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button size="lg" className="w-full" render={<Link href="/resident" />}>
                I&apos;m a resident
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                render={<Link href="/trader" />}
              >
                I&apos;m a trader
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
