// src/features/hand/engine/reopenBetting.ts
import type { TimelineEvent } from "@/features/hand/domain/events";
import type { HandConfig, SeatIndex } from "@/features/hand/domain/handConfig";
import type { Street } from "./reducer";
import { computeBettingDerived } from "./bettingDerived";

const AGGRESSIVE = new Set(["BET", "RAISE", "ALL_IN"]);

function getStreetBoundaryType(street: Street) {
  if (street === "PREFLOP") return "POST_BLINDS" as const;
  if (street === "FLOP") return "REVEAL_FLOP" as const;
  if (street === "TURN") return "REVEAL_TURN" as const;
  if (street === "RIVER") return "REVEAL_RIVER" as const;
  return null;
}

function getStreetStartIndex(events: TimelineEvent[], street: Street) {
  const boundaryType = getStreetBoundaryType(street);
  if (!boundaryType) return events.length;

  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === boundaryType) return i + 1;
  }
  return 0;
}

function getActedSeatsInRange(
  events: TimelineEvent[],
  from: number,
  toExclusive: number
): Set<SeatIndex> {
  const s = new Set<SeatIndex>();
  for (let i = from; i < toExclusive; i++) {
    const ev = events[i];
    if (ev.type !== "ACTION") continue;
    s.add(ev.payload.seat as SeatIndex);
  }
  return s;
}

/**
 * ✅ “현재 레벨을 올린 마지막 액션이 풀 레이즈였는지”
 * + “short raise라면, 특정 seat이 raise 가능한지” 계산
 */
export function getCanReopenBettingForSeat(params: {
  config: HandConfig;
  street: Street;
  eventsApplied: TimelineEvent[];
  seat: SeatIndex;
}): boolean {
  const { config, street, eventsApplied, seat } = params;

  if (street === "SHOWDOWN") return false;

  const streetStartIndex = getStreetStartIndex(eventsApplied, street);

  // (street 시작 시점) 투자 상태
  const atStart = computeBettingDerived({
    config,
    street,
    eventsApplied: eventsApplied.slice(0, streetStartIndex),
  });

  // ✅ baseRaiseSize:
  // - PREFLOP: big blind가 기준(ante 포함 X)
  // - POSTFLOP: 최소 bet 단위도 bb로 취급(간단 구현)
  const baseRaiseSize = Math.max(1, config.blinds.bb);

  // 추적 변수
  const seats: SeatIndex[] = config.players.map((p) => p.seat);

  const invested: Record<number, number> = {};
  for (const s of seats) invested[s] = atStart.investedBySeat[s] ?? 0;

  let currentMax = atStart.maxInvested;

  // “이전 풀 레이즈 크기”
  let prevFullRaiseSize = baseRaiseSize;

  // 마지막으로 레벨을 올린 aggression
  let lastLevelUpIndex: number | null = null;
  let lastLevelUpWasFull: boolean = true; // 기본 true (없으면 상관없음)

  for (let i = streetStartIndex; i < eventsApplied.length; i++) {
    const ev = eventsApplied[i];
    if (ev.type !== "ACTION") continue;

    const a = ev.payload.action;
    if (!AGGRESSIVE.has(a)) {
      // call/check/fold는 invested 변화가 없거나(네 시스템은 call에도 delta 있음)
      // 여기서는 delta가 있으면 invested 갱신만 해주고, aggression 판단은 안 함
    }

    const delta = ev.payload.amount;
    if (typeof delta !== "number" || delta <= 0) continue;

    const s = ev.payload.seat as SeatIndex;

    const beforeMax = currentMax;

    invested[s] = (invested[s] ?? 0) + delta;
    currentMax = Math.max(currentMax, invested[s]);

    const didLevelUp = currentMax > beforeMax;
    const isAggType = AGGRESSIVE.has(a);

    if (isAggType && didLevelUp) {
      // raise/bet/allin이 “레벨을 올린” 순간
      const raiseSize = currentMax - beforeMax;

      lastLevelUpIndex = i;

      const isFull = raiseSize >= prevFullRaiseSize;

      lastLevelUpWasFull = isFull;

      // 풀 레이즈면 기준이 갱신됨
      if (isFull) {
        prevFullRaiseSize = raiseSize;
      }
    }
  }

  // 레벨을 올린 aggression이 없었다면 reopen 개념 자체가 무의미 → true로 둬도 무방
  if (lastLevelUpIndex === null) return true;

  // 마지막 레벨업이 풀 레이즈면 누구나 reopen 가능
  if (lastLevelUpWasFull) return true;

  // ✅ 마지막 레벨업이 short raise면:
  // 그 “short raise 이전에 이미 행동했던 seat”은 reopen 불가
  const actedBeforeShort = getActedSeatsInRange(
    eventsApplied,
    streetStartIndex,
    lastLevelUpIndex // short raise 직전까지
  );

  return !actedBeforeShort.has(seat);
}
