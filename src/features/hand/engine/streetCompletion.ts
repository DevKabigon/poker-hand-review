// src/features/hand/engine/streetCompletion.ts
import type { TimelineEvent } from "@/features/hand/domain/events";
import type { HandConfig, SeatIndex } from "@/features/hand/domain/handConfig";
import type { Street } from "./reducer";
import type { BettingDerived } from "./bettingDerived";
import { getStatusSets } from "./roundCursor";
import { getNextActor } from "./nextActor";

export function getActiveSeats(params: {
  config: HandConfig;
  eventsApplied: TimelineEvent[];
}): SeatIndex[] {
  const { config, eventsApplied } = params;
  const { folded } = getStatusSets(eventsApplied, config);

  return config.players.map((p) => p.seat).filter((seat) => !folded.has(seat));
}

export function isHandOverByFolds(params: {
  config: HandConfig;
  eventsApplied: TimelineEvent[];
}): { over: boolean; winner: SeatIndex | null } {
  const active = getActiveSeats(params);
  // 디버깅: 활성 플레이어 수 확인
  if (process.env.NODE_ENV === "development") {
    const { folded } = getStatusSets(params.eventsApplied, params.config);
    console.log(
      `[isHandOverByFolds] active=${active.length}, activeSeats=[${active.join(
        ", "
      )}], folded=[${Array.from(folded).join(", ")}], totalPlayers=${
        params.config.players.length
      }`
    );
  }
  if (active.length === 1) return { over: true, winner: active[0] };
  return { over: false, winner: null };
}

export function isStreetComplete(params: {
  street: Street;
  eventsApplied: TimelineEvent[];
  config: HandConfig;
  buttonSeat: SeatIndex;
  betting: BettingDerived;
}): boolean {
  return getNextActor(params) === null;
}

/**
 * 모든 활성 플레이어가 올인 상태이고 추가 액션이 필요 없는지 확인
 * (숏스택 올인 후 딥스택이 추가 액션할 수 있는 경우는 제외)
 */
export function areAllActivePlayersAllIn(params: {
  config: HandConfig;
  eventsApplied: TimelineEvent[];
  betting: BettingDerived;
}): boolean {
  const { config, eventsApplied, betting } = params;
  const { folded, allIn } = getStatusSets(eventsApplied, config);

  const activeSeats = config.players
    .map((p) => p.seat)
    .filter((seat) => !folded.has(seat));

  if (activeSeats.length <= 1) return false;

  // ✅ 핵심 수정: 올인이 아닌(칩이 남은) 활성 플레이어가 1명 이하인지 확인
  const notAllInActiveSeats = activeSeats.filter((seat) => !allIn.has(seat));
  const isOnlyOneOrZeroWithChips = notAllInActiveSeats.length <= 1;

  if (!isOnlyOneOrZeroWithChips) {
    return false; // 칩 남은 사람이 2명 이상이면 아직 배팅 가능
  }

  // ✅ 칩이 1명 남았더라도, 그 사람이 현재 걸린 베팅에 대해 콜을 마쳤는지 확인
  const hasPendingAction = activeSeats.some((seat) => {
    const callAmount = betting.callAmountBySeat[seat] ?? 0;
    return callAmount > 0;
  });

  // 모든 액션이 끝났고(callAmount === 0), 칩 남은 사람이 1명 이하라면 쇼다운!
  return !hasPendingAction;
}
