// src/features/hand/engine/uncalledRefund.ts
import type { SeatIndex } from "@/features/hand/domain/handConfig";
import type { Pot } from "./pots";

export type UncalledRefundResult = {
  pots: Pot[];
  refundBySeat: Record<number, number>;
  refundedAmountTotal: number;
};

/**
 * roundClosed=false면 refund를 적용하지 않는다.
 * (아직 누군가가 콜/폴드로 대응할 수 있으므로 “uncalled” 확정이 아님)
 */
export function applyUncalledRefund(
  pots: Pot[],
  opts: { roundClosed: boolean }
): UncalledRefundResult {
  if (!opts.roundClosed) {
    return { pots, refundBySeat: {}, refundedAmountTotal: 0 };
  }

  const refundBySeat: Record<number, number> = {};
  let refundedAmountTotal = 0;

  const kept: Pot[] = [];

  for (const p of pots) {
    const eligible = p.eligibleSeatSet ?? [];

    if (eligible.length !== 1) {
      kept.push(p);
      continue;
    }

    const seat = eligible[0] as SeatIndex;
    refundBySeat[seat] = (refundBySeat[seat] ?? 0) + p.amount;
    refundedAmountTotal += p.amount;
  }

  return { pots: kept, refundBySeat, refundedAmountTotal };
}
