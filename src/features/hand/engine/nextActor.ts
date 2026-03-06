// src/features/hand/engine/nextActor.ts
import type { TimelineEvent } from "@/features/hand/domain/events";
import type { HandConfig, SeatIndex } from "@/features/hand/domain/handConfig";
import type { Street } from "./reducer";
import type { BettingDerived } from "./bettingDerived";
import { getActionOrderForStreet } from "./actionOrder";
import {
  getStatusSets,
  getLastActionSeatThisStreet,
  getActedSeatsThisStreet,
  getLastAggressionIndexThisStreet_LevelIncrease,
  getActedSeatsSinceIndex,
  getStreetStartIndex,
} from "./roundCursor";
import { areAllActivePlayersAllIn } from "./streetCompletion";

export function getNextActor(params: {
  street: Street;
  eventsApplied: TimelineEvent[];
  config: HandConfig;
  buttonSeat: SeatIndex;
  betting: BettingDerived;
}): SeatIndex | null {
  const { street, eventsApplied, config, buttonSeat, betting } = params;
  if (street === "SHOWDOWN") return null;

  // ✅ 모든 활성 플레이어가 올인이고 추가 액션이 필요 없으면 null 반환
  const allAllIn = areAllActivePlayersAllIn({
    config,
    eventsApplied,
    betting,
  });
  if (allAllIn) {
    return null;
  }

  const order = getActionOrderForStreet(street, config, buttonSeat);
  const { folded, allIn } = getStatusSets(eventsApplied, config);

  // ✅ last action seat 기준으로 다음부터 스캔
  const lastSeat = getLastActionSeatThisStreet(eventsApplied, street);
  const startIdx =
    lastSeat === null
      ? 0
      : (order.indexOf(lastSeat) + 1 + order.length) % order.length;

  // ✅ 공격 기준선 결정
  const lastAggIdx = getLastAggressionIndexThisStreet_LevelIncrease({
    config,
    street,
    eventsApplied,
  });

  // 공격이 있었으면: lastAgg 이후에 acted 했는지(=반응)
  // 공격이 없었으면: street start 이후 acted 했는지(=첫 행동)
  const streetStart = getStreetStartIndex(eventsApplied, street);

  // ✅ 공격이 있었으면: lastAggIdx "그 자체"부터 acted로 본다 (공격자 포함)
  const actedGateStart = lastAggIdx !== null ? lastAggIdx : streetStart;

  const actedGate =
    lastAggIdx !== null
      ? getActedSeatsSinceIndex(eventsApplied, actedGateStart)
      : getActedSeatsThisStreet(eventsApplied, street);

  // 한 바퀴 스캔
  for (let step = 0; step < order.length; step++) {
    const seat = order[(startIdx + step) % order.length];

    if (folded.has(seat)) continue;
    if (allIn.has(seat)) continue;

    const callAmount = betting.callAmountBySeat[seat] ?? 0;

    // ✅ 콜할 게 있으면: acted 여부 상관없이 무조건 행동해야 함
    if (callAmount > 0) return seat;

    // ✅ 콜할 게 없으면:
    // - 공격이 없었다면: 이번 스트릿에 아직 행동 안 한 사람은 체크 기회
    // - 공격이 있었다면: 마지막 공격 이후에 아직 반응 안 한 사람은 체크/폴드/콜/레이즈 기회
    if (!actedGate.has(seat)) return seat;
  }

  return null;
}
