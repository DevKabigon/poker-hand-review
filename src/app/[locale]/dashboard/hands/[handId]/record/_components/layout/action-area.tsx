// src/app/hands/[handId]/new/(action-recording)/_components/action-area.tsx

import { PokerTable } from "@/components/poker/poker-table";
import { ActionPanel } from "@/components/poker/action-panel";
import { PlayerConfig } from "@/features/hand/domain/handConfig";
import type { ActionType } from "@/features/hand/domain/events";
import type { BettingDerived } from "@/features/hand/engine/bettingDerived";
import type { Street } from "@/features/hand/engine/reducer";
import type { Card } from "@/features/hand/domain/cards";
import type { LabeledPot } from "@/features/hand/engine/potLabels";
import { useTranslations } from "next-intl";

type ActionAreaEngineState = {
  currentActor: number | null;
  betting: BettingDerived | null;
  canReopenBetting: boolean;
  investedTotalBySeat: Record<number, number>;
  refundBySeat: Record<number, number>;
  stackBySeat: Record<number, number>;
  actorCallAmount: number;
  totalPot: number;
  preBetPot: number;
  street: Street;
  board: Card[];
  pots: LabeledPot[];
};

interface ActionAreaProps {
  config: {
    players: PlayerConfig[];
    maxPlayers: number;
    blinds: { bb: number };
  };
  engineState: ActionAreaEngineState;
  isMobile: boolean;
  positionMap: Record<number, string>;
  highlightedSeat: number | null;
  actionBadgeBySeat: Record<number, string>;
  foldedSeats: Set<number>;
  currentActor: PlayerConfig | null;
  lastError: string | null;
  onAction: (action: ActionType, amount?: number) => void;
  onSaveClick?: () => void;
  isSaving?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function ActionArea({
  config,
  engineState,
  isMobile,
  positionMap,
  highlightedSeat,
  actionBadgeBySeat,
  foldedSeats,
  currentActor,
  lastError,
  onAction,
  onSaveClick,
  isSaving,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ActionAreaProps) {
  const t = useTranslations("handFlow.record");

  const investedForBet =
    engineState.betting?.investedForBetBySeat?.[
      engineState.currentActor ?? 0
    ] ?? 0;

  const minRaiseTo = engineState.betting?.minRaiseTo ?? 0;
  const canRaiseForSeat = engineState.canReopenBetting ?? true;

  const actorSeat = engineState.currentActor;

  // ✅ 스택 계산: 초기 스택 - 투자 총액 + 리펀드
  // stackBySeat가 최신 상태를 반영하지 않을 수 있으므로 직접 계산
  const actorTotal =
    actorSeat !== null
      ? config.players.find((p) => p.seat === actorSeat)?.stack ?? 0
      : 0;
  const investedTotal =
    actorSeat !== null ? engineState.investedTotalBySeat[actorSeat] ?? 0 : 0;
  const refunded =
    actorSeat !== null ? engineState.refundBySeat[actorSeat] ?? 0 : 0;
  const actorStackChips = Math.max(0, actorTotal - investedTotal + refunded);

  return (
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
            investedForBetBySeat={
              engineState.betting?.investedForBetBySeat ?? {}
            }
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
            tableSize={isMobile ? "wide" : "wideShort"}
            seatInfoSize={isMobile ? "lg" : "default"}
          />
        </div>

        {lastError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold animate-in fade-in slide-in-from-top-1">
            {t("errorPrefix")}: {lastError}
          </div>
        )}

        <div className="w-full pt-[44px] min-[1024px]:pt-8 min-[1024px]:max-w-[44rem] min-[1024px]:mx-auto">
          <ActionPanel
            actorName={currentActor?.name ?? null}
            street={engineState.street}
            bb={config.blinds.bb}
            pot={engineState.totalPot}
            toCall={engineState.actorCallAmount}
            investedForBet={investedForBet}
            betting={engineState.betting}
            minRaiseTo={minRaiseTo}
            canRaiseForSeat={canRaiseForSeat}
            actorStackChips={actorStackChips}
            onAction={onAction}
            onSaveClick={onSaveClick}
            isSaving={isSaving}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        </div>
      </div>
    </div>
  );
}

