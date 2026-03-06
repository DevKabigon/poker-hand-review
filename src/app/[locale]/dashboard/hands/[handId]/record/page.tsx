"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useHandEditorStore } from "@/features/hand/editor/handEditorStore";
import { useHandEngineState } from "@/features/hand/editor/useHandEngineState";
import { getPositionLabels } from "@/features/hand/domain/position";
import { getStatusSets } from "@/features/hand/engine/roundCursor";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useTranslations } from "next-intl";
import { MobileNavSheetButton } from "@/components/mobile-nav-sheet-button";
import { Button } from "@/components/ui/button";
import {
  EventLog,
  BoardSelectionDialog,
  ActionArea,
  SaveHandDialog,
  ExitConfirmDialog,
} from "./_components";
import {
  useBoardSelectionDialog,
  useActionSubmit,
  useHandBootstrap,
  useStreetEventHandlers,
  useStreetAdvanceOnNewEvent,
  useStreetAdvance,
  usePageActions,
} from "./_hooks";

export default function ActionRecordingPage() {
  const t = useTranslations("handFlow.record");
  const tPlayers = useTranslations("handFlow.players");
  const params = useParams();
  const router = useRouter();
  const handId = params.handId as string;

  useEffect(() => {
    if (handId) {
      sessionStorage.setItem("currentHandId", handId);
    }
  }, [handId]);

  const {
    config,
    events,
    cursor,
    appendEvent,
    undo,
    redo,
    setCursor,
    startHand,
    buttonSeat,
    setButtonSeat,
    reset,
    replaceStreetEvents,
  } = useHandEditorStore();
  const engineState = useHandEngineState();
  const { user } = useAuthStore();
  const [lastError, setLastError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showBoardDialog, setShowBoardDialog] = useState(false);
  const [pendingStreetAdvance, setPendingStreetAdvance] = useState<{
    nextStreet: "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";
  } | null>(null);
  const [editingStreetEvent, setEditingStreetEvent] = useState<{
    eventIndex: number;
    eventType: "REVEAL_FLOP" | "REVEAL_TURN" | "REVEAL_RIVER";
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
        if (!(seat in badges)) {
          badges[seat] = event.payload.action;
        }
      }
    }
    return badges;
  }, [events, cursor]);

  const foldedSeats = useMemo(() => {
    if (!config) return new Set<number>();
    const eventsUpToCursor = events.slice(0, cursor);
    const { folded } = getStatusSets(eventsUpToCursor, config);
    return folded;
  }, [events, cursor, config]);

  const positionMap = useMemo(() => {
    if (!config) return {};
    return getPositionLabels(config.maxPlayers, buttonSeat);
  }, [config, buttonSeat]);

  const { handleAction } = useActionSubmit({
    currentActor: engineState.currentActor,
    appendEvent,
    setLastError,
  });

  const { handleStreetAdvance } = useStreetAdvance({
    config,
    buttonSeat,
    events,
    showBoardDialog,
    appendEvent,
    setPendingStreetAdvance,
    setShowBoardDialog,
  });

  useHandBootstrap({
    config,
    buttonSeat,
    eventsLength: events.length,
    startHand,
    setButtonSeat,
  });

  useStreetAdvanceOnNewEvent({
    eventsLength: events.length,
    handleStreetAdvance,
  });

  const {
    handleStreetEventClick,
    getFutureStreetCards,
    getCurrentStreetCards,
  } = useStreetEventHandlers({
    events,
    setEditingStreetEvent,
    setPendingStreetAdvance,
    setShowBoardDialog,
  });

  const {
    handleConfirmExit,
    handleSaveClick,
    handleConfirmSave,
  } = usePageActions({
    handId,
    user,
    config,
    events,
    buttonSeat,
    reset,
    setIsSaving,
    setShowExitDialog,
    setShowSaveDialog,
  });

  const {
    handleClose: handleBoardDialogClose,
    handleSkip: handleBoardDialogSkip,
    handleConfirm: handleBoardDialogConfirm,
    editingBoard,
  } = useBoardSelectionDialog({
    pendingStreetAdvance,
    editingStreetEvent,
    events,
    engineStateBoard: engineState.board,
    appendEvent,
    replaceStreetEvents,
    setShowBoardDialog,
    setPendingStreetAdvance,
    setEditingStreetEvent,
    setLastError,
  });

  if (!config) return <div>{t("loadingConfig")}</div>;

  return (
    <div className="relative min-h-full bg-transparent px-4 py-2 md:px-8 md:py-2">
      <div className="mx-auto max-w-[96rem]">
        <div className="flex flex-col gap-[34px] md:gap-[38px]">
          <div className="mx-auto w-full max-w-5xl">
            <div className="flex items-start gap-2 md:gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 hidden shrink-0 rounded-xl min-[900px]:inline-flex"
                onClick={() => router.push(`/hands/${handId}/players`)}
              >
                <ChevronLeft className="mr-1.5 h-4 w-4" />
                {tPlayers("title")}
              </Button>
              <div className="min-w-0 flex-1">
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
                  onStreetEventClick={handleStreetEventClick}
                />
              </div>
            </div>
          </div>

          <ActionArea
            onSaveClick={handleSaveClick}
            isSaving={isSaving}
            config={config}
            engineState={engineState}
            isMobile={isMobile}
            positionMap={positionMap}
            highlightedSeat={highlightedSeat}
            actionBadgeBySeat={actionBadgeBySeat}
            foldedSeats={foldedSeats}
            currentActor={currentActor ?? null}
            lastError={lastError}
            onAction={handleAction}
            onUndo={undo}
            onRedo={redo}
            canUndo={cursor > 1}
            canRedo={cursor < events.length}
          />
        </div>
      </div>

      <MobileNavSheetButton className="fixed bottom-5 right-4 z-40 shadow-lg shadow-black/20 min-[900px]:hidden" />
      <Button
        type="button"
        variant="outline"
        className="fixed bottom-5 left-4 z-40 h-9 rounded-xl px-3 text-xs font-semibold shadow-lg shadow-black/15 min-[900px]:hidden"
        onClick={() => router.push(`/hands/${handId}/players`)}
      >
        <ChevronLeft className="mr-1 h-3.5 w-3.5" />
        {tPlayers("title")}
      </Button>

      {config && pendingStreetAdvance && (
        <BoardSelectionDialog
          isOpen={showBoardDialog}
          onClose={handleBoardDialogClose}
          onSkip={handleBoardDialogSkip}
          onConfirm={handleBoardDialogConfirm}
          nextStreet={
            pendingStreetAdvance.nextStreet as "FLOP" | "TURN" | "RIVER"
          }
          board={editingBoard}
          players={config.players}
          futureStreetCards={
            editingStreetEvent
              ? getFutureStreetCards(
                  editingStreetEvent.eventIndex,
                  editingStreetEvent.eventType
                )
              : []
          }
          currentStreetCards={
            editingStreetEvent
              ? getCurrentStreetCards(
                  editingStreetEvent.eventIndex,
                  editingStreetEvent.eventType
                )
              : []
          }
        />
      )}

      <ExitConfirmDialog
        isOpen={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirm={handleConfirmExit}
      />

      <SaveHandDialog
        isOpen={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onConfirm={handleConfirmSave}
        isSaving={isSaving}
      />
    </div>
  );
}
