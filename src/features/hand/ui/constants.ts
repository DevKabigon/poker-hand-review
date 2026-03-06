// src/features/hand/ui/constants.ts

import { Rank, Suit } from "../domain/cards";

export const CARD_SUITS_MAP: Record<Suit, string> = {
  s: "spades",
  h: "hearts",
  d: "diamonds",
  c: "clubs",
} as const;

export const CARD_RANKS_MAP: Record<Rank, string> = {
  A: "ace",
  K: "king",
  Q: "queen",
  J: "jack",
  T: "10",
  "9": "09",
  "8": "08",
  "7": "07",
  "6": "06",
  "5": "05",
  "4": "04",
  "3": "03",
  "2": "02",
} as const;

export const CHIP_VALUES = [
  { value: 5000, src: "/chips/chips5000.png" },
  { value: 1000, src: "/chips/chips1000.png" },
  { value: 500, src: "/chips/chips500.png" },
  { value: 100, src: "/chips/chips100.png" },
  { value: 25, src: "/chips/chips25.png" },
  { value: 10, src: "/chips/chips10.png" },
  { value: 5, src: "/chips/chips5.png" },
  { value: 1, src: "/chips/chips1.png" },
] as const;

export const MAX_CHIPS_PER_STACK = 5;
