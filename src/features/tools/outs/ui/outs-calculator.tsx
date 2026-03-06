"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CardPicker } from "@/components/poker/card-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card as PokerCard, RANKS, Rank, SUITS, Suit } from "@/features/hand/domain/cards";
import {
  calculateByRiverFromFlopExact,
  calculateExactShowdownFromCurrentBoard,
  calculateNextCardOuts,
  NextCardOutsResult,
} from "@/features/tools/outs/domain/calculator";
import { compareHands, HandOutcome } from "@/features/tools/outs/domain/evaluator";
import { getCardImage } from "@/features/hand/ui/assets";
import { cn } from "@/lib/utils";

type PickerTarget = "hero" | "villain" | "flop" | "turn" | "river";

type ValidationView = {
  kind: "incomplete" | "invalid";
  message: string;
};

type CalculationView =
  | {
      kind: "preflop";
      equity: ReturnType<typeof calculateExactShowdownFromCurrentBoard>;
    }
  | {
      kind: "flop";
      currentOutcome: HandOutcome;
      turnOuts: NextCardOutsResult;
      byRiver: ReturnType<typeof calculateByRiverFromFlopExact>;
    }
  | {
      kind: "turn";
      currentOutcome: HandOutcome;
      riverOuts: NextCardOutsResult;
    }
  | {
      kind: "river";
      finalOutcome: HandOutcome;
    };

type HeadlineMetrics = {
  heroProbability: number;
  villainProbability: number;
  tieProbability: number;
  stageLabel: string;
};

const PICKER_CLOSE_SETTLE_MS = 260;

const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));
const SUIT_INDEX = new Map(SUITS.map((suit, index) => [suit, index]));

function parsePickerCards(cards: string[] | null): PokerCard[] {
  if (!cards) {
    return [];
  }
  return cards as PokerCard[];
}

function uniqueCards(cards: PokerCard[]): PokerCard[] {
  return [...new Set(cards)];
}

function sortCards(cards: PokerCard[]): PokerCard[] {
  return [...cards].sort((a, b) => {
    const rankDiff =
      (RANK_INDEX.get(a[0] as Rank) ?? 0) - (RANK_INDEX.get(b[0] as Rank) ?? 0);
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return (SUIT_INDEX.get(a[1] as Suit) ?? 0) - (SUIT_INDEX.get(b[1] as Suit) ?? 0);
  });
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function getOutcomeTextKey(outcome: HandOutcome): "outcomeWin" | "outcomeTie" | "outcomeLose" {
  if (outcome === "win") {
    return "outcomeWin";
  }
  if (outcome === "tie") {
    return "outcomeTie";
  }
  return "outcomeLose";
}

function getOutcomeBadgeClass(outcome: HandOutcome): string {
  if (outcome === "win") {
    return "border-emerald-500/40 bg-emerald-500/20 text-emerald-200";
  }
  if (outcome === "tie") {
    return "border-amber-500/40 bg-amber-500/20 text-amber-200";
  }
  return "border-rose-500/40 bg-rose-500/20 text-rose-200";
}

function VisualCard({
  card,
  size = "md",
}: {
  card?: PokerCard;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "h-12 w-8" : "h-16 w-11";

  if (!card) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 text-[10px] font-bold text-muted-foreground",
          sizeClass,
        )}
      >
        --
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-md border border-border/60 shadow-sm", sizeClass)}>
      <Image
        src={getCardImage(card)}
        alt={card}
        fill
        unoptimized
        sizes={size === "sm" ? "40px" : "60px"}
        className="object-cover"
      />
    </div>
  );
}

function SelectionRow({
  title,
  cards,
  maxCards,
  isActive,
  isDisabled,
  disabledReason,
  onSelect,
}: {
  title: string;
  cards: PokerCard[];
  maxCards: number;
  isActive: boolean;
  isDisabled: boolean;
  disabledReason?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors",
        isActive
          ? "border-primary/45 bg-primary/10 shadow-[0_0_0_1px_rgb(59_130_246/25%)]"
          : "border-border/70 bg-muted/15 hover:bg-muted/30",
        isDisabled && "cursor-not-allowed opacity-55",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</p>
        <Badge variant={isActive ? "default" : "outline"} className="rounded-md text-[10px]">
          {cards.length}/{maxCards}
        </Badge>
      </div>

      <div className="flex gap-1.5">
        {Array.from({ length: maxCards }).map((_, index) => (
          <VisualCard key={`${title}-${index}`} card={cards[index]} size="sm" />
        ))}
      </div>

      {isDisabled && disabledReason ? (
        <p className="mt-2 text-[11px] font-medium text-muted-foreground">{disabledReason}</p>
      ) : null}
    </button>
  );
}

function MetricTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "hero" | "villain" | "tie";
}) {
  const toneClass =
    tone === "hero"
      ? "border-emerald-500/35 bg-emerald-500/10"
      : tone === "villain"
        ? "border-rose-500/35 bg-rose-500/10"
        : "border-amber-500/35 bg-amber-500/10";

  return (
    <div className={cn("rounded-xl border px-3 py-3", toneClass)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/25 px-3 py-2">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

function OutCardsStrip({
  title,
  cards,
  emptyText,
  toneClass,
}: {
  title: string;
  cards: PokerCard[];
  emptyText: string;
  toneClass: string;
}) {
  return (
    <div className={cn("rounded-xl border p-3", toneClass)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em]">{title}</p>
        <Badge variant="outline" className="rounded-md text-[10px]">
          {cards.length}
        </Badge>
      </div>
      {cards.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {sortCards(cards).map((card) => (
            <VisualCard key={`${title}-${card}`} card={card} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}

export function OutsCalculator() {
  const t = useTranslations("outsTool");
  const [activeTarget, setActiveTarget] = useState<PickerTarget>("hero");
  const [isPickerDialogOpen, setIsPickerDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isPickerClosing, setIsPickerClosing] = useState(false);
  const [heroCards, setHeroCards] = useState<PokerCard[]>([]);
  const [villainCards, setVillainCards] = useState<PokerCard[]>([]);
  const [flopCards, setFlopCards] = useState<PokerCard[]>([]);
  const [turnCard, setTurnCard] = useState<PokerCard[]>([]);
  const [riverCard, setRiverCard] = useState<PokerCard[]>([]);
  const [calculation, setCalculation] = useState<CalculationView | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const closeSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeSettleTimerRef.current) {
        clearTimeout(closeSettleTimerRef.current);
      }
    };
  }, []);

  const handlePickerOpenChange = (open: boolean) => {
    if (closeSettleTimerRef.current) {
      clearTimeout(closeSettleTimerRef.current);
      closeSettleTimerRef.current = null;
    }

    if (open) {
      setIsPickerClosing(false);
      setIsPickerDialogOpen(true);
      return;
    }

    setIsPickerDialogOpen(false);
    setIsPickerClosing(true);

    closeSettleTimerRef.current = setTimeout(() => {
      setIsPickerClosing(false);
      closeSettleTimerRef.current = null;
    }, PICKER_CLOSE_SETTLE_MS);
  };

  const applyCardsToTarget = (target: PickerTarget, cards: PokerCard[]) => {
    if (target === "hero") {
      setHeroCards(cards);
      return;
    }
    if (target === "villain") {
      setVillainCards(cards);
      return;
    }
    if (target === "flop") {
      handleFlopChange(cards);
      return;
    }
    if (target === "turn") {
      handleTurnChange(cards);
      return;
    }
    setRiverCard(cards);
  };

  const handleFlopChange = (cards: PokerCard[]) => {
    setFlopCards(cards);
    if (cards.length < 3) {
      if (turnCard.length > 0) {
        setTurnCard([]);
      }
      if (riverCard.length > 0) {
        setRiverCard([]);
      }
      if (activeTarget === "turn" || activeTarget === "river") {
        setActiveTarget("flop");
      }
    }
  };

  const handleTurnChange = (cards: PokerCard[]) => {
    setTurnCard(cards);
    if (cards.length === 0) {
      if (riverCard.length > 0) {
        setRiverCard([]);
      }
      if (activeTarget === "river") {
        setActiveTarget("turn");
      }
    }
  };

  const boardCards = useMemo(
    () => [...flopCards, ...turnCard, ...riverCard],
    [flopCards, riverCard, turnCard],
  );

  const usedCards = useMemo(
    () => uniqueCards([...heroCards, ...villainCards, ...boardCards]),
    [boardCards, heroCards, villainCards],
  );

  const selectedByTarget: Record<PickerTarget, PokerCard[]> = useMemo(
    () => ({
      hero: heroCards,
      villain: villainCards,
      flop: flopCards,
      turn: turnCard,
      river: riverCard,
    }),
    [flopCards, heroCards, riverCard, turnCard, villainCards],
  );

  const deadCardsByTarget: Record<PickerTarget, PokerCard[]> = useMemo(() => {
    return {
      hero: usedCards.filter((card) => !selectedByTarget.hero.includes(card)),
      villain: usedCards.filter((card) => !selectedByTarget.villain.includes(card)),
      flop: usedCards.filter((card) => !selectedByTarget.flop.includes(card)),
      turn: usedCards.filter((card) => !selectedByTarget.turn.includes(card)),
      river: usedCards.filter((card) => !selectedByTarget.river.includes(card)),
    };
  }, [selectedByTarget, usedCards]);

  const pickerDisabledState: Record<PickerTarget, boolean> = {
    hero: false,
    villain: false,
    flop: false,
    turn: flopCards.length !== 3,
    river: turnCard.length !== 1,
  };

  const pickerDisabledMessage: Record<PickerTarget, string> = {
    hero: "",
    villain: "",
    flop: "",
    turn: t("requiresFlop"),
    river: t("requiresTurn"),
  };

  const handleSelectTarget = (target: PickerTarget) => {
    if (pickerDisabledState[target]) {
      return;
    }
    setActiveTarget(target);
    handlePickerOpenChange(true);
  };

  const pickerConfig = {
    hero: {
      maxCards: 2,
      selectedCards: heroCards,
      setCards: setHeroCards,
      title: t("heroCards"),
    },
    villain: {
      maxCards: 2,
      selectedCards: villainCards,
      setCards: setVillainCards,
      title: t("villainCards"),
    },
    flop: {
      maxCards: 3,
      selectedCards: flopCards,
      setCards: handleFlopChange,
      title: t("flopCards"),
    },
    turn: {
      maxCards: 1,
      selectedCards: turnCard,
      setCards: handleTurnChange,
      title: t("turnCard"),
    },
    river: {
      maxCards: 1,
      selectedCards: riverCard,
      setCards: setRiverCard,
      title: t("riverCard"),
    },
  } satisfies Record<
    PickerTarget,
    {
      maxCards: number;
      selectedCards: PokerCard[];
      setCards: (cards: PokerCard[]) => void;
      title: string;
    }
  >;

  const validation = useMemo<ValidationView | null>(() => {
    if (heroCards.length !== 2 || villainCards.length !== 2) {
      return { kind: "incomplete", message: t("needBothHands") };
    }

    if (boardCards.length !== 0 && boardCards.length < 3) {
      return { kind: "invalid", message: t("invalidBoard") };
    }

    if (boardCards.length > 5) {
      return { kind: "invalid", message: t("invalidBoard") };
    }

    return null;
  }, [boardCards, heroCards, t, villainCards]);

  useEffect(() => {
    let cancelled = false;
    let computeTimer: ReturnType<typeof setTimeout> | undefined;
    let hideSpinnerTimer: ReturnType<typeof setTimeout> | undefined;

    if (isPickerDialogOpen || isPickerClosing) {
      const pauseTimer = setTimeout(() => {
        if (!cancelled) {
          setIsCalculating(false);
        }
      }, 0);

      return () => {
        cancelled = true;
        clearTimeout(pauseTimer);
      };
    }

    if (validation) {
      const resetTimer = setTimeout(() => {
        if (cancelled) {
          return;
        }
        setCalculation(null);
        setIsCalculating(false);
      }, 0);

      return () => {
        cancelled = true;
        clearTimeout(resetTimer);
      };
    }

    const heroSnapshot = [...heroCards];
    const villainSnapshot = [...villainCards];
    const boardSnapshot = [...boardCards];
    const startDelay = boardSnapshot.length === 0 ? 120 : 0;
    const spinnerStart = Date.now();
    const minSpinnerMs = 260;
    setIsCalculating(true);

    const startTimer = setTimeout(() => {
      if (cancelled) {
        return;
      }

      computeTimer = setTimeout(() => {
        if (cancelled) {
          return;
        }

        try {
          let nextCalculation: CalculationView;

          if (boardSnapshot.length === 0) {
            nextCalculation = {
              kind: "preflop",
              equity: calculateExactShowdownFromCurrentBoard(heroSnapshot, villainSnapshot, []),
            };
          } else if (boardSnapshot.length === 3) {
            nextCalculation = {
              kind: "flop",
              currentOutcome: compareHands(heroSnapshot, villainSnapshot, boardSnapshot),
              turnOuts: calculateNextCardOuts(heroSnapshot, villainSnapshot, boardSnapshot),
              byRiver: calculateByRiverFromFlopExact(heroSnapshot, villainSnapshot, boardSnapshot),
            };
          } else if (boardSnapshot.length === 4) {
            nextCalculation = {
              kind: "turn",
              currentOutcome: compareHands(heroSnapshot, villainSnapshot, boardSnapshot),
              riverOuts: calculateNextCardOuts(heroSnapshot, villainSnapshot, boardSnapshot),
            };
          } else {
            nextCalculation = {
              kind: "river",
              finalOutcome: compareHands(heroSnapshot, villainSnapshot, boardSnapshot),
            };
          }

          if (!cancelled) {
            setCalculation(nextCalculation);
          }
        } catch (error) {
          if (!cancelled) {
            setCalculation(null);
          }
          console.error("Failed to calculate outs:", error);
        } finally {
          if (!cancelled) {
            const elapsed = Date.now() - spinnerStart;
            const remaining = Math.max(0, minSpinnerMs - elapsed);
            hideSpinnerTimer = setTimeout(() => {
              if (!cancelled) {
                setIsCalculating(false);
              }
            }, remaining);
          }
        }
      }, 0);
    }, startDelay);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      if (computeTimer) {
        clearTimeout(computeTimer);
      }
      if (hideSpinnerTimer) {
        clearTimeout(hideSpinnerTimer);
      }
    };
  }, [boardCards, heroCards, isPickerClosing, isPickerDialogOpen, validation, villainCards]);

  const headline = useMemo<HeadlineMetrics | null>(() => {
    if (!calculation || validation) {
      return null;
    }

    if (calculation.kind === "preflop") {
      return {
        heroProbability: calculation.equity.winProbability,
        villainProbability: calculation.equity.loseProbability,
        tieProbability: calculation.equity.tieProbability,
        stageLabel: t("stagePreflop"),
      };
    }

    if (calculation.kind === "flop") {
      return {
        heroProbability: calculation.byRiver.winProbability,
        villainProbability: calculation.byRiver.loseProbability,
        tieProbability: calculation.byRiver.tieProbability,
        stageLabel: t("stageFlop"),
      };
    }

    if (calculation.kind === "turn") {
      return {
        heroProbability: calculation.riverOuts.winProbability,
        villainProbability: calculation.riverOuts.loseCards.length / calculation.riverOuts.unseenCount,
        tieProbability: calculation.riverOuts.tieProbability,
        stageLabel: t("stageTurn"),
      };
    }

    return {
      heroProbability: calculation.finalOutcome === "win" ? 1 : 0,
      villainProbability: calculation.finalOutcome === "lose" ? 1 : 0,
      tieProbability: calculation.finalOutcome === "tie" ? 1 : 0,
      stageLabel: t("stageRiver"),
    };
  }, [calculation, t, validation]);

  const activeConfig = pickerConfig[activeTarget];

  const handleModalCardChange = (cards: string[] | null) => {
    applyCardsToTarget(activeTarget, parsePickerCards(cards));
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.22fr)_minmax(0,0.98fr)]">
      <div className="space-y-4">
        <Card className="gap-3 rounded-3xl border-border/75 py-5">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-black tracking-tight">{t("overviewTitle")}</CardTitle>
                <CardDescription>{t("overviewDescription")}</CardDescription>
              </div>
              {headline ? (
                <Badge variant="secondary" className="rounded-md text-[10px]">
                  {headline.stageLabel}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {validation ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/35 px-3 py-4 text-sm text-muted-foreground">
                {validation.message}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <MetricTile
                    label={t("heroWinProb")}
                    value={headline ? formatPercent(headline.heroProbability) : "--"}
                    tone="hero"
                  />
                  <MetricTile
                    label={t("villainWinProb")}
                    value={headline ? formatPercent(headline.villainProbability) : "--"}
                    tone="villain"
                  />
                  <MetricTile
                    label={t("tieProb")}
                    value={headline ? formatPercent(headline.tieProbability) : "--"}
                    tone="tie"
                  />
                </div>
                {isCalculating ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground">
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                    {t("updating")}
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="gap-3 rounded-3xl border-border/75 py-5">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-black tracking-tight">{t("boardTitle")}</CardTitle>
            <CardDescription>{t("boardDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <SelectionRow
                title={t("heroCards")}
                cards={heroCards}
                maxCards={2}
                isActive={activeTarget === "hero"}
                isDisabled={false}
                onSelect={() => handleSelectTarget("hero")}
              />
              <SelectionRow
                title={t("villainCards")}
                cards={villainCards}
                maxCards={2}
                isActive={activeTarget === "villain"}
                isDisabled={false}
                onSelect={() => handleSelectTarget("villain")}
              />
              <SelectionRow
                title={t("flopCards")}
                cards={flopCards}
                maxCards={3}
                isActive={activeTarget === "flop"}
                isDisabled={false}
                onSelect={() => handleSelectTarget("flop")}
              />
              <SelectionRow
                title={t("turnCard")}
                cards={turnCard}
                maxCards={1}
                isActive={activeTarget === "turn"}
                isDisabled={pickerDisabledState.turn}
                disabledReason={pickerDisabledMessage.turn}
                onSelect={() => handleSelectTarget("turn")}
              />
              <SelectionRow
                title={t("riverCard")}
                cards={riverCard}
                maxCards={1}
                isActive={activeTarget === "river"}
                isDisabled={pickerDisabledState.river}
                disabledReason={pickerDisabledMessage.river}
                onSelect={() => handleSelectTarget("river")}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-3 rounded-3xl border-border/75 py-5">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-black tracking-tight">{t("outsCardsTitle")}</CardTitle>
              <CardDescription>{t("outsCardsDescription")}</CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-lg"
              onClick={() => setIsDetailDialogOpen(true)}
              disabled={validation !== null || isCalculating || calculation === null}
            >
              {t("detailTitle")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {validation ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/35 px-3 py-4 text-sm text-muted-foreground">
              {validation.message}
            </div>
          ) : isCalculating ? (
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <span>{t("calculating")}</span>
            </div>
          ) : !calculation ? (
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <span>{t("calculating")}</span>
            </div>
          ) : calculation.kind === "flop" ? (
            <div className="space-y-4">
              <OutCardsStrip
                title={t("winOuts")}
                cards={calculation.turnOuts.winOutCards}
                emptyText={t("none")}
                toneClass="border-emerald-500/35 bg-emerald-500/10"
              />
              <OutCardsStrip
                title={t("villainOuts")}
                cards={calculation.turnOuts.loseCards}
                emptyText={t("none")}
                toneClass="border-rose-500/35 bg-rose-500/10"
              />
              <OutCardsStrip
                title={t("tieOuts")}
                cards={calculation.turnOuts.tieOutCards}
                emptyText={t("none")}
                toneClass="border-amber-500/35 bg-amber-500/10"
              />
            </div>
          ) : calculation.kind === "turn" ? (
            <div className="space-y-4">
              <OutCardsStrip
                title={t("winOuts")}
                cards={calculation.riverOuts.winOutCards}
                emptyText={t("none")}
                toneClass="border-emerald-500/35 bg-emerald-500/10"
              />
              <OutCardsStrip
                title={t("villainOuts")}
                cards={calculation.riverOuts.loseCards}
                emptyText={t("none")}
                toneClass="border-rose-500/35 bg-rose-500/10"
              />
              <OutCardsStrip
                title={t("tieOuts")}
                cards={calculation.riverOuts.tieOutCards}
                emptyText={t("none")}
                toneClass="border-amber-500/35 bg-amber-500/10"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/35 px-3 py-4 text-sm text-muted-foreground">
              {t("outsCardsUnavailable")}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-3xl p-0">
          <div className="flex max-h-[88vh] flex-col">
            <DialogHeader className="border-b border-border/70 px-4 py-3 sm:px-6 sm:py-4">
              <DialogTitle className="text-base font-black tracking-tight sm:text-lg">
                {t("detailTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t("detailDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
              {validation ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/35 px-3 py-4 text-sm text-muted-foreground">
                  {validation.message}
                </div>
              ) : isCalculating || !calculation ? (
                <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                  <span>{t("calculating")}</span>
                </div>
              ) : calculation.kind === "preflop" ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold">{t("stepPreflop")}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <MiniMetric
                      label={t("heroWinProb")}
                      value={`${formatPercent(calculation.equity.winProbability)} (${calculation.equity.win}/${calculation.equity.total})`}
                    />
                    <MiniMetric
                      label={t("villainWinProb")}
                      value={`${formatPercent(calculation.equity.loseProbability)} (${calculation.equity.lose}/${calculation.equity.total})`}
                    />
                    <MiniMetric
                      label={t("tieProb")}
                      value={`${formatPercent(calculation.equity.tieProbability)} (${calculation.equity.tie}/${calculation.equity.total})`}
                    />
                    <MiniMetric label={t("runoutCount")} value={calculation.equity.total.toLocaleString()} />
                  </div>
                </div>
              ) : calculation.kind === "flop" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">{t("currentBoardOutcome")}</span>
                    <Badge
                      className={cn("rounded-md px-2 py-1 text-xs", getOutcomeBadgeClass(calculation.currentOutcome))}
                    >
                      {t(getOutcomeTextKey(calculation.currentOutcome))}
                    </Badge>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {t("sectionTurnOnly")}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <MiniMetric
                        label={t("heroWinProb")}
                        value={formatPercent(calculation.turnOuts.winProbability)}
                      />
                      <MiniMetric
                        label={t("villainWinProb")}
                        value={formatPercent(
                          calculation.turnOuts.loseCards.length / calculation.turnOuts.unseenCount,
                        )}
                      />
                      <MiniMetric label={t("tieProb")} value={formatPercent(calculation.turnOuts.tieProbability)} />
                      <MiniMetric
                        label={t("totalOuts")}
                        value={`${calculation.turnOuts.winOutCards.length + calculation.turnOuts.tieOutCards.length} / ${calculation.turnOuts.unseenCount}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {t("sectionByRiver")}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <MiniMetric
                        label={t("heroWinProb")}
                        value={formatPercent(calculation.byRiver.winProbability)}
                      />
                      <MiniMetric
                        label={t("villainWinProb")}
                        value={formatPercent(calculation.byRiver.loseProbability)}
                      />
                      <MiniMetric label={t("tieProb")} value={formatPercent(calculation.byRiver.tieProbability)} />
                      <MiniMetric
                        label={t("nonLoseProb")}
                        value={formatPercent(calculation.byRiver.winProbability + calculation.byRiver.tieProbability)}
                      />
                      <MiniMetric label={t("runoutCount")} value={calculation.byRiver.total.toLocaleString()} />
                      <MiniMetric
                        label={t("effectiveTotalOuts")}
                        value={calculation.byRiver.effectiveTotalOuts.toFixed(2)}
                      />
                      <MiniMetric
                        label={t("effectiveWinOuts")}
                        value={calculation.byRiver.effectiveWinOuts.toFixed(2)}
                      />
                      <MiniMetric
                        label={t("effectiveTieOuts")}
                        value={calculation.byRiver.effectiveTieOuts.toFixed(2)}
                      />
                    </div>
                  </div>
                </div>
              ) : calculation.kind === "turn" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">{t("currentBoardOutcome")}</span>
                    <Badge
                      className={cn("rounded-md px-2 py-1 text-xs", getOutcomeBadgeClass(calculation.currentOutcome))}
                    >
                      {t(getOutcomeTextKey(calculation.currentOutcome))}
                    </Badge>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {t("sectionRiverOnly")}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <MiniMetric
                        label={t("heroWinProb")}
                        value={formatPercent(calculation.riverOuts.winProbability)}
                      />
                      <MiniMetric
                        label={t("villainWinProb")}
                        value={formatPercent(
                          calculation.riverOuts.loseCards.length / calculation.riverOuts.unseenCount,
                        )}
                      />
                      <MiniMetric label={t("tieProb")} value={formatPercent(calculation.riverOuts.tieProbability)} />
                      <MiniMetric
                        label={t("nonLoseProb")}
                        value={formatPercent(calculation.riverOuts.nonLoseProbability)}
                      />
                      <MiniMetric
                        label={t("winOuts")}
                        value={`${calculation.riverOuts.winOutCards.length} / ${calculation.riverOuts.unseenCount}`}
                      />
                      <MiniMetric
                        label={t("tieOuts")}
                        value={`${calculation.riverOuts.tieOutCards.length} / ${calculation.riverOuts.unseenCount}`}
                      />
                      <MiniMetric
                        label={t("villainOuts")}
                        value={`${calculation.riverOuts.loseCards.length} / ${calculation.riverOuts.unseenCount}`}
                      />
                      <MiniMetric
                        label={t("totalOuts")}
                        value={`${calculation.riverOuts.winOutCards.length + calculation.riverOuts.tieOutCards.length} / ${calculation.riverOuts.unseenCount}`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-bold">{t("stepFinal")}</p>
                  <Badge
                    className={cn("rounded-md px-2 py-1 text-xs", getOutcomeBadgeClass(calculation.finalOutcome))}
                  >
                    {t(getOutcomeTextKey(calculation.finalOutcome))}
                  </Badge>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <MiniMetric
                      label={t("heroWinProb")}
                      value={formatPercent(calculation.finalOutcome === "win" ? 1 : 0)}
                    />
                    <MiniMetric
                      label={t("villainWinProb")}
                      value={formatPercent(calculation.finalOutcome === "lose" ? 1 : 0)}
                    />
                    <MiniMetric
                      label={t("tieProb")}
                      value={formatPercent(calculation.finalOutcome === "tie" ? 1 : 0)}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-border/70 px-4 py-3 sm:px-6">
              <Button type="button" className="rounded-xl" onClick={() => setIsDetailDialogOpen(false)}>
                {t("done")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPickerDialogOpen} onOpenChange={handlePickerOpenChange}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-5xl gap-0 p-0 sm:max-h-[92vh]">
          <div className="flex max-h-[90vh] flex-col">
            <DialogHeader className="border-b border-border/70 px-4 py-3 sm:px-6 sm:py-4">
              <DialogTitle className="text-base font-black tracking-tight sm:text-lg">
                {t("pickerDialogTitle", { target: activeConfig.title })}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t("pickerDialogDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              <CardPicker
                selectedCards={activeConfig.selectedCards}
                onChange={handleModalCardChange}
                deadCards={deadCardsByTarget[activeTarget]}
                maxCards={activeConfig.maxCards}
                className="mx-auto max-w-none sm:max-w-none"
              />
            </div>

            <DialogFooter className="border-t border-border/70 px-4 py-3 sm:px-6">
              <Button type="button" className="rounded-xl" onClick={() => handlePickerOpenChange(false)}>
                {t("done")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
