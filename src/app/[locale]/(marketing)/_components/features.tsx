import { Card } from "@/components/ui/card";
import {
  Check,
  Shield,
  Zap,
  History,
  LayoutDashboard,
} from "lucide-react";
import { DefaultContainer } from "@/components/default-container";

export function Features() {
  return (
    <section id="features" className="py-6 sm:py-16">
      <DefaultContainer>
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Built for real hand review
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              MVP focuses on correctness + replay. Fancy stuff comes later.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: <Shield className="h-4 w-4" />,
              title: "Event log is truth",
              desc: "Store events, replay to compute state. No fragile snapshots.",
            },
            {
              icon: <History className="h-4 w-4" />,
              title: "Undo / Redo / Jump",
              desc: "Explore lines quickly, even in long hands.",
            },
            {
              icon: <Zap className="h-4 w-4" />,
              title: "Fast input",
              desc: "Minimal clicks, rule-safe actions, clear validation.",
            },
            {
              icon: <LayoutDashboard className="h-4 w-4" />,
              title: "Saved hands dashboard",
              desc: "Find, open, and replay hands anytime.",
            },
            {
              icon: <Check className="h-4 w-4" />,
              title: "Record & Review same UI",
              desc: "Same screen. Different permissions. Fewer bugs.",
            },
          ].map((f) => (
            <Card
              key={f.title}
              className="rounded-3xl border bg-card/70 p-5 backdrop-blur"
            >
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-2xl border bg-background">
                  {f.icon}
                </div>
                <div className="text-base font-semibold">{f.title}</div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </DefaultContainer>
    </section>
  );
}
