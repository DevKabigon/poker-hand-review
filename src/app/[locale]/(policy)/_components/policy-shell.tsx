"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type FooterLink = {
  href: string;
  label: string;
};

type PolicyPageShellProps = {
  backLabel: string;
  badge: string;
  title: string;
  summary: string;
  updatedLabel?: string;
  updatedValue?: string;
  heroIcon: ReactNode;
  footerLinks: FooterLink[];
  footerNote: string;
  children: ReactNode;
};

type PolicySectionCardProps = {
  icon: ReactNode;
  kicker: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function PolicyPageShell({
  backLabel,
  badge,
  title,
  summary,
  updatedLabel,
  updatedValue,
  heroIcon,
  footerLinks,
  footerNote,
  children,
}: PolicyPageShellProps) {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-transparent text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-72 w-72 rounded-full bg-chart-2/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <main className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 md:pt-12">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 rounded-xl"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {badge}
          </Badge>
        </div>

        <Card className="rounded-3xl border-border/80 bg-card/80 p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl md:p-7">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              {heroIcon}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
                {summary}
              </p>
              {updatedLabel && updatedValue ? (
                <p className="mt-3 text-xs font-semibold text-muted-foreground md:text-sm">
                  {updatedLabel}:{" "}
                  <span className="text-foreground">{updatedValue}</span>
                </p>
              ) : null}
            </div>
          </div>
        </Card>

        <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>

        <footer className="mt-10 border-t border-border/70 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            {footerLinks.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{footerNote}</p>
        </footer>
      </main>
    </div>
  );
}

export function PolicySectionCard({
  icon,
  kicker,
  title,
  children,
  className,
}: PolicySectionCardProps) {
  return (
    <Card
      className={cn(
        "rounded-3xl border-border/80 bg-card/70 p-5 shadow-[var(--shadow-soft)] backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border bg-background text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {kicker}
          </p>
          <h2 className="text-base font-bold tracking-tight">{title}</h2>
        </div>
      </div>
      <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </Card>
  );
}

