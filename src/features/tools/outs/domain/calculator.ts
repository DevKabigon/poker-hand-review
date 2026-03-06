import { Card, RANKS, SUITS } from "@/features/hand/domain/cards";
import { compareHands, HandOutcome } from "@/features/tools/outs/domain/evaluator";

type OutcomeSummary = {
  win: number;
  tie: number;
  lose: number;
  total: number;
  winProbability: number;
  tieProbability: number;
  loseProbability: number;
};

export type NextCardOutsResult = {
  unseenCount: number;
  winOutCards: Card[];
  tieOutCards: Card[];
  loseCards: Card[];
  winProbability: number;
  tieProbability: number;
  nonLoseProbability: number;
};

export type ByRiverExactResult = OutcomeSummary & {
  effectiveWinOuts: number;
  effectiveTieOuts: number;
  effectiveTotalOuts: number;
};

export type ExactShowdownResult = OutcomeSummary;

const FULL_DECK: Card[] = RANKS.flatMap((rank) =>
  SUITS.map((suit) => `${rank}${suit}` as Card),
);

function toOutcomeSummary(win: number, tie: number, lose: number): OutcomeSummary {
  const total = win + tie + lose;

  if (total === 0) {
    return {
      win,
      tie,
      lose,
      total,
      winProbability: 0,
      tieProbability: 0,
      loseProbability: 0,
    };
  }

  return {
    win,
    tie,
    lose,
    total,
    winProbability: win / total,
    tieProbability: tie / total,
    loseProbability: lose / total,
  };
}

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

function tallyOutcome(outcome: HandOutcome, counts: { win: number; tie: number; lose: number }) {
  if (outcome === "win") {
    counts.win += 1;
    return;
  }
  if (outcome === "tie") {
    counts.tie += 1;
    return;
  }
  counts.lose += 1;
}

export function calculateNextCardOuts(
  heroCards: Card[],
  villainCards: Card[],
  boardCards: Card[],
): NextCardOutsResult {
  const allCards = [...heroCards, ...villainCards, ...boardCards];
  assertNoDuplicateCards(allCards);

  if (heroCards.length !== 2 || villainCards.length !== 2) {
    throw new Error("Hero and villain cards must each contain exactly 2 cards.");
  }

  if (boardCards.length !== 3 && boardCards.length !== 4) {
    throw new Error("Next-card outs requires flop(3) or turn(4) board.");
  }

  const unseen = getUnseenDeck(allCards);
  const winOutCards: Card[] = [];
  const tieOutCards: Card[] = [];
  const loseCards: Card[] = [];

  for (const card of unseen) {
    const outcome = compareHands(heroCards, villainCards, [...boardCards, card]);
    if (outcome === "win") {
      winOutCards.push(card);
      continue;
    }
    if (outcome === "tie") {
      tieOutCards.push(card);
      continue;
    }
    loseCards.push(card);
  }

  const unseenCount = unseen.length;
  const winProbability = winOutCards.length / unseenCount;
  const tieProbability = tieOutCards.length / unseenCount;

  return {
    unseenCount,
    winOutCards,
    tieOutCards,
    loseCards,
    winProbability,
    tieProbability,
    nonLoseProbability: winProbability + tieProbability,
  };
}

export function calculateByRiverFromFlopExact(
  heroCards: Card[],
  villainCards: Card[],
  flopCards: Card[],
): ByRiverExactResult {
  const allCards = [...heroCards, ...villainCards, ...flopCards];
  assertNoDuplicateCards(allCards);

  if (heroCards.length !== 2 || villainCards.length !== 2) {
    throw new Error("Hero and villain cards must each contain exactly 2 cards.");
  }
  if (flopCards.length !== 3) {
    throw new Error("Flop must contain exactly 3 cards.");
  }

  const unseen = getUnseenDeck(allCards);
  const counts = { win: 0, tie: 0, lose: 0 };

  for (let i = 0; i < unseen.length - 1; i += 1) {
    for (let j = i + 1; j < unseen.length; j += 1) {
      const outcome = compareHands(heroCards, villainCards, [
        ...flopCards,
        unseen[i],
        unseen[j],
      ]);
      tallyOutcome(outcome, counts);
    }
  }

  const summary = toOutcomeSummary(counts.win, counts.tie, counts.lose);
  const unseenCount = unseen.length;

  return {
    ...summary,
    effectiveWinOuts: summary.winProbability * unseenCount,
    effectiveTieOuts: summary.tieProbability * unseenCount,
    effectiveTotalOuts: (summary.winProbability + summary.tieProbability) * unseenCount,
  };
}

export function calculateExactShowdownFromCurrentBoard(
  heroCards: Card[],
  villainCards: Card[],
  boardCards: Card[],
): ExactShowdownResult {
  const allCards = [...heroCards, ...villainCards, ...boardCards];
  assertNoDuplicateCards(allCards);

  if (heroCards.length !== 2 || villainCards.length !== 2) {
    throw new Error("Hero and villain cards must each contain exactly 2 cards.");
  }
  if (boardCards.length > 5) {
    throw new Error("Board cannot contain more than 5 cards.");
  }

  const cardsToDraw = 5 - boardCards.length;
  const unseen = getUnseenDeck(allCards);
  const counts = { win: 0, tie: 0, lose: 0 };

  if (cardsToDraw === 0) {
    tallyOutcome(compareHands(heroCards, villainCards, boardCards), counts);
    return toOutcomeSummary(counts.win, counts.tie, counts.lose);
  }

  if (cardsToDraw === 1) {
    for (let i = 0; i < unseen.length; i += 1) {
      const outcome = compareHands(heroCards, villainCards, [...boardCards, unseen[i]]);
      tallyOutcome(outcome, counts);
    }
    return toOutcomeSummary(counts.win, counts.tie, counts.lose);
  }

  if (cardsToDraw === 2) {
    for (let i = 0; i < unseen.length - 1; i += 1) {
      for (let j = i + 1; j < unseen.length; j += 1) {
        const outcome = compareHands(heroCards, villainCards, [
          ...boardCards,
          unseen[i],
          unseen[j],
        ]);
        tallyOutcome(outcome, counts);
      }
    }
    return toOutcomeSummary(counts.win, counts.tie, counts.lose);
  }

  if (cardsToDraw === 3) {
    for (let i = 0; i < unseen.length - 2; i += 1) {
      for (let j = i + 1; j < unseen.length - 1; j += 1) {
        for (let k = j + 1; k < unseen.length; k += 1) {
          const outcome = compareHands(heroCards, villainCards, [
            ...boardCards,
            unseen[i],
            unseen[j],
            unseen[k],
          ]);
          tallyOutcome(outcome, counts);
        }
      }
    }
    return toOutcomeSummary(counts.win, counts.tie, counts.lose);
  }

  if (cardsToDraw === 4) {
    for (let i = 0; i < unseen.length - 3; i += 1) {
      for (let j = i + 1; j < unseen.length - 2; j += 1) {
        for (let k = j + 1; k < unseen.length - 1; k += 1) {
          for (let l = k + 1; l < unseen.length; l += 1) {
            const outcome = compareHands(heroCards, villainCards, [
              ...boardCards,
              unseen[i],
              unseen[j],
              unseen[k],
              unseen[l],
            ]);
            tallyOutcome(outcome, counts);
          }
        }
      }
    }
    return toOutcomeSummary(counts.win, counts.tie, counts.lose);
  }

  for (let i = 0; i < unseen.length - 4; i += 1) {
    for (let j = i + 1; j < unseen.length - 3; j += 1) {
      for (let k = j + 1; k < unseen.length - 2; k += 1) {
        for (let l = k + 1; l < unseen.length - 1; l += 1) {
          for (let m = l + 1; m < unseen.length; m += 1) {
            const outcome = compareHands(heroCards, villainCards, [
              ...boardCards,
              unseen[i],
              unseen[j],
              unseen[k],
              unseen[l],
              unseen[m],
            ]);
            tallyOutcome(outcome, counts);
          }
        }
      }
    }
  }

  return toOutcomeSummary(counts.win, counts.tie, counts.lose);
}

