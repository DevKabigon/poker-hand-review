import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Check, Zap, History, LayoutDashboard } from "lucide-react";
import { DefaultContainer } from "@/components/default-container";
import { StartNewHandButton } from "@/components/start-new-hand-button";

export function Hero() {
  return (
    <section className="relative py-6 sm:py-20">
      <DefaultContainer>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                <Zap className="mr-1 h-3.5 w-3.5" />
                Fast hand logging
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                <History className="mr-1 h-3.5 w-3.5" />
                Undo / Replay friendly
              </Badge>
            </div>

            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Record hands exactly.
              <br className="hidden sm:block" />
              Replay and improve faster.
            </h1>

            <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
              Poker Hand Review is a lightweight SaaS for clean, accurate hand
              histories—built for fast input, consistent rules, and effortless
              replay.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <StartNewHandButton location={"marketing"} />
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="rounded-2xl"
              >
                <Link href="/history">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  View saved hands
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                "Accurate action order by street",
                "Replay with Undo / Jump",
                "Same UI for record & review",
                "Saved-hand workflow from dashboard",
              ].map((t) => (
                <div key={t} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-foreground/80" />
                  <span>{t}</span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Tip: If you’re building toward DB replay, store the event sequence
              as the single source of truth.
            </p>
          </div>

          {/* Preview card */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-linear-to-b from-primary/10 to-transparent blur-2xl" />
            <Card className="rounded-3xl border bg-card/70 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-background">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Hand Timeline</div>
                    <div className="text-xs text-muted-foreground">
                      Event log → derived state
                    </div>
                  </div>
                </div>
                <Badge className="rounded-full" variant="secondary">
                  Demo
                </Badge>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Preflop
                    </span>
                    <span className="text-xs text-muted-foreground">
                      6-max · 100BB
                    </span>
                  </div>
                  <div className="mt-2 space-y-2 text-sm">
                    {[
                      "UTG opens 2.5BB",
                      "HJ calls 2.5BB",
                      "BTN 3-bets 9BB",
                      "BB folds",
                      "UTG calls",
                    ].map((l) => (
                      <div
                        key={l}
                        className="flex items-center justify-between"
                      >
                        <span>{l}</span>
                        <span className="text-xs text-muted-foreground">
                          event
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Flop
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Pot · 19.5BB
                    </span>
                  </div>
                  <div className="mt-2 space-y-2 text-sm">
                    {["UTG checks", "BTN bets 6BB", "UTG calls 6BB"].map(
                      (l) => (
                        <div
                          key={l}
                          className="flex items-center justify-between"
                        >
                          <span>{l}</span>
                          <span className="text-xs text-muted-foreground">
                            derived
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border bg-background/60 p-3 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Replay
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Undo / Jump
                    </span>
                  </div>

                  <div className="mt-3 w-full flex justify-center gap-2">
                    <Button variant="secondary" className="w-[30%] rounded-2xl">
                      Undo
                    </Button>
                    <Button variant="secondary" className="w-[30%] rounded-2xl">
                      Redo
                    </Button>
                    <Button className="w-[30%] rounded-2xl">Jump</Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </DefaultContainer>
    </section>
  );
}
