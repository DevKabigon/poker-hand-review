"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PokerTable } from "@/components/poker/poker-table";
import { useHandEditorStore } from "@/features/hand/editor/handEditorStore";
import { useHandEngineState } from "@/features/hand/editor/useHandEngineState";
import { getPositionLabels } from "@/features/hand/domain/position";
import { getStatusSets } from "@/features/hand/engine/roundCursor";
import { EventLog } from "@/app/[locale]/dashboard/hands/[handId]/record/_components";
import {
  enableHandShare,
  loadHand,
  loadSharedHandByToken,
} from "@/features/hand/db/handService";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function ReviewPage() {
  const tReview = useTranslations("handFlow.review");
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const handId = params.handId as string;
  const shareToken = searchParams.get("share");
  const isSharedMode = Boolean(shareToken);

  const {
    config,
    events,
    cursor,
    setCursor,
    setConfig,
    setButtonSeat,
    setMode,
    reset,
  } = useHandEditorStore();
  const engineState = useHandEngineState();
  const { buttonSeat } = useHandEditorStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const getErrorMessage = (error: unknown, fallback?: string) => {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  useEffect(() => {
    const loadHandData = async () => {
      try {
        setIsLoading(true);
        const handData = shareToken
          ? await loadSharedHandByToken(shareToken)
          : await loadHand(handId);

        if (!handData) {
          toast.error(tReview("toastNotFound"));
          router.push(shareToken ? "/" : "/history");
          return;
        }

        if (shareToken && handData.hand_id !== handId) {
          router.replace(`/hands/${handData.hand_id}/review?share=${shareToken}`);
          return;
        }

        reset({ keepSetup: false });
        setConfig(handData.config);
        setButtonSeat(handData.button_seat);
        setMode("review");

        useHandEditorStore.setState({
          events: handData.events,
          cursor: 0,
        });
      } catch (error: unknown) {
        console.error("Failed to load hand:", error);
        toast.error(tReview("toastLoadFailed"));
        router.push(shareToken ? "/" : "/history");
      } finally {
        setIsLoading(false);
      }
    };

    loadHandData();
    return () => {
      reset({ keepSetup: false });
    };
  }, [
    handId,
    router,
    setConfig,
    setButtonSeat,
    setMode,
    reset,
    tReview,
    shareToken,
  ]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const investedForBetBySeat = engineState.betting?.investedForBetBySeat ?? {};

  const currentActor = useMemo(() => {
    if (engineState.currentActor === null) return null;
    return config?.players.find((p) => p.seat === engineState.currentActor);
  }, [engineState.currentActor, config]);

  const highlightedSeat = useMemo(() => {
    if (cursor <= 0 || cursor > events.length) return null;
    const event = events[cursor - 1];
    if (event.type === "ACTION" || event.type === "SHOWDOWN_REVEAL") {
      return event.payload.seat ?? null;
    }
    return null;
  }, [events, cursor]);

  const actionBadgeBySeat = useMemo(() => {
    const badges: Record<number, string> = {};
    const eventsUpToCursor = events.slice(0, cursor);
    for (let i = eventsUpToCursor.length - 1; i >= 0; i--) {
      const event = eventsUpToCursor[i];
      if (event.type === "ACTION") {
        const seat = event.payload.seat;
        if (!(seat in badges)) badges[seat] = event.payload.action;
      }
    }
    return badges;
  }, [events, cursor]);

  const foldedSeats = useMemo(() => {
    if (!config) return new Set<number>();
    const { folded } = getStatusSets(events.slice(0, cursor), config);
    return folded;
  }, [events, cursor, config]);

  const positionMap = useMemo(() => {
    if (!config) return {};
    return getPositionLabels(config.maxPlayers, buttonSeat ?? 0);
  }, [config, buttonSeat]);

  const handlePrevious = () => cursor > 0 && setCursor(cursor - 1);
  const handleNext = () => cursor < events.length && setCursor(cursor + 1);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const token = await enableHandShare(handId);
      const sharedUrl = `${window.location.origin}${window.location.pathname}?share=${token}`;
      await navigator.clipboard.writeText(sharedUrl);
      toast.success(tReview("toastShareCopied"));
    } catch (error: unknown) {
      console.error("Failed to share hand:", error);
      toast.error(tReview("toastShareFailed"), {
        description: getErrorMessage(error),
      });
    } finally {
      setIsSharing(false);
    }
  };

  const gameInfo = useMemo(() => {
    if (!config) return null;

    const { blinds, gameType, maxPlayers } = config;
    const anteText =
      blinds.anteAmount && blinds.anteAmount > 0
        ? ` + ${tReview("anteSuffix", { amount: blinds.anteAmount })}`
        : "";
    const typeLabel =
      gameType === "CASH"
        ? tReview("gameTypeCash")
        : tReview("gameTypeTournament");

    return {
      type: typeLabel,
      blinds: `${blinds.sb}/${blinds.bb}${anteText}`,
      maxPlayers,
    };
  }, [config, tReview]);

  const currentStreetLabel = useMemo(() => {
    switch (engineState.street) {
      case "PREFLOP":
        return tReview("streetPreflop");
      case "FLOP":
        return tReview("streetFlop");
      case "TURN":
        return tReview("streetTurn");
      case "RIVER":
        return tReview("streetRiver");
      case "SHOWDOWN":
        return tReview("streetShowdown");
      default:
        return engineState.street;
    }
  }, [engineState.street, tReview]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
        <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
          {tReview("loading")}
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {tReview("configError")}
      </div>
    );
  }

  return (
    <div className="relative min-h-full bg-transparent px-4 py-2 md:px-8 md:py-2">
      <div className="mx-auto max-w-[96rem]">
        <div className="mx-auto w-full max-w-5xl">
          <header className="mb-4 md:mb-5">
            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-max items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/85 px-2.5 py-2 shadow-[var(--shadow-soft)]">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(isSharedMode ? "/" : "/history")}
                    className="h-8 w-8 rounded-full"
                    aria-label={
                      isSharedMode ? tReview("backToHome") : tReview("backToHistory")
                    }
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </Button>

                  <span className="text-sm font-black tracking-tight text-foreground">
                    {tReview("title")}
                  </span>

                  <Badge
                    variant="secondary"
                    className="h-6 rounded-md border-none bg-primary/12 px-2 text-[12px] font-bold text-primary"
                  >
                    {gameInfo?.type}
                  </Badge>

                  <span className="h-1 w-1 rounded-full bg-border" />

                  <span className="text-xs font-semibold text-muted-foreground">
                    {tReview("blindsLabel")}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {gameInfo?.blinds}
                  </span>

                  <span className="h-1 w-1 rounded-full bg-border" />

                  <span className="text-xs font-semibold text-muted-foreground">
                    {tReview("maxPlayersLabel")}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {tReview("maxPlayersValue", { count: gameInfo?.maxPlayers ?? 0 })}
                  </span>

                  <span className="h-1 w-1 rounded-full bg-border" />

                  <span className="text-xs font-semibold text-muted-foreground">
                    {tReview("streetLabel")}
                  </span>
                  <Badge
                    variant="outline"
                    className="h-6 rounded-md border-primary/25 bg-primary/6 px-2 text-[11px] font-black text-primary"
                  >
                    {currentStreetLabel}
                  </Badge>
                </div>

                {!isSharedMode ? (
                  <Button
                    variant="super"
                    size="sm"
                    onClick={handleShare}
                    disabled={isSharing}
                    className="h-7 shrink-0 rounded-md px-2.5 text-[11px] font-black"
                  >
                    <Share2 className="mr-1.5 h-3.5 w-3.5" />
                    {isSharing ? tReview("sharing") : tReview("share")}
                  </Button>
                ) : null}
              </div>
            </div>
          </header>
        </div>

        <div className="flex flex-col gap-[44px] md:gap-[48px]">
          <div className="mx-auto w-full max-w-5xl">
            <EventLog
              events={events}
              cursor={cursor}
              setCursor={setCursor}
              config={config}
              currentActor={engineState.currentActor}
              currentActorPlayer={currentActor}
              isMobile={isMobile}
              forceCompactTop
              positionMap={positionMap}
              showCurrentActor={false}
              autoScrollToLatest={false}
            />
          </div>

          <div className="w-full min-[1024px]:min-w-0 min-[1024px]:flex-1">
            <div className="space-y-0 min-[1024px]:space-y-6">
              <div className="relative">
                <PokerTable
                  players={config.players}
                  maxPlayers={config.maxPlayers}
                  isMobile={isMobile}
                  onSeatClick={() => {}}
                  positionMap={positionMap}
                  activeSeat={engineState.currentActor}
                  highlightedSeat={highlightedSeat}
                  investedForBetBySeat={investedForBetBySeat}
                  totalPotChips={engineState.totalPot}
                  preBetPotChips={engineState.preBetPot}
                  street={engineState.street}
                  board={engineState.board}
                  pots={engineState.pots}
                  stackBySeat={engineState.stackBySeat}
                  actionBadgeBySeat={actionBadgeBySeat}
                  foldedSeats={foldedSeats}
                  isClickable={false}
                  tableTheme="classic"
                  tableSize="wide"
                />
              </div>

              <div className="w-full pt-6 min-[1024px]:mx-auto min-[1024px]:max-w-[44rem] min-[1024px]:pt-8">
                <div className="mx-auto flex w-full max-w-sm items-center justify-center gap-4 rounded-2xl border border-border/70 bg-card/85 px-4 py-3 shadow-[var(--shadow-soft)]">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePrevious}
                    disabled={cursor <= 0}
                    className="rounded-lg"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="min-w-24 text-center">
                    <span className="text-sm font-bold tabular-nums">
                      {cursor} / {events.length}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNext}
                    disabled={cursor >= events.length}
                    className="rounded-lg"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
