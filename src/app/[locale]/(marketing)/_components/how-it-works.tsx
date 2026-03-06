import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DefaultContainer } from "@/components/default-container";

export function HowItWorks() {
  return (
    <section id="how" className="py-6 sm:py-16">
      <DefaultContainer>
        <Card className="rounded-4xl border bg-card/60 p-6 backdrop-blur sm:p-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                How it works
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Simple pipeline. Reliable replay.
              </p>
            </div>

            <div className="lg:col-span-2">
              <ol className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    step: "01",
                    title: "Log events",
                    desc: "Actions and reveals become timeline events.",
                  },
                  {
                    step: "02",
                    title: "Derive state",
                    desc: "Pot, turn, min-raise, stacks are computed.",
                  },
                  {
                    step: "03",
                    title: "Replay anytime",
                    desc: "Undo/Jump replays events to any point instantly.",
                  },
                ].map((s) => (
                  <li
                    key={s.step}
                    className="rounded-3xl border bg-background/50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {s.step}
                      </span>
                      <Badge variant="secondary" className="rounded-full">
                        MVP
                      </Badge>
                    </div>
                    <div className="mt-2 text-base font-semibold">
                      {s.title}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.desc}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Works great for DB storage: save events, not UI state.
                </div>
              </div>
            </div>
          </div>
        </Card>
      </DefaultContainer>
    </section>
  );
}
