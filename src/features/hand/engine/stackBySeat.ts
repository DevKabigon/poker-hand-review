import type { TimelineEvent } from "@/features/hand/domain/events";
import type { HandConfig } from "@/features/hand/domain/handConfig";

/**
 * 남은 스택 = 초기 스택 - (POST_BLINDS + ACTION delta 누적)
 * amount는 eventFactory 주석대로 "delta" 전제.
 */
export function computeStackBySeat(params: {
  config: HandConfig;
  eventsApplied: TimelineEvent[];
}): Record<number, number> {
  const { config, eventsApplied } = params;

  const stackBySeat: Record<number, number> = {};
  for (const p of config.players) {
    stackBySeat[p.seat] = p.stack; // 초기 스택
  }

  for (const ev of eventsApplied) {
    if (ev.type === "POST_BLINDS") {
      for (const [seatStr, amt] of Object.entries(ev.payload.posts)) {
        const seat = Number(seatStr);
        if (!(seat in stackBySeat)) continue;
        if (typeof amt !== "number" || amt <= 0) continue;
        stackBySeat[seat] = Math.max(0, stackBySeat[seat] - amt);
      }
    }

    if (ev.type === "ACTION") {
      const { seat, amount } = ev.payload;
      if (!(seat in stackBySeat)) continue;
      if (typeof amount === "number" && amount > 0) {
        const before = stackBySeat[seat];
        stackBySeat[seat] = Math.max(0, stackBySeat[seat] - amount);
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[computeStackBySeat] seat=${seat}, action=${ev.payload.action}, amount=${amount}, before=${before}, after=${stackBySeat[seat]}`
          );
        }
      }
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[computeStackBySeat] final stackBySeat:`,
      JSON.stringify(stackBySeat)
    );
  }

  return stackBySeat;
}
