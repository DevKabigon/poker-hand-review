// src/features/hand/editor/useHandEngineState.ts

import { useMemo } from "react";
import { useHandEditorStore } from "./handEditorStore";
import { replayToCursor } from "../engine/reducer";
import { getLegalActions } from "../engine/legalActions";
import { computeBettingDerived } from "../engine/bettingDerived";
import { getNextActor } from "../engine/nextActor";
import { getCanReopenBettingForSeat } from "../engine/reopenBetting";
import { computePots } from "../engine/pots";
import { computeTotalPot } from "../engine/potTotal";
import { labelPots } from "../engine/potLabels";
import { applyUncalledRefund } from "../engine/uncalledRefund";
import { computeStackBySeat } from "../engine/stackBySeat";

/**
 * 핸드 엔진 파생 상태를 가져오는 전용 훅
 *
 * - events/cursor 변경에 정확히 반응한다.
 * - replayToCursor는 "이벤트 재생"만 담당한다.
 * - actor / legalActions 등은 모두 여기서 파생 계산한다.
 */

export function useHandEngineState() {
  const events = useHandEditorStore((s) => s.events);
  const cursor = useHandEditorStore((s) => s.cursor);
  const config = useHandEditorStore((s) => s.config);
  const buttonSeat = useHandEditorStore((s) => s.buttonSeat);

  return useMemo(() => {
    // 1) base 엔진 상태 (순수 replay)
    const base = replayToCursor(events, cursor);

    // 2) cursor 보정 + 적용된 이벤트
    // ✅ cursor는 항상 events.length와 같거나 작아야 하므로, events.length를 사용하는 것이 더 안전합니다
    // 하지만 cursor를 사용하는 이유는 undo/redo를 지원하기 위함입니다
    const safeCursor = Math.max(0, Math.min(cursor, events.length));
    const eventsApplied = events.slice(0, safeCursor);

    // ✅ 현재 시점에서 핸드 시작됨? (POST_BLINDS가 "적용" 되었는지)
    const handStartedAtCursor =
      safeCursor >= 1 && eventsApplied[0]?.type === "POST_BLINDS";

    const totalPot = computeTotalPot(eventsApplied);

    const betting = config
      ? computeBettingDerived({
          config,
          street: base.street,
          eventsApplied,
        })
      : null;

    const potComputed =
      handStartedAtCursor && config
        ? computePots({ config, eventsApplied })
        : null;
    const potRaw = potComputed?.pots ?? [];

    const currentActor =
      handStartedAtCursor && config && buttonSeat !== null && betting
        ? getNextActor({
            street: base.street,
            eventsApplied,
            config,
            buttonSeat,
            betting,
          })
        : null;

    const isRoundClosed =
      // 다음 스트릿 이벤트가 생성되었거나, 더 이상 액터가 없으면(폴드 종료/스트릿 종료/올인 종료) round closed로 본다.
      eventsApplied.length > 0 &&
      (["REVEAL_FLOP", "REVEAL_TURN", "REVEAL_RIVER", "SHOWDOWN"].includes(
        eventsApplied[eventsApplied.length - 1].type
      ) ||
        currentActor === null);

    const refunded = applyUncalledRefund(potRaw, {
      roundClosed: isRoundClosed,
    });

    // ✅ UI에는 환불 반영된 pots를 사용해야 side pot 과다 노출이 없다.
    const labeledPots = labelPots(refunded.pots);
    const activeContributorCount = potComputed
      ? Object.entries(potComputed.investedBySeat).filter(
          ([seat, amt]) => amt > 0 && !potComputed.foldedSeatSet.has(Number(seat))
        ).length
      : 0;

    // ✅ 표시용 보정:
    // heads-up(실질 활성 참가자 2명 이하)에서는 side pot이 의미상 필요 없으므로
    // 분해된 팟을 하나의 MAIN pot으로 합쳐 보여준다.
    const pots =
      activeContributorCount <= 2 && labeledPots.length > 1
        ? [
            {
              ...labeledPots[0],
              amount: labeledPots.reduce((sum, p) => sum + p.amount, 0),
              eligibleSeatSet: Array.from(
                new Set(labeledPots.flatMap((p) => p.eligibleSeatSet))
              ).sort((a, b) => a - b),
              label: "MAIN",
            },
          ]
        : labeledPots;
    const investedTotalBySeat = potComputed?.investedBySeat ?? {};

    const refundBySeat = refunded.refundBySeat;
    const refundedAmountTotal = refunded.refundedAmountTotal;

    const actorHasBetToCall =
      betting && currentActor !== null
        ? betting.hasBetToCallBySeat[currentActor] ?? false
        : false;

    const actorCallAmount =
      betting && currentActor !== null
        ? betting.callAmountBySeat[currentActor] ?? 0
        : 0;

    const canReopenBetting =
      handStartedAtCursor && config && currentActor !== null
        ? getCanReopenBettingForSeat({
            config,
            street: base.street,
            eventsApplied,
            seat: currentActor,
          })
        : true;

    // 4) 가능 액션
    const legalActions =
      handStartedAtCursor && currentActor !== null && betting !== null
        ? getLegalActions({
            street: base.street,
            hasBetToCall: actorHasBetToCall,
            canReopenBetting,
          })
        : [];

    const investedForBetBySeat = betting?.investedForBetBySeat ?? {};

    const streetBetSum = Object.values(investedForBetBySeat).reduce(
      (a, b) => a + (b ?? 0),
      0
    );

    const preBetPot = Math.max(0, totalPot - streetBetSum);

    const stackBySeat =
      handStartedAtCursor && config
        ? computeStackBySeat({ config, eventsApplied })
        : {};

    return {
      ...base,
      totalPot,
      preBetPot,
      streetBetSum,
      pots,
      handStartedAtCursor,
      currentActor,
      legalActions,
      betting,
      actorHasBetToCall,
      actorCallAmount,
      canReopenBetting,
      refundBySeat,
      refundedAmountTotal,
      investedTotalBySeat,
      stackBySeat,
    };
  }, [events, cursor, config, buttonSeat]);
}
