// src/features/hand/engine/potTotal.ts
import type { TimelineEvent } from "@/features/hand/domain/events";

export function computeTotalPot(eventsApplied: TimelineEvent[]): number {
  let total = 0;

  for (const ev of eventsApplied) {
    if (ev.type === "POST_BLINDS") {
      const posts = ev.payload.posts;
      for (const amt of Object.values(posts)) {
        if (typeof amt === "number" && amt > 0) total += amt;
      }
    }

    if (ev.type === "ACTION") {
      const amt = ev.payload.amount;
      if (typeof amt === "number" && amt > 0) total += amt;
    }
  }

  return total;
}
