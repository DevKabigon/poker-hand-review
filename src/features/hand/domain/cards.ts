// src/features/hand/domain/cards.ts

export const SUITS = ["s", "h", "d", "c"] as const;

export const RANKS = [
  "A",
  "K",
  "Q",
  "J",
  "T",
  "9",
  "8",
  "7",
  "6",
  "5",
  "4",
  "3",
  "2",
] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];
export type Card = `${Rank}${Suit}`;
