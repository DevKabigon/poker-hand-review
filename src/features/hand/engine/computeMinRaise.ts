import { TimelineEvent } from "../domain/events";
import { HandConfig, SeatIndex } from "../domain/handConfig";
import { computeBettingDerived } from "./bettingDerived";
import { Street } from "./reducer";

export function computeMinRaiseToForStreet(params: {
  config: HandConfig;
  street: Street;
  eventsApplied: TimelineEvent[];
  streetStartIndex: number;
}) {
  const { config, street, eventsApplied, streetStartIndex } = params;

  // 스트릿 시작 시점의 베팅 레벨(프리플랍이면 블라인드 포함)
  const atStart = computeBettingDerived({
    config,
    street,
    eventsApplied: eventsApplied.slice(0, streetStartIndex),
  });

  const seats: SeatIndex[] = config.players.map((p) => p.seat);

  // invested 상태를 스트릿 시작 상태로 초기화
  const invested: Record<number, number> = {};
  for (const s of seats) invested[s] = atStart.investedBySeat[s] ?? 0;

  let currentMax = atStart.maxInvested;

  // lastAggTo / prevAggTo: 공격(베팅 레벨 상승)이 발생한 시점의 "to"
  // 초기값은 스트릿 시작 레벨
  let prevAggTo = currentMax;
  let lastAggTo = currentMax;

  for (let i = streetStartIndex; i < eventsApplied.length; i++) {
    const ev = eventsApplied[i];
    if (ev.type !== "ACTION") continue;

    const s = ev.payload.seat as SeatIndex;
    const delta = ev.payload.amount;

    if (typeof delta !== "number" || Number.isNaN(delta) || delta <= 0) {
      // FOLD/CHECK 같은 non-amount 액션은 무시
      continue;
    }

    const beforeMax = currentMax;

    invested[s] = (invested[s] ?? 0) + delta;
    currentMax = Math.max(currentMax, invested[s] ?? 0);

    const isAggressive =
      ev.payload.action === "BET" ||
      ev.payload.action === "RAISE" ||
      ev.payload.action === "ALL_IN";

    // "공격"이라도 베팅 레벨이 실제로 올라가지 않으면(짧은 올인/콜성 올인) 레이즈로 보지 않음
    if (isAggressive && currentMax > beforeMax) {
      prevAggTo = lastAggTo;
      lastAggTo = currentMax;
    }
  }

  // 직전 레이즈 사이즈
  let lastRaiseSize = lastAggTo - prevAggTo;

  // 레이즈가 아직 없거나(=0), 이상 케이스 방어
  // - 프리플랍 오픈 레이즈의 최소 단위는 "현재 레벨(보통 BB)"로 잡는 게 자연스러움
  if (lastRaiseSize <= 0) lastRaiseSize = Math.max(1, atStart.maxInvested);

  // 현재 레벨은 "지금까지 적용된 이벤트" 기준의 maxInvested
  const current = computeBettingDerived({
    config,
    street,
    eventsApplied,
  }).maxInvested;

  return {
    currentTo: current,
    minRaiseTo: current + lastRaiseSize,
    lastRaiseSize,
  };
}
