// src/features/hand/engine/validateAppendEvent.ts

import type { TimelineEvent } from "../domain/events";
import type { HandConfig, SeatIndex } from "../domain/handConfig";
import { replayToCursor } from "./reducer";
import { computeBettingDerived } from "./bettingDerived";
import { getLegalActions } from "./legalActions";
import { getNextActor } from "./nextActor";

export type ValidateAppendEventInput = {
  mode: "record" | "review";
  events: TimelineEvent[];
  cursor: number;

  config: HandConfig | null;
  buttonSeat: SeatIndex | null;

  event: TimelineEvent;
};

export type ValidateAppendEventResult =
  | { ok: true }
  | { ok: false; reason: string };

export function validateAppendEvent(
  input: ValidateAppendEventInput
): ValidateAppendEventResult {
  const { mode, events, cursor, config, buttonSeat, event } = input;

  if (mode !== "record") return { ok: false, reason: "not in record mode" };

  // ✅ append-only: 커서가 end가 아니면(undo 상태) append 금지 (원하면 허용 가능)
  if (cursor !== events.length) {
    return { ok: false, reason: "cursor is not at the end" };
  }

  // ✅ POST_BLINDS는 첫 이벤트로 1회만
  if (event.type === "POST_BLINDS") {
    if (events.length > 0)
      return { ok: false, reason: "POST_BLINDS must be the first event" };
    return { ok: true };
  }

  // ---- 여기부터는 “핸드가 시작된 이후” 이벤트만 허용 ----
  const handStarted = events[0]?.type === "POST_BLINDS";
  if (!handStarted) {
    return { ok: false, reason: "hand not started (missing POST_BLINDS)" };
  }

  // config/buttonSeat 필수 (actor 계산에 필요)
  if (!config) return { ok: false, reason: "config not set" };
  if (buttonSeat === null) return { ok: false, reason: "buttonSeat not set" };

  // 현재 시점(base)은 events 전체 적용 상태(= cursor=end) 기준
  const base = replayToCursor(events, events.length);

  // ✅ betting 파생 (callAmount 계산에 필요)
  const betting = computeBettingDerived({
    config,
    street: base.street,
    eventsApplied: events,
  });

  // ✅ currentActor = getNextActor 로 통일
  const currentActor = getNextActor({
    street: base.street,
    eventsApplied: events,
    config,
    buttonSeat,
    betting,
  });

  if (currentActor === null) {
    return { ok: false, reason: "no current actor (street complete?)" };
  }

  // ACTION만 턴/액션 유효성 체크
  if (event.type !== "ACTION") return { ok: true };

  const { seat, action, amount } = event.payload;

  // ✅ 현재 actor가 아닌 seat는 금지
  if (seat !== currentActor) {
    return { ok: false, reason: `not your turn: expected P${currentActor}` };
  }

  const callAmount = betting.callAmountBySeat[seat] ?? 0;

  const canReopenBetting = betting.canReopenBetting;

  const legal = getLegalActions({
    street: base.street,
    hasBetToCall: callAmount > 0,
    canReopenBetting,
  });

  // ✅ legalActions에 없는 액션 금지
  if (!legal.includes(action)) {
    return {
      ok: false,
      reason: `illegal action: ${action} (legal: ${legal.join(",")})`,
    };
  }

  // ✅ amount 필요 액션 검증 (MVP)
  const needsAmount =
    action === "CALL" ||
    action === "BET" ||
    action === "RAISE" ||
    action === "ALL_IN";
  if (needsAmount && (amount === undefined || Number.isNaN(amount))) {
    return { ok: false, reason: `amount required for ${action}` };
  }

  // ✅ CALL amount 정확성까지 여기서 막고 싶으면 (추천)
  if (action === "CALL") {
    if (amount !== callAmount) {
      return {
        ok: false,
        reason: `invalid CALL amount: expected ${callAmount}, got ${amount}`,
      };
    }
  }

  // (선택) CALL은 callAmount와 같아야 한다 같은 규칙은 Phase 2.1에서 더 엄격히
  return { ok: true };
}
