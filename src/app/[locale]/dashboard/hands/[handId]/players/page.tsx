"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronLeft, Coins, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { PokerTable } from "@/components/poker/poker-table";
import { useHandEditorStore } from "@/features/hand/editor/handEditorStore";
import { PlayerConfig } from "@/features/hand/domain/handConfig";
import { Card as PokerCard } from "@/features/hand/domain/cards";
import { PlayerDetailDialog } from "@/components/poker/player-detail-dialog";
import { Header } from "./_components/header";
import { getPositionLabels } from "@/features/hand/domain/position";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PlayerSettingsPage() {
  const t = useTranslations("handFlow.players");
  const tSetup = useTranslations("handFlow.setup");
  const tStart = useTranslations("startHand");
  const params = useParams();
  const router = useRouter();

  const config = useHandEditorStore((s) => s.config);
  const setConfig = useHandEditorStore((s) => s.setConfig);
  const startHand = useHandEditorStore((s) => s.startHand);
  const events = useHandEditorStore((s) => s.events);
  const reset = useHandEditorStore((s) => s.reset);
  const buttonSeat = useHandEditorStore((s) => s.buttonSeat);
  const setButtonSeat = useHandEditorStore((s) => s.setButtonSeat);

  const [isMobile, setIsMobile] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const positionMap = useMemo(() => {
    if (!config) return {};
    return getPositionLabels(config.maxPlayers, buttonSeat);
  }, [config, buttonSeat]);

  const blockedBoardCards = useMemo(() => {
    const boardCards: PokerCard[] = [];

    for (const event of events) {
      if (event.type === "REVEAL_FLOP") {
        boardCards.push(...event.payload.cards);
      } else if (event.type === "REVEAL_TURN" && event.payload.card) {
        boardCards.push(event.payload.card);
      } else if (event.type === "REVEAL_RIVER" && event.payload.card) {
        boardCards.push(event.payload.card);
      }
    }

    return Array.from(new Set(boardCards));
  }, [events]);

  const handleUpdatePlayer = (seat: number, data: Partial<PlayerConfig>) => {
    if (!config) return;
    let nextPlayers = [...config.players];
    if (data.isHero === true) {
      nextPlayers = nextPlayers.map((p) => ({ ...p, isHero: p.seat === seat }));
    } else if (data.isHero === false) {
      return;
    } else {
      nextPlayers = nextPlayers.map((p) =>
        p.seat === seat ? { ...p, ...data } : p
      );
    }
    setConfig({ ...config, players: nextPlayers });
  };

  const handlePlayerClick = (seat: number) => {
    setSelectedSeat(seat);
    setIsModalOpen(true);
  };

  const navigateToActionRecording = () => {
    if (!config) return;

    try {
      if (events.length === 0) {
        startHand();
      }

      router.push(`/hands/${params.handId}/record`);
    } catch (error) {
      console.error("Failed to start hand:", error);
      toast.error(t("toastStartFailed"));
    }
  };

  const handleResumeAction = () => {
    sessionStorage.setItem("fromPlayerSettings", "true");
    navigateToActionRecording();
  };

  const handleConfirmNewAction = () => {
    const preservedButtonSeat = buttonSeat;
    setShowResetDialog(false);
    reset({ keepSetup: true });
    setButtonSeat(preservedButtonSeat);
    sessionStorage.setItem("fromPlayerSettings", "true");
    navigateToActionRecording();
  };

  if (!config) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Button
          onClick={() => router.push(`/hands/${params.handId}/setup`)}
        >
          {t("noConfig")}
        </Button>
      </div>
    );
  }

  const bbUnit = config.blinds.bb;
  const players = config.players;
  const selectedPlayer = players.find((p) => p.seat === selectedSeat) || null;
  const hasRecordedActions = events.length > 1;

  return (
    <div className="relative min-h-full px-4 pt-5 pb-3 md:px-6 md:pt-4 md:pb-3">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-3 grid grid-cols-1 gap-3 md:mb-4 min-[1160px]:grid-cols-[1fr_auto] min-[1160px]:items-start">
          <Header />

          <div className="rounded-2xl border border-border bg-muted/50 p-3.5 text-muted-foreground min-[1160px]:min-w-[20rem] min-[1160px]:justify-self-end">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest uppercase opacity-50">
                  {config.gameType === "CASH"
                    ? t("currentStakes")
                    : t("currentBlinds")}
                </p>
                <p className="text-sm font-bold text-foreground">
                  {config.blinds.sb} / {config.blinds.bb}{" "}
                  <span className="ml-2 font-medium text-muted-foreground">
                    (
                    {config.gameType === "CASH"
                      ? t("gameTypeCash")
                      : t("gameTypeTournament")}
                    )
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <Card className="rounded-[1.5rem] border-border bg-card/40 p-1 shadow-xl backdrop-blur-md md:rounded-[2rem]">
            <div className="px-3 py-[44px] md:px-4 md:py-[50px]">
              <PokerTable
                players={players}
                maxPlayers={config.maxPlayers}
                isMobile={isMobile}
                onSeatClick={handlePlayerClick}
                positionMap={positionMap}
                tableTheme="classic"
                tableSize="wide"
                desktopSeatScale="compact"
              />
            </div>
          </Card>

          {hasRecordedActions ? (
            <div className="flex flex-col gap-2.5">
              <Button
                onClick={handleResumeAction}
                variant="super"
                className="h-11 w-full rounded-2xl text-base font-bold shadow-lg shadow-sky-500/20 transition-transform hover:scale-[1.01] md:h-10"
              >
                <Play className="mr-2 h-4.5 w-4.5" />
                {t("resumeRecordingAction")}
              </Button>
              <Button
                onClick={() => setShowResetDialog(true)}
                variant="primary"
                className="h-11 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] md:h-10"
              >
                <RotateCcw className="mr-2 h-4.5 w-4.5" />
                {t("startNewAction")}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleResumeAction}
              variant="primary"
              className="h-11 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] md:h-10"
            >
              {t("startRecordingAction")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <PlayerDetailDialog
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdatePlayer}
        bbUnit={bbUnit}
        allPlayers={players}
        blockedCards={blockedBoardCards}
      />

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("startNewAction")}</DialogTitle>
            <DialogDescription>{t("startNewActionDescription")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowResetDialog(false)}>
              {tStart("cancel")}
            </Button>
            <Button variant="danger" onClick={handleConfirmNewAction}>
              {t("startNewAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        type="button"
        variant="outline"
        className="fixed bottom-5 left-4 z-40 h-9 rounded-xl px-3 text-xs font-semibold shadow-lg shadow-black/15 min-[900px]:hidden"
        onClick={() => router.push(`/hands/${params.handId}/setup`)}
      >
        <ChevronLeft className="mr-1 h-3.5 w-3.5" />
        {tSetup("title")}
      </Button>
    </div>
  );
}
