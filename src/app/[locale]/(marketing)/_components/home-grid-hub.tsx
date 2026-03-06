"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { History, Shield, Sigma, Spade, TrendingUp, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StartNewHandButton } from "@/components/start-new-hand-button";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

export function HomeGridHub() {
  const tStart = useTranslations("startHub");
  const tCommon = useTranslations("common");
  const tTools = useTranslations("toolsHub");
  const { user } = useAuthStore();

  return (
    <main className="relative flex h-full min-h-0 flex-1 overflow-hidden">
      <section className="relative z-10 flex h-full min-h-0 w-full items-stretch px-4 pb-5 pt-24 sm:px-6 sm:pb-6 sm:pt-28 lg:px-8 lg:pb-8 lg:pt-32">
        <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
          <div className="my-auto mx-auto grid w-full max-w-2xl grid-cols-1 gap-4">
            <Card className="relative overflow-hidden rounded-3xl border-border/75 bg-card p-5 shadow-[var(--shadow-soft)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-primary/10 to-transparent" />
              <div className="relative flex items-center gap-2">
                <Spade className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  {tStart("cardReviewKicker")}
                </h2>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <StartNewHandButton size="lg" location="marketing" />
                {user ? (
                  <Button asChild size="lg" variant="outline" className="rounded-2xl">
                    <Link href="/history">
                      <History className="mr-2 h-4 w-4" />
                      {tCommon("handHistory")}
                    </Link>
                  </Button>
                ) : null}
              </div>
            </Card>

            <Card className="relative overflow-hidden rounded-3xl border-border/75 bg-card p-5 shadow-[var(--shadow-soft)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-linear-to-b from-chart-2/18 to-transparent" />
              <div className="relative flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  {tStart("cardToolsTitle")}
                </h2>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button
                  asChild
                  variant="secondary"
                  className="h-11 rounded-xl text-white hover:text-white [&_svg]:text-white"
                >
                  <Link href="/tools/outs">
                    <Sigma className="mr-2 h-4 w-4" />
                    {tTools("outsTitle")}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  className="h-11 rounded-xl text-white hover:text-white [&_svg]:text-white"
                >
                  <Link href="/tools/odds">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    {tTools("oddsTitle")}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  className="h-11 rounded-xl text-white hover:text-white [&_svg]:text-white"
                >
                  <Link href="/tools/insurance">
                    <Shield className="mr-2 h-4 w-4" />
                    {tTools("insuranceTitle")}
                  </Link>
                </Button>
              </div>
            </Card>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-center gap-2 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Link href="/terms" className="rounded-md px-1.5 py-1 transition-colors hover:text-foreground">
              {tStart("footerTerms")}
            </Link>
            <span className="opacity-40">/</span>
            <Link
              href="/privacy"
              className="rounded-md px-1.5 py-1 transition-colors hover:text-foreground"
            >
              {tStart("footerPrivacy")}
            </Link>
            <span className="opacity-40">/</span>
            <Link
              href="/contact"
              className="rounded-md px-1.5 py-1 transition-colors hover:text-foreground"
            >
              {tStart("footerContact")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
