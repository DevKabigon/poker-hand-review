// src/features/hand/engine/pots.ts
import type { TimelineEvent } from "@/features/hand/domain/events";
import type { HandConfig, SeatIndex } from "@/features/hand/domain/handConfig";

export type Pot = {
  amount: number;
  eligibleSeatSet: SeatIndex[];
};

function normalizeSeatSet(seats: SeatIndex[]) {
  return [...seats].sort((a, b) => a - b);
}

function hasSameEligibleSeats(a: SeatIndex[], b: SeatIndex[]) {
  if (a.length !== b.length) return false;
  const aa = normalizeSeatSet(a);
  const bb = normalizeSeatSet(b);
  for (let i = 0; i < aa.length; i++) {
    if (aa[i] !== bb[i]) return false;
  }
  return true;
}

function hasAllIn(eventsApplied: TimelineEvent[]) {
  return eventsApplied.some(
    (ev) => ev.type === "ACTION" && ev.payload.action === "ALL_IN"
  );
}

export function computePots(params: {
  config: HandConfig;
  eventsApplied: TimelineEvent[];
}): {
  investedBySeat: Record<number, number>;
  foldedSeatSet: Set<number>;
  pots: Pot[];
} {
  const { config, eventsApplied } = params;

  const seats = config.players.map((p) => p.seat);
  const investedBySeat: Record<number, number> = {};
  for (const s of seats) investedBySeat[s] = 0;

  const foldedSeatSet = new Set<number>();

  // 1) 전체 핸드 투자액 누적 + fold 추적
  for (const ev of eventsApplied) {
    if (ev.type === "POST_BLINDS") {
      const { posts } = ev.payload;
      for (const [seatStr, amt] of Object.entries(posts)) {
        const seat = Number(seatStr);
        if (!(seat in investedBySeat)) continue;
        if (typeof amt !== "number" || amt <= 0) continue;
        investedBySeat[seat] += amt;
      }
    }

    if (ev.type === "ACTION") {
      const { seat, action, amount } = ev.payload;

      if (action === "FOLD") foldedSeatSet.add(seat);

      if (typeof amount === "number" && amount > 0) {
        if (!(seat in investedBySeat)) continue;
        investedBySeat[seat] += amount;
      }
    }
  }

  const total = Object.values(investedBySeat).reduce((a, b) => a + (b ?? 0), 0);
  const eligibleAll = config.players
    .map((p) => p.seat)
    .filter((s) => !foldedSeatSet.has(s));

  // ✅ 올인이 없으면: 진행 UI에서는 “메인팟 하나”로만 보여준다
  if (!hasAllIn(eventsApplied)) {
    return {
      investedBySeat,
      foldedSeatSet,
      pots: total > 0 ? [{ amount: total, eligibleSeatSet: eligibleAll }] : [],
    };
  }

  // 2) 레벨 분해로 Pot[] 생성 (메인팟/사이드팟은 Pot[]의 첫/둘째…일 뿐)
  const contributors = seats.filter((s) => (investedBySeat[s] ?? 0) > 0);

  const levels = Array.from(
    new Set(contributors.map((s) => investedBySeat[s] ?? 0))
  )
    .filter((n) => n > 0)
    .sort((a, b) => a - b);

  const pots: Pot[] = [];
  let prev = 0;

  for (const level of levels) {
    const delta = level - prev;
    if (delta <= 0) continue;

    const inThisPot = contributors.filter(
      (s) => (investedBySeat[s] ?? 0) >= level
    );
    const amount = inThisPot.length * delta;

    const eligibleSeatSet = inThisPot.filter((s) => !foldedSeatSet.has(s));

    pots.push({ amount, eligibleSeatSet });
    prev = level;
  }

  // ✅ 동일 eligible(승자 자격) 팟은 하나로 병합
  // heads-up에서 dead money가 섞인 all-in 상황에서도
  // 의미 없는 side pot 분할(Main/Side1/Side2...)이 과도하게 생기지 않게 한다.
  const mergedPots: Pot[] = [];
  for (const pot of pots) {
    if (pot.amount <= 0) continue;
    const last = mergedPots[mergedPots.length - 1];
    if (
      last &&
      hasSameEligibleSeats(last.eligibleSeatSet, pot.eligibleSeatSet)
    ) {
      last.amount += pot.amount;
      continue;
    }
    mergedPots.push({
      amount: pot.amount,
      eligibleSeatSet: normalizeSeatSet(pot.eligibleSeatSet),
    });
  }

  return { investedBySeat, foldedSeatSet, pots: mergedPots };
}
