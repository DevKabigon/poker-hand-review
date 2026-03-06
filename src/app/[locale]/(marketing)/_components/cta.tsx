import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";
import { StartNewHandButton } from "@/components/start-new-hand-button";
import { DefaultContainer } from "@/components/default-container";

export function CTA() {
  return (
    <section className="pb-6 sm:pb-20">
      <DefaultContainer>
        <Card className="rounded-4xl border bg-card/60 p-7 backdrop-blur sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Ready to review your next hand?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start with the MVP. Keep the data model clean for replay.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <StartNewHandButton size={"lg"} location={"marketing"} />
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="rounded-2xl"
              >
                <Link href="/hand">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Hand Review
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </DefaultContainer>
    </section>
  );
}
