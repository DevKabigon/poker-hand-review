"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { DefaultContainer } from "@/components/default-container";
import { StartNewHandButton } from "@/components/start-new-hand-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listHands } from "@/features/hand/db/handService";
import { getPositionLabels } from "@/features/hand/domain/position";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import type { HandRecord } from "@/features/hand/db/types";
import type { HandItem } from "./handItem";
import { StreetBadge } from "./street-badge";

type RecentHand = {
  id: string;
  title: string;
  createdAt: string;
  street: HandItem["street"];
  heroPos?: string;
  pot?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function formatCreatedAt(input: string) {
  const date = new Date(input);
  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} ${timePart}`;
}

function mapToRecentHand(record: HandRecord): RecentHand {
  const heroPlayer = record.config.players.find((p) => p.isHero);
  const heroSeat = heroPlayer?.seat ?? 0;
  const positionMap = getPositionLabels(record.config.maxPlayers, record.button_seat);
  const heroPos = positionMap[heroSeat] || undefined;
  const pot =
    record.total_pot_chips && record.config.blinds.bb
      ? `${(record.total_pot_chips / record.config.blinds.bb).toFixed(1)}BB`
      : undefined;

  return {
    id: record.hand_id,
    title: record.title || "",
    createdAt: formatCreatedAt(record.created_at),
    street: (record.final_street || "PREFLOP") as HandItem["street"],
    heroPos,
    pot,
  };
}

export function Main() {
  const t = useTranslations("dashboard");
  const { user, username } = useAuthStore();
  const [hands, setHands] = useState<RecentHand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHands = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const handRecords = await listHands({
          limit: 5,
          orderBy: "created_at",
          orderDirection: "desc",
        });
        setHands(handRecords.map(mapToRecentHand));
      } catch (error: unknown) {
        console.error("Failed to load hands:", error);
        toast.error(t("toastLoadFailed"), {
          description: getErrorMessage(error, t("toastLoadFailedDesc")),
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadHands();
  }, [user, t]);

  const displayName = useMemo(() => {
    if (username) return username;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name as string;
    if (user?.user_metadata?.name) return user.user_metadata.name as string;
    return t("newPlayer");
  }, [username, user, t]);

  return (
    <main className="flex flex-1 flex-col py-4 md:py-8">
      <DefaultContainer className="space-y-4 md:space-y-6">
        <Card className="rounded-3xl border-border/70 bg-card/75 shadow-[var(--shadow-soft)]">
          <CardHeader className="pb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("badge")}
            </p>
            <CardTitle className="text-2xl font-bold tracking-tight md:text-3xl">
              {t("welcomeTitle", { name: displayName })}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground md:text-base">
              {t("welcomeDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <StartNewHandButton location="marketing" />
            <Button asChild variant="ghost" className="justify-start rounded-xl px-3 sm:justify-center">
              <Link href="/dashboard/history">
                {t("viewAll")}
                <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/70 bg-card/75 shadow-[var(--shadow-soft)]">
          <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight md:text-xl">
                {t("recentTitle")}
              </CardTitle>
              <CardDescription>{t("recentMinimalDescription")}</CardDescription>
            </div>
            <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[11px]">
              {hands.length}/5
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-muted border-t-primary" />
              </div>
            ) : hands.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/45 px-4 py-10 text-center">
                <p className="text-sm font-semibold">{t("recentEmptyTitle")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("recentEmptyDescription")}</p>
              </div>
            ) : (
              hands.map((hand) => (
                <Link
                  key={hand.id}
                  href={`/dashboard/hands/${hand.id}/review`}
                  className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-background/45 px-3 py-3 transition-colors hover:bg-card"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-black text-muted-foreground">
                    {hand.heroPos || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold md:text-base">
                        {hand.title || t("untitled")}
                      </p>
                      <StreetBadge street={hand.street} />
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {hand.createdAt}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold">{hand.pot || "-"}</p>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                      {t("pot")}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </DefaultContainer>
    </main>
  );
}
