// src/features/hand/engine/bettingDerived.ts
import type { TimelineEvent } from "@/features/hand/domain/events";
import type { HandConfig, SeatIndex } from "@/features/hand/domain/handConfig";
import type { Street } from "@/features/hand/engine/reducer";

export type BettingDerived = {
  streetStartIndex: number;

  // ✅ 총 투자(팟/스택 감소용): blinds + ante + actions
  investedBySeat: Record<number, number>;
  maxInvested: number;

  // ✅ 베팅 레벨용(ante 제외): blinds + actions
  investedForBetBySeat: Record<number, number>;
  maxInvestedForBet: number;

  // ✅ call/hasBetToCall은 "베팅 레벨" 기준으로 계산해야 함 (ante 제외)
  callAmountBySeat: Record<number, number>;
  hasBetToCallBySeat: Record<number, boolean>;

  currentTo: number; // ✅ ante 제외 베팅 레벨(to)
  minRaiseTo: number; // ✅ 최소 레이즈 to
  lastRaiseSize: number; // ✅ 직전 유효 레이즈 사이즈
  canReopenBetting: boolean; // ✅ short all-in 발생 시 false
};

function getStreetBoundaryType(street: Street) {
  if (street === "PREFLOP") return "POST_BLINDS" as const;
  if (street === "FLOP") return "REVEAL_FLOP" as const;
  if (street === "TURN") return "REVEAL_TURN" as const;
  if (street === "RIVER") return "REVEAL_RIVER" as const;
  return null;
}

// ✅ 베팅 레벨 베이스(ante 제외)
function getBaseLevel(config: HandConfig, street: Street) {
  return street === "PREFLOP" ? config.blinds.bb : 0;
}

/**
 * POST_BLINDS에서 (totalInvest, betInvest)를 분리한다.
 * - totalInvest: blind+ante 모두 포함 (팟/스택)
 * - betInvest: ante 제외한 "베팅 레벨"용 투자액
 */
function splitPostAmountIntoBetPart(config: HandConfig, amt: number): number {
  const { sb, bb, anteMode, anteAmount } = config.blinds;

  // 기본: ante가 없다면 그대로 bet에 포함
  if (anteMode === "NONE") return amt;

  // ANTE: posts가 (blind + ante)로 들어온다고 가정하면 anteAmount만큼 제외
  if (anteMode === "ANTE") {
    const a = typeof anteAmount === "number" ? anteAmount : 0;
    // e.g. sb(1)+ante(2)=3 => betPart=1
    //      bb(4)+ante(2)=6 => betPart=4
    //      혹시 amt가 sb(1)처럼 ante 포함이 아니면 => max(0, 1-2)=0 (안전)
    return Math.max(0, amt - a);
  }

  // BB_ANTE: BB만 (bb + ante)로 들어오고, SB는 sb만 들어오는 형태를 지원
  if (anteMode === "BB_ANTE") {
    const a = typeof anteAmount === "number" ? anteAmount : 0;

    // 소수점 비교를 위해 작은 오차 허용 (1e-6 = 0.000001)
    const epsilon = 1e-6;

    // ✅ sb는 보통 sb 그대로
    // amt가 sb와 같거나 거의 같으면 sb 반환
    if (Math.abs(amt - sb) < epsilon) {
      return sb;
    }

    // ✅ bb+ante 형태면 betPart는 bb만
    // amt가 bb + ante와 같거나 거의 같으면 bb만 반환
    if (a > 0) {
      const expectedTotal = bb + a;
      if (Math.abs(amt - expectedTotal) < epsilon) {
        return bb;
      }
    }

    // 기타는 안전하게 그대로(혹시 다른 구현체)
    return amt;
  }

  return amt;
}

export function computeBettingDerived(params: {
  config: HandConfig;
  street: Street;
  eventsApplied: TimelineEvent[];
}): BettingDerived {
  const { config, street, eventsApplied } = params;

  const seats: SeatIndex[] = config.players.map((p) => p.seat);

  const investedBySeat: Record<number, number> = {};
  const investedForBetBySeat: Record<number, number> = {};
  for (const seat of seats) {
    investedBySeat[seat] = 0;
    investedForBetBySeat[seat] = 0;
  }

  if (street === "SHOWDOWN") {
    const callAmountBySeat: Record<number, number> = {};
    const hasBetToCallBySeat: Record<number, boolean> = {};
    for (const seat of seats) {
      callAmountBySeat[seat] = 0;
      hasBetToCallBySeat[seat] = false;
    }
    return {
      streetStartIndex: eventsApplied.length,
      investedBySeat,
      maxInvested: 0,

      investedForBetBySeat,
      maxInvestedForBet: 0,

      callAmountBySeat,
      hasBetToCallBySeat,

      currentTo: 0,
      minRaiseTo: 0,
      lastRaiseSize: 0,
      canReopenBetting: true,
    };
  }

  const boundaryType = getStreetBoundaryType(street);

  let streetStartIndex = 0;
  let boundaryIndex: number | null = null;

  if (boundaryType) {
    for (let i = eventsApplied.length - 1; i >= 0; i--) {
      if (eventsApplied[i].type === boundaryType) {
        boundaryIndex = i;
        streetStartIndex = i + 1;
        break;
      }
    }
  }

  // ===========================
  // PREFLOP: POST_BLINDS 반영
  // ===========================
  // ✅ PREFLOP에서는 POST_BLINDS가 eventsApplied[0]에 있어야 함
  // boundaryIndex가 null이어도 eventsApplied[0]이 POST_BLINDS면 처리
  if (street === "PREFLOP") {
    const postBlindsEvent = boundaryIndex !== null 
      ? eventsApplied[boundaryIndex]
      : eventsApplied[0];
    
    if (postBlindsEvent?.type === "POST_BLINDS") {
      const { posts } = postBlindsEvent.payload;

      for (const [seatStr, amt] of Object.entries(posts)) {
        const seat = Number(seatStr);
        if (!(seat in investedBySeat)) continue;
        // 소수점 값도 허용하므로 amt > 0 체크만 (amt <= 0은 제외)
        if (typeof amt !== "number" || Number.isNaN(amt) || !(amt > 0)) continue;

        // ✅ 총 투자(팟/스택)
        investedBySeat[seat] += amt;

        // ✅ 베팅 레벨용(ante 제외)
        const betPart = splitPostAmountIntoBetPart(config, amt);
        // betPart가 0보다 크면 추가 (소수점 값도 허용)
        if (betPart > 0) {
          investedForBetBySeat[seat] += betPart;
        } else {
          // 디버깅: betPart가 0이거나 음수인 경우 로그
          console.warn(
            `[bettingDerived] betPart is ${betPart} for seat ${seat}, amt=${amt}, sb=${config.blinds.sb}, bb=${config.blinds.bb}, anteMode=${config.blinds.anteMode}, anteAmount=${config.blinds.anteAmount}`
          );
        }
      }
    }
  }

  // ===========================
  // 이번 스트릿 ACTION 누적 (액션은 bet-level에 포함)
  // ===========================
  for (let i = streetStartIndex; i < eventsApplied.length; i++) {
    const ev = eventsApplied[i];
    if (ev.type !== "ACTION") continue;

    const { seat, amount } = ev.payload;
    if (amount === undefined) continue;
    if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0)
      continue;
    if (!(seat in investedBySeat)) continue;

    // ✅ 총 투자
    investedBySeat[seat] += amount;

    // ✅ 베팅 레벨용 투자(액션은 그대로 포함)
    investedForBetBySeat[seat] += amount;
  }

  const maxInvested = Math.max(0, ...Object.values(investedBySeat));
  const maxInvestedForBet = Math.max(0, ...Object.values(investedForBetBySeat));

  // ✅ call/hasBetToCall은 "베팅 레벨" 기준 (ante 제외)
  const callAmountBySeat: Record<number, number> = {};
  const hasBetToCallBySeat: Record<number, boolean> = {};
  for (const seat of seats) {
    const callAmount = Math.max(
      0,
      maxInvestedForBet - (investedForBetBySeat[seat] ?? 0)
    );
    callAmountBySeat[seat] = callAmount;
    hasBetToCallBySeat[seat] = callAmount > 0;
  }

  // ===========================
  // ✅ short all-in / reopen 계산
  // ===========================
  const baseLevel = getBaseLevel(config, street);

  // "베팅 레벨(to)" 추적은 baseLevel에서 시작 (ante 제외)
  let levelTo = baseLevel;

  // 직전 "유효 레이즈" 레벨(to) 히스토리
  let prevAggTo = baseLevel;
  let lastAggTo = baseLevel;

  for (let i = streetStartIndex; i < eventsApplied.length; i++) {
    const ev = eventsApplied[i];
    if (ev.type !== "ACTION") continue;

    const delta = ev.payload.amount;
    if (typeof delta !== "number" || Number.isNaN(delta) || delta <= 0)
      continue;

    const seat = ev.payload.seat as SeatIndex;

    const before = levelTo;

    // ✅ bet-level seatTo를 사용해야 함 (ante 제외)
    const seatTo = investedForBetBySeat[seat] ?? 0;
    levelTo = Math.max(levelTo, seatTo);

    const aggressive =
      ev.payload.action === "BET" ||
      ev.payload.action === "RAISE" ||
      ev.payload.action === "ALL_IN";

    // 공격 액션이지만 levelTo가 안 올라가면(콜성 올인 등) 무시
    if (!aggressive || levelTo <= before) continue;

    // 레이즈 사이즈 체크(유효 레이즈인지)
    const raiseSize = levelTo - lastAggTo;

    // "유효 레이즈"는 직전 유효 raise size 이상이어야 함
    // - 첫 공격(오픈)은: PREFLOP=BB, POSTFLOP=이론상 1(여기선 baseLevel==0이면 1로)
    const requiredMinRaise =
      lastAggTo === prevAggTo
        ? street === "PREFLOP"
          ? config.blinds.bb
          : 1
        : lastAggTo - prevAggTo;

    if (raiseSize >= requiredMinRaise) {
      // ✅ 유효 레이즈로 인정 → 히스토리 갱신
      prevAggTo = lastAggTo;
      lastAggTo = levelTo;
    } else {
      // ❗ short all-in: levelTo는 올라갔지만 유효 레이즈는 아님
      // -> reopen을 막아야 하므로, 히스토리 갱신 X
    }
  }

  const lastRaiseSizeRaw = lastAggTo - prevAggTo;
  const lastRaiseSize =
    lastRaiseSizeRaw > 0
      ? lastRaiseSizeRaw
      : street === "PREFLOP"
      ? config.blinds.bb
      : 1;

  const currentTo = Math.max(baseLevel, levelTo);
  const minRaiseTo = currentTo + lastRaiseSize;

  // ✅ canReopenBetting:
  // 현재 레벨(currentTo)까지 만든 마지막 공격이 "유효 레이즈"였는지 판단
  // -> 간단히: (currentTo === lastAggTo)면 유효 레이즈로 도달한 레벨
  // -> currentTo > lastAggTo면 short all-in 등으로 레벨만 올라간 상태 => reopen 불가
  const canReopenBetting = currentTo <= lastAggTo;

  return {
    streetStartIndex,

    investedBySeat,
    maxInvested,

    investedForBetBySeat,
    maxInvestedForBet,

    callAmountBySeat,
    hasBetToCallBySeat,

    currentTo,
    minRaiseTo,
    lastRaiseSize,
    canReopenBetting,
  };
}
