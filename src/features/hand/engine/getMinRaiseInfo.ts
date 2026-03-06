// src/features/hand/engine/getMinRaiseInfo.ts
import type { TimelineEvent } from "@/features/hand/domain/events";
import type { HandConfig, SeatIndex } from "@/features/hand/domain/handConfig";
import type { Street } from "./reducer";
import { computeBettingDerived } from "./bettingDerived";

export function getMinRaiseInfo(params: {
  config: HandConfig;
  street: Street;
  eventsApplied: TimelineEvent[];
}) {
  const { config, street, eventsApplied } = params;

  // 현재 시점 betting(콜액 등은 여기서 계속 사용 가능)
  const betting = computeBettingDerived({ config, street, eventsApplied });
  const { streetStartIndex } = betting;

  const seats: SeatIndex[] = config.players.map((p) => p.seat);

  // 스트릿 시작 시점 invested (PREFLOP은 blind/ante 포함될 수 있음)
  const atStart = computeBettingDerived({
    config,
    street,
    eventsApplied: eventsApplied.slice(0, streetStartIndex),
  });

  const invested: Record<number, number> = {};
  for (const s of seats) invested[s] = atStart.investedBySeat[s] ?? 0;

  /**
   * ✅ 핵심 수정:
   * - ante는 betting level을 만들지 않는다
   * - PREFLOP의 base betting level은 항상 BB
   * - POSTFLOP의 base betting level은 0
   *
   * ※ 이 baseLevel은 "베팅 레벨(to)" 계산 전용.
   *   investedBySeat(팟 기여)와는 개념이 다르다.
   */
  const baseLevel = street === "PREFLOP" ? config.blinds.bb : 0;

  // 공격(베팅 레벨 상승) 히스토리로 min-raise size 계산
  let currentMax = baseLevel;
  let prevAggTo = baseLevel;
  let lastAggTo = baseLevel;

  // 스트릿 내 ACTION들만 스캔해서 "베팅 레벨(to)" 변화를 추적한다.
  // 여기서는 ante/블라인드 투자액(invested)을 그대로 두고,
  // 베팅 레벨은 baseLevel에서 시작해서 "실제 상승"이 있을 때만 갱신한다.
  for (let i = streetStartIndex; i < eventsApplied.length; i++) {
    const ev = eventsApplied[i];
    if (ev.type !== "ACTION") continue;

    const delta = ev.payload.amount;
    if (typeof delta !== "number" || Number.isNaN(delta) || delta <= 0)
      continue;

    const seat = ev.payload.seat as SeatIndex;

    // 해당 좌석의 총 투자액(to) 갱신 (ante 포함)
    invested[seat] = (invested[seat] ?? 0) + delta;

    const beforeMax = currentMax;

    // ✅ 베팅 레벨(to)는 "투자액 중 최대"로 정의하지만,
    //    시작값은 반드시 baseLevel(=BB or 0)로 둔다.
    currentMax = Math.max(currentMax, invested[seat]);

    const aggressive =
      ev.payload.action === "BET" ||
      ev.payload.action === "RAISE" ||
      ev.payload.action === "ALL_IN";

    // "공격"이라도 베팅 레벨이 실제로 올라가지 않으면(짧은 올인 등) 레이즈로 보지 않음
    if (aggressive && currentMax > beforeMax) {
      prevAggTo = lastAggTo;
      lastAggTo = currentMax;
    }
  }

  // 직전 레이즈 사이즈
  let lastRaiseSize = lastAggTo - prevAggTo;

  // 레이즈가 아직 없으면:
  // - PREFLOP: 최소 레이즈 단위는 BB
  // - POSTFLOP: 최소 베팅 단위(여기서는 1로 방어, 나중에 설정 가능)
  if (lastRaiseSize <= 0) {
    lastRaiseSize = street === "PREFLOP" ? config.blinds.bb : 1;
  }

  // ✅ 현재 베팅 레벨(to)도 ante 제외 기준으로 만들어야 함
  // -> betting.maxInvested는 ante 포함될 수 있으니 사용 금지
  const currentTo = Math.max(baseLevel, currentMax);

  const minRaiseTo = currentTo + lastRaiseSize;

  return {
    currentTo,
    minRaiseTo,
    lastRaiseSize,
    streetStartIndex,
    investedBySeat: betting.investedBySeat, // 팟/콜 계산용은 기존 그대로 노출
  };
}
