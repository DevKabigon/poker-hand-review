// // src/features/hand/engine/currentActor.ts
// import type { TimelineEvent } from "@/features/hand/domain/events";
// import type { HandConfig, SeatIndex } from "@/features/hand/domain/handConfig";
// import type { Street } from "./reducer";
// import { computeBettingDerived } from "./bettingDerived";
// import { getNextActor } from "./nextActor";

// type ActorContext = {
//   street: Street;
//   eventsApplied: TimelineEvent[];
//   config: HandConfig;
//   buttonSeat: SeatIndex;
// };

// export function getCurrentActor(ctx: ActorContext): SeatIndex | null {
//   const { street, eventsApplied, config, buttonSeat } = ctx;
//   if (street === "SHOWDOWN") return null;

//   const betting = computeBettingDerived({
//     config,
//     street,
//     eventsApplied,
//   });

//   return getNextActor({
//     street,
//     eventsApplied,
//     config,
//     buttonSeat,
//     betting,
//   });
// }
