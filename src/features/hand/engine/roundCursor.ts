// src/features/hand/engine/roundCursor.ts
import type { ActionType, TimelineEvent } from "@/features/hand/domain/events";
import type { HandConfig, SeatIndex } from "@/features/hand/domain/handConfig";
import type { Street } from "./reducer";
import { computeBettingDerived } from "./bettingDerived";

function toSeatIndex(v: unknown): SeatIndex {
  // "1" -> 1, 1 -> 1
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid seat: ${String(v)}`);
  return n as SeatIndex;
}

export function getStreetBoundaryType(street: Street) {
  if (street === "PREFLOP") return "POST_BLINDS" as const;
  if (street === "FLOP") return "REVEAL_FLOP" as const;
  if (street === "TURN") return "REVEAL_TURN" as const;
  if (street === "RIVER") return "REVEAL_RIVER" as const;
  return null;
}

export function getStreetStartIndex(events: TimelineEvent[], street: Street) {
  const boundaryType = getStreetBoundaryType(street);
  if (!boundaryType) return events.length;

  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === boundaryType) return i + 1;
  }
  return 0;
}

export function getStatusSets(
  events: TimelineEvent[],
  config?: HandConfig
): { folded: Set<SeatIndex>; allIn: Set<SeatIndex> } {
  const folded = new Set<SeatIndex>();
  const allIn = new Set<SeatIndex>();

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[getStatusSets] processing ${events.length} events, config=${
        config ? "provided" : "not provided"
      }`
    );
  }

  // ✅ config가 제공되면 스택을 추적하여 CALL 액션 후 스택이 0인지 확인
  let stackBySeat: Record<number, number> | null = null;
  if (config) {
    // 초기 스택 설정
    stackBySeat = {};
    for (const p of config.players) {
      stackBySeat[p.seat] = p.stack;
    }
  }

  // ✅ 이벤트를 순차적으로 처리: POST_BLINDS를 먼저 처리하고, 그 다음 ACTION들을 처리
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];

    // ✅ POST_BLINDS를 먼저 처리 (스택 계산을 위해)
    if (ev.type === "POST_BLINDS" && config && stackBySeat) {
      for (const [seatStr, amt] of Object.entries(ev.payload.posts)) {
        const seat = Number(seatStr);
        if (!(seat in stackBySeat)) continue;
        if (typeof amt !== "number" || amt <= 0) continue;
        stackBySeat[seat] = Math.max(0, stackBySeat[seat] - amt);
      }
      continue; // POST_BLINDS는 folded/allIn에 영향 없음
    }

    // ✅ ACTION 이벤트 처리
    if (ev.type !== "ACTION") continue;

    const seat = toSeatIndex(ev.payload.seat);

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[getStatusSets] processing ACTION: seat=${seat}, action=${ev.payload.action}, amount=${ev.payload.amount}`
      );
    }

    if (ev.payload.action === "FOLD") {
      folded.add(seat);
    }

    // ✅ ALL_IN 액션은 무조건 올인
    if (ev.payload.action === "ALL_IN") {
      allIn.add(seat);
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[getStatusSets] seat=${seat} added to allIn set, action=${ev.payload.action}, amount=${ev.payload.amount}`
        );
      }
    }

    // ✅ CALL 액션: 남은 스택이 amount(toCall)와 같거나 작으면 올인 콜
    if (ev.payload.action === "CALL" && config && stackBySeat) {
      const amount = ev.payload.amount;
      if (typeof amount === "number" && amount > 0) {
        const beforeStack = stackBySeat[seat] ?? 0;

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[getStatusSets] CALL: seat=${seat}, amount=${amount}, beforeStack=${beforeStack}`
          );
        }

        // ✅ 올인 콜: 남은 스택이 콜 금액과 같거나 작으면 올인
        // amount는 그 시점의 toCall이므로, beforeStack <= amount면 올인 콜
        if (beforeStack <= amount) {
          allIn.add(seat);
          if (process.env.NODE_ENV === "development") {
            console.log(
              `[getStatusSets] seat=${seat} added to allIn set (all-in call: stack=${beforeStack} <= callAmount=${amount})`
            );
          }
        }

        // 스택 업데이트 (다음 액션을 위해)
        stackBySeat[seat] = Math.max(0, beforeStack - amount);
      }
    }

    // ✅ 다른 ACTION 액션들도 스택 추적에 반영 (BET, RAISE, ALL_IN 등)
    if (
      config &&
      stackBySeat &&
      ev.payload.action !== "CALL" &&
      ev.payload.action !== "FOLD"
    ) {
      const amount = ev.payload.amount;
      if (typeof amount === "number" && amount > 0) {
        stackBySeat[seat] = Math.max(0, (stackBySeat[seat] ?? 0) - amount);
      }
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[getStatusSets] final allIn=[${Array.from(allIn).join(
        ", "
      )}], folded=[${Array.from(folded).join(", ")}]`
    );
  }

  return { folded, allIn };
}

export function getLastActionSeatThisStreet(
  events: TimelineEvent[],
  street: Street
): SeatIndex | null {
  const start = getStreetStartIndex(events, street);

  for (let i = events.length - 1; i >= start; i--) {
    const ev = events[i];
    if (ev.type === "ACTION") return toSeatIndex(ev.payload.seat);
  }
  return null;
}

const AGGRESSIVE: ActionType[] = ["BET", "RAISE", "ALL_IN"];

export function getLastAggressionIndexThisStreet_LevelIncrease(params: {
  config: HandConfig;
  street: Street;
  eventsApplied: TimelineEvent[];
}): number | null {
  const { config, street, eventsApplied } = params;

  const betting = computeBettingDerived({ config, street, eventsApplied });
  const { streetStartIndex } = betting;

  const seats: SeatIndex[] = config.players.map((p) => p.seat);

  // street 시작 시점 invested/max
  const atStart = computeBettingDerived({
    config,
    street,
    eventsApplied: eventsApplied.slice(0, streetStartIndex),
  });

  const invested: Record<number, number> = {};
  for (const s of seats) invested[s] = atStart.investedBySeat[s] ?? 0;

  let currentMax = atStart.maxInvested;
  let lastAggIdx: number | null = null;

  for (let i = streetStartIndex; i < eventsApplied.length; i++) {
    const ev = eventsApplied[i];
    if (ev.type !== "ACTION") continue;

    const seat = ev.payload.seat as SeatIndex;
    const delta = ev.payload.amount;
    if (typeof delta !== "number" || delta <= 0) continue;

    const beforeMax = currentMax;

    invested[seat] = (invested[seat] ?? 0) + delta;
    currentMax = Math.max(currentMax, invested[seat]);

    const isAggType = AGGRESSIVE.includes(ev.payload.action);

    // ✅ 핵심: "타입"이 공격이어도 레벨이 안 올라가면 aggression 아님
    if (isAggType && currentMax > beforeMax) {
      lastAggIdx = i;
    }
  }

  return lastAggIdx;
}

export function getLastAggressionIndexThisStreet(
  events: TimelineEvent[],
  street: Street
): number | null {
  const start = getStreetStartIndex(events, street);
  for (let i = events.length - 1; i >= start; i--) {
    const ev = events[i];
    if (ev.type !== "ACTION") continue;
    if (AGGRESSIVE.includes(ev.payload.action)) return i;
  }
  return null;
}

export function getActedSeatsSinceIndex(
  events: TimelineEvent[],
  startIndex: number
): Set<SeatIndex> {
  const acted = new Set<SeatIndex>();
  for (let i = startIndex; i < events.length; i++) {
    const ev = events[i];
    if (ev.type === "ACTION") acted.add(toSeatIndex(ev.payload.seat));
  }
  return acted;
}

export function getActedSeatsThisStreet(
  events: TimelineEvent[],
  street: Street
): Set<SeatIndex> {
  const start = getStreetStartIndex(events, street);
  return getActedSeatsSinceIndex(events, start);
}
