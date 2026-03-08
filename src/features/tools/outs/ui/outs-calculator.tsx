"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { CardPicker } from "@/components/poker/card-picker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card as PokerCard, RANKS, Rank, SUITS, Suit } from "@/features/hand/domain/cards";
import { getCardImage } from "@/features/hand/ui/assets";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  calculateNextCardMultiwayOuts,
  MultiwayNextCardOutsResult,
} from "@/features/tools/outs/domain/calculator";
import { comparePlayerHands } from "@/features/tools/outs/domain/evaluator";
import { cn } from "@/lib/utils";

type PlayerSeat = {
  id: number;
  cards: PokerCard[];
};

type PickerTarget = `player:${number}` | "flop" | "turn" | "river";

type ValidationView = {
  message: string;
};

type PlayerOutSummary = {
  order: number;
  cards: PokerCard[];
  outCards: PokerCard[];
};

const MAX_PLAYERS = 9;
const PLAYER_TARGET_PREFIX = "player:";

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

function getPlayerTarget(playerId: number): PickerTarget {
  return `${PLAYER_TARGET_PREFIX}${playerId}` as PickerTarget;
}

function isPlayerTarget(target: PickerTarget): target is `player:${number}` {
  return target.startsWith(PLAYER_TARGET_PREFIX);
}

function getPlayerIdFromTarget(target: `player:${number}`): number {
  return Number(target.slice(PLAYER_TARGET_PREFIX.length));
}

function VisualCard({
  card,
  size = "md",
}: {
  card?: PokerCard;
  size?: "xs" | "sm" | "md";
}) {
  const sizeClass =
    size === "xs" ? "h-10 w-7" : size === "sm" ? "h-12 w-8" : "h-16 w-11";

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
        sizes={size === "md" ? "60px" : "40px"}
        className="object-cover"
      />
    </div>
  );
}

function CompactSelectableRow({
  title,
  cards,
  maxCards,
  caption,
  badgeLabel,
  isDisabled,
  disabledReason,
  onSelect,
  onRemove,
}: {
  title: string;
  cards: PokerCard[];
  maxCards: number;
  caption: string;
  badgeLabel?: string;
  isDisabled?: boolean;
  disabledReason?: string;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="relative">
      {onRemove ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="absolute right-2 top-2 z-10 rounded-full bg-background/85"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : null}

      <button
        type="button"
        onClick={onSelect}
        disabled={isDisabled}
        className={cn(
          "w-full rounded-[1.3rem] border px-3 py-3 text-left transition-colors",
          "bg-[linear-gradient(145deg,rgba(255,252,245,0.9),rgba(227,222,209,0.48))] dark:bg-[linear-gradient(145deg,rgba(32,38,51,0.92),rgba(24,29,37,0.74))]",
          "hover:bg-muted/45",
          isDisabled && "cursor-not-allowed opacity-60",
          onRemove && "pr-12",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {Array.from({ length: maxCards }).map((_, index) => (
              <VisualCard key={`${title}-${index}`} card={cards[index]} size="xs" />
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-black tracking-tight">{title}</p>
              {badgeLabel ? (
                <Badge className="rounded-full px-2 py-0.5 text-[10px] font-black">{badgeLabel}</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {isDisabled && disabledReason ? disabledReason : caption}
            </p>
          </div>

          <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
            {cards.length}/{maxCards}
          </Badge>
        </div>
      </button>
    </div>
  );
}

function CompactSummaryChip({
  title,
  cards,
  count,
  outsLabel,
}: {
  title: string;
  cards: PokerCard[];
  count: number;
  outsLabel: string;
}) {
  return (
    <div className="min-w-[168px] rounded-[1.2rem] border border-border/80 bg-card/82 px-3 py-2.5 shadow-[0_10px_22px_rgb(15_23_42/6%)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-2xl font-black leading-none tracking-[-0.06em]">{count}</p>
            <p className="pb-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {outsLabel}
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          {cards.map((card) => (
            <VisualCard key={`${title}-${card}`} card={card} size="xs" />
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderChip({
  title,
  cards,
}: {
  title: string;
  cards: PokerCard[];
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
        {title}
      </span>
      <span className="flex gap-1">
        {cards.map((card) => (
          <VisualCard key={`${title}-${card}`} card={card} size="xs" />
        ))}
      </span>
    </span>
  );
}

function TopStatusBar({
  leaders,
  boardCards,
  stageLabel,
  stageAccentClass,
  nextCardOnlyLabel,
  currentLeadersLabel,
}: {
  leaders: Array<{ order: number; cards: PokerCard[] }>;
  boardCards: PokerCard[];
  stageLabel: string;
  stageAccentClass: string;
  nextCardOnlyLabel: string;
  currentLeadersLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[1.3rem] border border-border/75 bg-[linear-gradient(135deg,rgba(255,252,245,0.88),rgba(227,222,209,0.45))] px-3 py-3 dark:bg-[linear-gradient(135deg,rgba(32,38,51,0.94),rgba(24,29,37,0.72))]">
      <Badge className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]", stageAccentClass)}>
        {stageLabel}
      </Badge>
      <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]">
        {nextCardOnlyLabel}
      </Badge>

      {leaders.length > 0 ? (
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
          {currentLeadersLabel}
        </span>
      ) : null}

      {leaders.map((leader) => (
        <LeaderChip key={`leader-${leader.order}`} title={`P${leader.order}`} cards={leader.cards} />
      ))}

      <div className="ml-auto flex gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <VisualCard key={`board-preview-${index}`} card={boardCards[index]} size="xs" />
        ))}
      </div>
    </div>
  );
}

function OutCardsPanel({
  title,
  cards,
  emptyText,
}: {
  title: string;
  cards: PokerCard[];
  emptyText: string;
}) {
  const sortedCards = sortCards(cards);

  return (
    <div className="rounded-[1.5rem] border border-border/80 bg-card/82 p-3 shadow-[0_12px_26px_rgb(15_23_42/6%)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-black tracking-tight">{title}</p>
        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
          {cards.length}
        </Badge>
      </div>

      {sortedCards.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ScrollArea className="max-h-[52dvh] rounded-[1rem] border border-border/70 bg-muted/18">
          <div className="flex flex-wrap gap-1.5 p-3">
            {sortedCards.map((card) => (
              <VisualCard key={`${title}-${card}`} card={card} size="sm" />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export function OutsCalculator() {
  const t = useTranslations("outsTool");
  const isMobile = useIsMobile();
  const [players, setPlayers] = useState<PlayerSeat[]>([
    { id: 1, cards: [] },
    { id: 2, cards: [] },
  ]);
  const [nextPlayerId, setNextPlayerId] = useState(3);
  const [activeTarget, setActiveTarget] = useState<PickerTarget>(getPlayerTarget(1));
  const [isPickerDialogOpen, setIsPickerDialogOpen] = useState(false);
  const [flopCards, setFlopCards] = useState<PokerCard[]>([]);
  const [turnCard, setTurnCard] = useState<PokerCard[]>([]);
  const [riverCard, setRiverCard] = useState<PokerCard[]>([]);

  const boardCards = useMemo(
    () => [...flopCards, ...turnCard, ...riverCard],
    [flopCards, riverCard, turnCard],
  );

  const usedCards = useMemo(
    () => uniqueCards([...players.flatMap((player) => player.cards), ...boardCards]),
    [boardCards, players],
  );

  const resolvedTarget = useMemo<PickerTarget>(() => {
    if (!isPlayerTarget(activeTarget)) {
      return activeTarget;
    }

    const playerId = getPlayerIdFromTarget(activeTarget);
    const playerExists = players.some((player) => player.id === playerId);

    return playerExists ? activeTarget : getPlayerTarget(players[0]?.id ?? 1);
  }, [activeTarget, players]);

  const handlePlayerCardsChange = (playerId: number, cards: PokerCard[]) => {
    setPlayers((current) =>
      current.map((player) => (player.id === playerId ? { ...player, cards } : player)),
    );
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
    }
  };

  const handleTurnChange = (cards: PokerCard[]) => {
    setTurnCard(cards);

    if (cards.length === 0 && riverCard.length > 0) {
      setRiverCard([]);
    }
  };

  const handleAddPlayer = () => {
    if (players.length >= MAX_PLAYERS) {
      return;
    }

    const newPlayerId = nextPlayerId;
    setPlayers((current) => [...current, { id: newPlayerId, cards: [] }]);
    setNextPlayerId((current) => current + 1);
    setActiveTarget(getPlayerTarget(newPlayerId));
    setIsPickerDialogOpen(true);
  };

  const handleRemovePlayer = (playerId: number) => {
    if (players.length <= 2) {
      return;
    }

    const remainingPlayers = players.filter((player) => player.id !== playerId);
    setPlayers(remainingPlayers);

    if (isPlayerTarget(activeTarget) && getPlayerIdFromTarget(activeTarget) === playerId) {
      setActiveTarget(getPlayerTarget(remainingPlayers[0]?.id ?? 1));
    }
  };

  const selectTarget = (target: PickerTarget) => {
    if (target === "turn" && flopCards.length !== 3) {
      return;
    }

    if (target === "river" && turnCard.length !== 1) {
      return;
    }

    setActiveTarget(target);
    setIsPickerDialogOpen(true);
  };

  const validation = useMemo<ValidationView | null>(() => {
    if (players.some((player) => player.cards.length !== 2)) {
      return { message: t("needCompleteHands") };
    }

    if (boardCards.length < 3) {
      return { message: t("needFlop") };
    }

    if (boardCards.length > 5) {
      return { message: t("invalidBoard") };
    }

    return null;
  }, [boardCards.length, players, t]);

  const comparison = useMemo(() => {
    if (validation) {
      return null;
    }

    try {
      return comparePlayerHands(
        players.map((player) => player.cards),
        boardCards,
      );
    } catch {
      return null;
    }
  }, [boardCards, players, validation]);

  const nextCardOuts = useMemo<MultiwayNextCardOutsResult | null>(() => {
    if (validation || (boardCards.length !== 3 && boardCards.length !== 4)) {
      return null;
    }

    try {
      return calculateNextCardMultiwayOuts(
        players.map((player) => player.cards),
        boardCards,
      );
    } catch {
      return null;
    }
  }, [boardCards, players, validation]);

  const leaderSet = useMemo(() => new Set(comparison?.winningPlayerIndices ?? []), [comparison]);

  const trailingSummaries = useMemo<PlayerOutSummary[]>(() => {
    if (!comparison) {
      return [];
    }

    if (boardCards.length === 5) {
      const finishedSummaries: Array<PlayerOutSummary | null> = players.map((player, index) => {
        if (leaderSet.has(index)) {
          return null;
        }

        return {
          order: index + 1,
          cards: player.cards,
          outCards: [] as PokerCard[],
        };
      });

      return finishedSummaries.filter((player): player is PlayerOutSummary => player !== null);
    }

    if (!nextCardOuts) {
      return [];
    }

    return nextCardOuts.trailingPlayers.map(({ playerIndex, outCards }) => ({
      order: playerIndex + 1,
      cards: players[playerIndex]?.cards ?? [],
      outCards,
    }));
  }, [boardCards.length, comparison, leaderSet, nextCardOuts, players]);

  const leaders = useMemo(
    () =>
      players
        .map((player, index) =>
          leaderSet.has(index)
            ? {
                order: index + 1,
                cards: player.cards,
              }
            : null,
        )
        .filter((player): player is { order: number; cards: PokerCard[] } => player !== null),
    [leaderSet, players],
  );

  const stageLabel = useMemo(() => {
    if (boardCards.length === 3) {
      return t("stageFlopToTurn");
    }

    if (boardCards.length === 4) {
      return t("stageTurnToRiver");
    }

    if (boardCards.length === 5) {
      return t("stageRiverDone");
    }

    return t("stageWaiting");
  }, [boardCards.length, t]);

  const stageAccentClass =
    boardCards.length === 5
      ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
      : "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300";

  const activePickerConfig = useMemo(() => {
    if (isPlayerTarget(resolvedTarget)) {
      const playerId = getPlayerIdFromTarget(resolvedTarget);
      const playerIndex = players.findIndex((player) => player.id === playerId);
      const player = players[playerIndex] ?? players[0];
      const order = (playerIndex >= 0 ? playerIndex : 0) + 1;

      return {
        title: t("pickerDialogTitle", { target: t("playerLabel", { number: order }) }),
        selectedCards: player?.cards ?? [],
        deadCards: usedCards.filter((card) => !(player?.cards ?? []).includes(card)),
        maxCards: 2,
      };
    }

    if (resolvedTarget === "flop") {
      return {
        title: t("pickerDialogTitle", { target: t("flopCards") }),
        selectedCards: flopCards,
        deadCards: usedCards.filter((card) => !flopCards.includes(card)),
        maxCards: 3,
      };
    }

    if (resolvedTarget === "turn") {
      return {
        title: t("pickerDialogTitle", { target: t("turnCard") }),
        selectedCards: turnCard,
        deadCards: usedCards.filter((card) => !turnCard.includes(card)),
        maxCards: 1,
      };
    }

    return {
      title: t("pickerDialogTitle", { target: t("riverCard") }),
      selectedCards: riverCard,
      deadCards: usedCards.filter((card) => !riverCard.includes(card)),
      maxCards: 1,
    };
  }, [flopCards, players, resolvedTarget, riverCard, t, turnCard, usedCards]);

  const handleModalCardChange = (cards: string[] | null) => {
    const parsedCards = parsePickerCards(cards);

    if (isPlayerTarget(resolvedTarget)) {
      handlePlayerCardsChange(getPlayerIdFromTarget(resolvedTarget), parsedCards);
      return;
    }

    if (resolvedTarget === "flop") {
      handleFlopChange(parsedCards);
      return;
    }

    if (resolvedTarget === "turn") {
      handleTurnChange(parsedCards);
      return;
    }

    setRiverCard(parsedCards);
  };

  const summaryMessage = useMemo(() => {
    if (validation) {
      return validation.message;
    }

    if (!comparison) {
      return t("calculationUnavailable");
    }

    if (boardCards.length === 5) {
      return trailingSummaries.length === 0 ? t("allPlayersTied") : t("riverComplete");
    }

    if (trailingSummaries.length === 0) {
      return t("allPlayersTied");
    }

    return null;
  }, [boardCards.length, comparison, t, trailingSummaries.length, validation]);

  const playerRows = (
    <div className="space-y-2">
      {players.map((player, index) => (
        <CompactSelectableRow
          key={player.id}
          title={t("playerLabel", { number: index + 1 })}
          cards={player.cards}
          maxCards={2}
          caption={t("tapToEdit")}
          badgeLabel={leaderSet.has(index) ? t("leaderBadge") : undefined}
          onSelect={() => selectTarget(getPlayerTarget(player.id))}
          onRemove={players.length > 2 ? () => handleRemovePlayer(player.id) : undefined}
        />
      ))}
    </div>
  );

  const boardRows = (
    <div className="space-y-2">
      <CompactSelectableRow
        title={t("flopCards")}
        cards={flopCards}
        maxCards={3}
        caption={t("tapToEdit")}
        onSelect={() => selectTarget("flop")}
      />
      <CompactSelectableRow
        title={t("turnCard")}
        cards={turnCard}
        maxCards={1}
        caption={t("tapToEdit")}
        isDisabled={flopCards.length !== 3}
        disabledReason={t("requiresFlop")}
        onSelect={() => selectTarget("turn")}
      />
      <CompactSelectableRow
        title={t("riverCard")}
        cards={riverCard}
        maxCards={1}
        caption={t("tapToEdit")}
        isDisabled={turnCard.length !== 1}
        disabledReason={t("requiresTurn")}
        onSelect={() => selectTarget("river")}
      />
    </div>
  );

  const summaryPanel = (
    <Card className="rounded-[1.6rem] border-border/80 py-4">
      <CardContent className="space-y-3 px-4 sm:px-5">
        <TopStatusBar
          leaders={leaders}
          boardCards={boardCards}
          stageLabel={stageLabel}
          stageAccentClass={stageAccentClass}
          nextCardOnlyLabel={t("nextCardOnly")}
          currentLeadersLabel={t("currentLeaders")}
        />

        {summaryMessage ? (
          <div className="rounded-[1.2rem] border border-dashed border-border/80 bg-muted/22 px-3 py-3 text-sm text-muted-foreground">
            {summaryMessage}
          </div>
        ) : (
          <ScrollArea className="w-full rounded-[1.1rem]">
            <div className="flex gap-2 pb-2">
              {trailingSummaries.map((player) => (
                <CompactSummaryChip
                  key={`summary-${player.order}`}
                  title={t("playerLabel", { number: player.order })}
                  cards={player.cards}
                  count={player.outCards.length}
                  outsLabel={t("outsLabel")}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  const desktopInputPanel = (
    <Card className="rounded-[1.8rem] border-border/80 py-4">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-black tracking-tight">{t("inputsTitle")}</CardTitle>
            <CardDescription>{t("inputsDescription")}</CardDescription>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={handleAddPlayer}
            disabled={players.length >= MAX_PLAYERS}
          >
            <Plus className="mr-1 size-4" />
            {t("addPlayer")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {playerRows}
        <div className="rounded-[1.3rem] border border-border/70 bg-muted/14 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-black tracking-tight">{t("boardSectionTitle")}</p>
            <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
              {boardCards.length}/5
            </Badge>
          </div>
          {boardRows}
        </div>
      </CardContent>
    </Card>
  );

  const desktopOutsPanel = (
    <Card className="rounded-[1.8rem] border-border/80 py-4">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl font-black tracking-tight">{t("actualCardsTitle")}</CardTitle>
        <CardDescription>{t("actualCardsDescription")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {summaryMessage ? (
          <div className="rounded-[1.2rem] border border-dashed border-border/80 bg-muted/22 px-3 py-3 text-sm text-muted-foreground">
            {summaryMessage}
          </div>
        ) : (
          trailingSummaries.map((player) => (
            <OutCardsPanel
              key={`outs-${player.order}`}
              title={t("playerOutCardsTitle", { number: player.order })}
              cards={player.outCards}
              emptyText={t("none")}
            />
          ))
        )}
      </CardContent>
    </Card>
  );

  const mobileInputPanel = (
    <Card className="rounded-[1.6rem] border-border/80 py-3">
      <CardContent className="px-4">
        <Accordion type="multiple" defaultValue={["players", "board"]} className="space-y-1">
          <AccordionItem value="players" className="border-b-0">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight">{t("playersSectionTitle")}</span>
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
                  {players.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-1">
              <ScrollArea className={cn(players.length > 3 && "max-h-[42dvh]")}>
                <div className="space-y-2 pr-3">{playerRows}</div>
              </ScrollArea>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full rounded-xl"
                onClick={handleAddPlayer}
                disabled={players.length >= MAX_PLAYERS}
              >
                <Plus className="mr-1 size-4" />
                {t("addPlayer")}
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="board" className="border-b-0">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight">{t("boardSectionTitle")}</span>
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
                  {boardCards.length}/5
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-1">{boardRows}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );

  const mobileOutsPanel = (
    <Card className="rounded-[1.6rem] border-border/80 py-3">
      <CardContent className="px-4">
        {summaryMessage ? (
          <div className="rounded-[1.2rem] border border-dashed border-border/80 bg-muted/22 px-3 py-3 text-sm text-muted-foreground">
            {summaryMessage}
          </div>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={trailingSummaries[0] ? [`player-${trailingSummaries[0].order}`] : []}
            className="space-y-2"
          >
            {trailingSummaries.map((player) => (
              <AccordionItem
                key={`mobile-outs-${player.order}`}
                value={`player-${player.order}`}
                className="rounded-[1.2rem] border border-border/75 bg-card/82 px-3"
              >
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      {player.cards.map((card) => (
                        <VisualCard key={`mobile-out-player-${player.order}-${card}`} card={card} size="xs" />
                      ))}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black tracking-tight">{t("playerLabel", { number: player.order })}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.outCards.length} {t("outsLabel")}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <ScrollArea className="max-h-[42dvh] rounded-[1rem] border border-border/70 bg-muted/18">
                    <div className="flex flex-wrap gap-1.5 p-3">
                      {sortCards(player.outCards).map((card) => (
                        <VisualCard key={`mobile-out-card-${player.order}-${card}`} card={card} size="sm" />
                      ))}
                    </div>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );

  const pickerContent = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
        <CardPicker
          selectedCards={activePickerConfig.selectedCards}
          onChange={handleModalCardChange}
          deadCards={activePickerConfig.deadCards}
          maxCards={activePickerConfig.maxCards}
          className="mx-auto max-w-none sm:max-w-none"
        />
      </div>

      <div className="border-t border-border/70 px-4 py-3 sm:px-6">
        <Button type="button" className="w-full rounded-xl sm:w-auto" onClick={() => setIsPickerDialogOpen(false)}>
          {t("done")}
        </Button>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      {summaryPanel}

      <div className="lg:hidden">
        <Tabs defaultValue="setup" className="gap-3">
          <TabsList className="grid h-11 w-full grid-cols-2 rounded-full p-1">
            <TabsTrigger value="setup" className="rounded-full text-xs font-black uppercase tracking-[0.12em]">
              {t("tabInput")}
            </TabsTrigger>
            <TabsTrigger value="outs" className="rounded-full text-xs font-black uppercase tracking-[0.12em]">
              {t("tabOuts")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="mt-0">
            {mobileInputPanel}
          </TabsContent>
          <TabsContent value="outs" className="mt-0">
            {mobileOutsPanel}
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden gap-4 lg:grid xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        {desktopInputPanel}
        {desktopOutsPanel}
      </div>

      {isMobile ? (
        <Sheet open={isPickerDialogOpen} onOpenChange={setIsPickerDialogOpen}>
          <SheetContent
            side="bottom"
            hideCloseButton
            className="h-[92dvh] gap-0 rounded-t-[1.6rem] border-x-0 border-b-0 px-0"
          >
            <SheetHeader className="border-b border-border/70 px-4 py-3">
              <SheetTitle className="text-left text-base font-black tracking-tight">
                {activePickerConfig.title}
              </SheetTitle>
              <SheetDescription className="text-left text-xs">
                {t("pickerDialogDescription")}
              </SheetDescription>
            </SheetHeader>
            {pickerContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isPickerDialogOpen} onOpenChange={setIsPickerDialogOpen}>
          <DialogContent className="w-[calc(100%-1rem)] max-w-5xl gap-0 p-0 sm:max-h-[92vh]">
            <div className="flex max-h-[90vh] flex-col">
              <DialogHeader className="border-b border-border/70 px-4 py-3 sm:px-6 sm:py-4">
                <DialogTitle className="text-base font-black tracking-tight sm:text-lg">
                  {activePickerConfig.title}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {t("pickerDialogDescription")}
                </DialogDescription>
              </DialogHeader>
              {pickerContent}
              <DialogFooter />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
