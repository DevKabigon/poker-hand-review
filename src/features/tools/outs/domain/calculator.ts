import { Card, RANKS, SUITS } from "@/features/hand/domain/cards";
import { comparePlayerHands } from "@/features/tools/outs/domain/evaluator";

export type TrailingPlayerOuts = {
  playerIndex: number;
  outCards: Card[];
};

export type MultiwayNextCardOutsResult = {
  unseenCount: number;
  winningPlayerIndices: number[];
  trailingPlayers: TrailingPlayerOuts[];
};

const FULL_DECK: Card[] = RANKS.flatMap((rank) =>
  SUITS.map((suit) => `${rank}${suit}` as Card),
);

function toCardSet(cards: Card[]): Set<Card> {
  return new Set(cards);
}

export function getUnseenDeck(usedCards: Card[]): Card[] {
  const used = toCardSet(usedCards);
  return FULL_DECK.filter((card) => !used.has(card));
}

function assertNoDuplicateCards(cards: Card[]): void {
  const seen = new Set<Card>();

  for (const card of cards) {
    if (seen.has(card)) {
      throw new Error(`Duplicate card detected: ${card}`);
    }

    seen.add(card);
  }
}

export function calculateNextCardMultiwayOuts(
  playerHands: Card[][],
  boardCards: Card[],
): MultiwayNextCardOutsResult {
  if (playerHands.length < 2) {
    throw new Error("At least 2 players are required.");
  }

  for (const cards of playerHands) {
    if (cards.length !== 2) {
      throw new Error("Every player must have exactly 2 hole cards.");
    }
  }

  if (boardCards.length !== 3 && boardCards.length !== 4) {
    throw new Error("Next-card outs requires a flop(3) or turn(4) board.");
  }

  const allCards = [...playerHands.flat(), ...boardCards];
  assertNoDuplicateCards(allCards);

  const { winningPlayerIndices } = comparePlayerHands(playerHands, boardCards);
  const trailingPlayerIndices = playerHands
    .map((_, index) => index)
    .filter((index) => !winningPlayerIndices.includes(index));
  const unseenDeck = getUnseenDeck(allCards);
  const outCardsByPlayer = new Map<number, Card[]>(
    trailingPlayerIndices.map((index) => [index, []]),
  );

  for (const card of unseenDeck) {
    const nextWinningPlayers = new Set(
      comparePlayerHands(playerHands, [...boardCards, card]).winningPlayerIndices,
    );

    for (const playerIndex of trailingPlayerIndices) {
      if (nextWinningPlayers.has(playerIndex)) {
        outCardsByPlayer.get(playerIndex)?.push(card);
      }
    }
  }

  return {
    unseenCount: unseenDeck.length,
    winningPlayerIndices,
    trailingPlayers: trailingPlayerIndices.map((playerIndex) => ({
      playerIndex,
      outCards: outCardsByPlayer.get(playerIndex) ?? [],
    })),
  };
}
