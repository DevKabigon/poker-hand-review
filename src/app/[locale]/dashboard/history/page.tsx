"use client";

import { useMemo, useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import {
  ChevronLeft,
  Search,
  Clock,
  ArrowUpRight,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import { DefaultContainer } from "@/components/default-container";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HandItem } from "../_components/handItem";
import { StreetBadge } from "../_components/street-badge";
import { listHands, deleteHand } from "@/features/hand/db/handService";
import { getPositionLabels } from "@/features/hand/domain/position";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { toast } from "sonner";
import type { HandRecord } from "@/features/hand/db/types";
import { useHandEditorStore } from "@/features/hand/editor/handEditorStore";
import { useTranslations } from "next-intl";
import { computePots } from "@/features/hand/engine/pots";
import { applyUncalledRefund } from "@/features/hand/engine/uncalledRefund";

// HandRecord를 HandItem으로 변환하는 헬퍼 함수
function convertHandRecordToHandItem(record: HandRecord): HandItem {
  const heroPlayer = record.config.players.find((p) => p.isHero);
  const heroSeat = heroPlayer?.seat ?? 0;
  const positionMap = getPositionLabels(
    record.config.maxPlayers,
    record.button_seat,
  );
  const heroPos = positionMap[heroSeat] || "";
  const blinds = `${record.config.blinds.sb}/${record.config.blinds.bb}`;
  const format =
    record.config.gameType === "CASH"
      ? "Cash"
      : record.config.gameType === "TOURNAMENT"
        ? "MTT"
        : "Cash";
  let potChips: number | null = null;
  if (
    typeof record.total_pot_chips === "number" &&
    Number.isFinite(record.total_pot_chips)
  ) {
    potChips = record.total_pot_chips;
  } else {
    const computed = computePots({
      config: record.config,
      eventsApplied: record.events,
    });
    const refunded = applyUncalledRefund(computed.pots, {
      roundClosed: true,
    });
    potChips = refunded.pots.reduce((sum, pot) => sum + pot.amount, 0);
  }

  const pot =
    record.config.blinds.bb > 0 && potChips !== null
      ? `${(potChips / record.config.blinds.bb).toFixed(1)}BB`
      : undefined;
  const date = new Date(record.created_at);
  const createdAt = `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours(),
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  return {
    id: record.hand_id,
    title: record.title || "",
    createdAt,
    blinds,
    format: format as "Cash" | "MTT" | "SNG",
    street: (record.final_street || "PREFLOP") as HandItem["street"],
    tags: record.tags || undefined,
    heroPos: heroPos || undefined,
    pot,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function HistoryPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const setCursor = useHandEditorStore((s) => s.setCursor);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "cash" | "mtt">("all");
  const [hands, setHands] = useState<HandItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  const handleTabChange = (value: string) => {
    if (value === "all" || value === "cash" || value === "mtt") {
      setTab(value);
    }
  };

  // DB에서 핸드 목록 로드
  useEffect(() => {
    const loadHands = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const handRecords = await listHands({
          orderBy: "created_at",
          orderDirection: "desc",
        });

        // HandRecord를 HandItem으로 변환
        const handItems: HandItem[] = handRecords.map(
          convertHandRecordToHandItem,
        );

        setHands(handItems);
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

  // 핸드 삭제 핸들러
  const handleDeleteHand = async (handId: string) => {
    if (!confirm(t("confirmDelete"))) {
      return;
    }

    try {
      await deleteHand(handId);
      toast.success(t("toastDeleteSuccess"));
      // 목록 새로고침
      const handRecords = await listHands({
        orderBy: "created_at",
        orderDirection: "desc",
      });
      setHands(handRecords.map(convertHandRecordToHandItem));
    } catch (error: unknown) {
      console.error("Failed to delete hand:", error);
      toast.error(t("toastDeleteFailed"), {
        description: getErrorMessage(error, t("toastDeleteFailedDesc")),
      });
    }
  };

  // 검색 및 탭 필터링 로직
  const filtered = useMemo(() => {
    return hands
      .filter((h) => {
        if (tab === "cash" && h.format !== "Cash") return false;
        if (tab === "mtt" && h.format !== "MTT") return false;
        const q = query.toLowerCase();
        return (
          h.title.toLowerCase().includes(q) ||
          h.tags?.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [query, tab, hands]);

  const moveToReview = (handId: string) => {
    setCursor(0);
    router.push(`/hands/${handId}/review`);
  };

  return (
    <main className="flex flex-1 flex-col overflow-hidden bg-transparent">
      <DefaultContainer className="flex-1 py-8">
        <div className="mx-auto flex h-full w-full max-w-5xl min-h-0 flex-col">
        {/* 상단 헤더 영역 */}
        <div className="shrink-0 flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              asChild
              className="rounded-full bg-card/70"
            >
              <Link href="/">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {tCommon("handHistory")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("recentDescription")}
              </p>
            </div>
          </div>
        </div>

        {/* 메인 리스트 카드 */}
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-border/70 bg-card/75">
          <div className="flex-1 flex flex-col px-6 pt-6 min-h-0">
            {/* 검색 및 탭 제어 */}
            <div className="shrink-0 flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 rounded-xl bg-card/55 pl-9 transition-colors focus:bg-card"
                />
              </div>
              <Tabs
                value={tab}
                onValueChange={handleTabChange}
                className="h-10"
              >
                <TabsList className="grid w-[240px] grid-cols-3 h-10">
                  <TabsTrigger value="all" className="text-xs">
                    {t("all")}
                  </TabsTrigger>
                  <TabsTrigger value="cash" className="text-xs">
                    {t("cash")}
                  </TabsTrigger>
                  <TabsTrigger value="mtt" className="text-xs">
                    {t("mtt")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Separator className="shrink-0" />

            {/* 히스토리 리스트 (전체 출력) */}
            <div className="flex-1 min-h-0 pt-4">
              <ScrollArea className="h-full">
                <div className="space-y-3 pr-4 pb-8 pt-2">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                      <p className="text-lg font-medium text-foreground">
                        {t("loading")}
                      </p>
                    </div>
                  ) : filtered.length > 0 ? (
                    filtered.map((h) => (
                      <div
                        key={h.id}
                        role="link"
                        tabIndex={0}
                        onClick={() => moveToReview(h.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            moveToReview(h.id);
                          }
                        }}
                        className="group flex cursor-pointer items-center justify-between rounded-xl border border-border/65 bg-card/60 p-3 sm:p-4 transition-all hover:-translate-y-px hover:border-border hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                      >
                        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-black text-muted-foreground sm:h-12 sm:w-12 sm:text-xs">
                            {h.heroPos}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <Link
                                href={`/hands/${h.id}/review`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCursor(0);
                                }}
                                className="max-w-[10.5rem] truncate text-sm font-bold text-slate-900 hover:underline decoration-slate-400 sm:max-w-[15rem] md:max-w-[22rem] sm:text-base dark:text-slate-100"
                              >
                                {h.title || t("untitled")}
                              </Link>
                              <div className="shrink-0">
                                <StreetBadge street={h.street} />
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:hidden">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span className="truncate">{h.createdAt}</span>
                              <span className="shrink-0">•</span>
                              <span className="truncate">{h.blinds}</span>
                              <span className="shrink-0">•</span>
                              <span className="shrink-0 font-semibold text-foreground/90">
                                {h.pot ?? "-"}
                              </span>
                            </div>

                            <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {h.createdAt}
                              </span>
                              <span>•</span>
                              <span>{h.blinds}</span>
                              <span>•</span>
                              <span className="font-semibold">{h.format}</span>
                              {h.tags && h.tags.length > 0 ? (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{h.tags.join(", ")}</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-1 sm:gap-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-right hidden sm:block">
                            <div className="text-base font-bold text-foreground">
                              {h.pot ?? "-"}
                            </div>
                            <div className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
                              {t("pot")}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              className="h-8 w-8 sm:h-9 sm:w-9"
                              onClick={() => setCursor(0)}
                            >
                              <Link href={`/hands/${h.id}/review`}>
                                <ArrowUpRight className="h-4 w-4" />
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 sm:h-9 sm:w-9"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  className="gap-2 text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteHand(h.id)}
                                >
                                  <Trash2 className="h-4 w-4" /> {t("delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                      <Search className="mb-4 h-12 w-12 text-muted-foreground/35" />
                      <p className="text-lg font-medium text-foreground">
                        {t("notFoundTitle")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("notFoundDescription")}
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </Card>
        </div>
      </DefaultContainer>
    </main>
  );
}
