// src/features/hand/engine/potLabels.ts
import type { Pot } from "./pots";

export type LabeledPot = Pot & { label: string };

export function labelPots(pots: Pot[]): LabeledPot[] {
  return pots.map((p, i) => ({
    ...p,
    label: i === 0 ? "MAIN" : `SIDE ${i}`,
  }));
}
