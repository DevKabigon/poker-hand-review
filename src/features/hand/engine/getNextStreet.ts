import { Street } from "./reducer";

// engine/getNextStreet.ts
export type NextStreet = "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";

export function getNextStreet(street: Street): NextStreet | null {
  switch (street) {
    case "PREFLOP":
      return "FLOP";
    case "FLOP":
      return "TURN";
    case "TURN":
      return "RIVER";
    case "RIVER":
      return "SHOWDOWN";
    case "SHOWDOWN":
      return null;
  }
}
