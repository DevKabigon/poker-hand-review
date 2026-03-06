// src/features/hand/engine/validateAction.ts
import type { TimelineEvent } from "@/features/hand/domain/events";
import type { HandConfig, SeatIndex } from "@/features/hand/domain/handConfig";
import type { Street } from "@/features/hand/engine/reducer";
import { getLegalActions } from "@/features/hand/engine/legalActions";
import { computeBettingDerived } from "@/features/hand/engine/bettingDerived";
import { getNextActor } from "./nextActor";
import { getCanReopenBettingForSeat } from "./reopenBetting";

type ValidateActionParams = {
  street: Street;
  eventsApplied: TimelineEvent[]; // cursor까지 적용된 이벤트
  config: HandConfig;
  buttonSeat: SeatIndex;
  event: Extract<TimelineEvent, { type: "ACTION" }>;
};

/**
 * Phase 2.0: ACTION 이벤트 "추가"를 허용할지 검증
 * - 지금은 최소 안전장치만 구현
 * - (minRaise, reopen 등은 Phase 2.1+)
 */
export function validateActionOrThrow(params: ValidateActionParams) {
  const { street, eventsApplied, config, buttonSeat, event } = params;

  if (street === "SHOWDOWN") {
    throw new Error("cannot act at SHOWDOWN");
  }

  const { seat, action, amount } = event.payload;

  const betting = computeBettingDerived({ config, street, eventsApplied });

  // 1) 현재 액터만 행동 가능
  const actor = getNextActor({
    street,
    eventsApplied,
    config,
    buttonSeat,
    betting,
  });
  if (actor === null) throw new Error("no actor (street already complete?)");
  if (seat !== actor)
    throw new Error(`not your turn: actor=P${actor}, got=P${seat}`);

  // 2) fold/all-in 이후 행동 방지(간단 버전)
  // currentActor.ts 내부에서도 skip하지만, 혹시 로직 바뀌어도 여기서 확실히 막기
  for (const ev of eventsApplied) {
    if (ev.type !== "ACTION") continue;
    if (ev.payload.seat !== seat) continue;
    if (ev.payload.action === "FOLD") throw new Error("seat already folded");
    if (ev.payload.action === "ALL_IN") throw new Error("seat already all-in");
  }

  // 3) 베팅 파생 계산 (callAmount 등)
  const callAmount = betting.callAmountBySeat[seat] ?? 0;
  const hasBetToCall = callAmount > 0;
  const canReopenBetting = betting.canReopenBetting;

  // 4) 타입 legality
  const legal = getLegalActions({
    street,
    hasBetToCall,
    canReopenBetting,
  });

  if (!legal.includes(action)) {
    throw new Error(
      `illegal action: ${action} (street=${street}, hasBetToCall=${hasBetToCall})`
    );
  }

  // 5) 타입별 amount 검증 (최소)
  if (action === "CHECK") {
    if (callAmount !== 0)
      throw new Error(`cannot CHECK: callAmount=${callAmount}`);
    if (amount !== undefined) throw new Error("CHECK must not have amount");
    return;
  }

  if (action === "FOLD") {
    if (amount !== undefined) throw new Error("FOLD must not have amount");
    return;
  }

  if (action === "CALL") {
    if (typeof amount !== "number") {
      throw new Error(`CALL requires amount (= ${callAmount})`);
    }
    if (amount !== callAmount) {
      throw new Error(
        `invalid CALL amount: expected=${callAmount}, got=${amount}`
      );
    }
    return;
  }

  if (action === "BET") {
    if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
      throw new Error("BET requires positive amount");
    }
    if (hasBetToCall) throw new Error("cannot BET when there is bet to call");
    return;
  }

  if (action === "RAISE") {
    const canReopen = getCanReopenBettingForSeat({
      config,
      street,
      eventsApplied,
      seat,
    });

    if (!canReopen) {
      throw new Error(
        "RAISE is not allowed: betting was not reopened (short raise/all-in)"
      );
    }

    if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
      throw new Error("RAISE requires positive amount");
    }

    if (hasBetToCall && amount <= callAmount) {
      throw new Error(
        `invalid RAISE: amount must be > callAmount (need > ${callAmount}, got ${amount})`
      );
    }

    return;
  }

  if (action === "ALL_IN") {
    if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
      throw new Error("ALL_IN requires positive amount");
    }

    // ✅ ALL_IN이 raise 성격인지 판정:
    // - call이 필요한 상황에서
    // - delta가 callAmount보다 크면
    //   => 레벨을 올리는 raise-like 올인(우회 가능)
    const isRaiseLike = hasBetToCall && amount > callAmount;

    if (isRaiseLike) {
      const canReopen = getCanReopenBettingForSeat({
        config,
        street,
        eventsApplied,
        seat,
      });

      // ✅ betting이 reopen되지 않았다면 raise-like 올인은 금지
      if (!canReopen) {
        throw new Error(
          `ALL_IN is not allowed as a raise: betting was not reopened (need <= callAmount=${callAmount}, got=${amount})`
        );
      }

      // (선택) reopen이 true라도 min-raise를 강제하고 싶으면 여기서 minRaiseTo 비교하면 됨
      // 지금은 short all-in 허용 정책이니까 pass
    }

    // ✅ call-only 올인(callAmount 이하)은 항상 OK
    return;
  }

  // ActionType 확장 대비
  throw new Error(`unknown action: ${action}`);
}
