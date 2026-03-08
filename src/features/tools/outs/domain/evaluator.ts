import { Card, Suit } from "@/features/hand/domain/cards";

const RANK_TO_VALUE: Record<string, number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  T: 10,
  "9": 9,
  "8": 8,
  "7": 7,
  "6": 6,
  "5": 5,
  "4": 4,
  "3": 3,
  "2": 2,
};

const SUIT_ORDER: Suit[] = ["s", "h", "d", "c"];

export type HandScore = [number, number, number, number, number, number];
export type HandOutcome = "win" | "tie" | "lose";
export type MultiwayHandResult = {
  scores: HandScore[];
  winningPlayerIndices: number[];
};

type ParsedCard = {
  rank: number;
  suit: Suit;
};

function parseCard(card: Card): ParsedCard {
  const rank = RANK_TO_VALUE[card[0]];
  const suit = card[1] as Suit;
  return { rank, suit };
}

function score(category: number, values: number[]): HandScore {
  return [
    category,
    values[0] ?? 0,
    values[1] ?? 0,
    values[2] ?? 0,
    values[3] ?? 0,
    values[4] ?? 0,
  ];
}

function sortDesc(a: number, b: number) {
  return b - a;
}

function findStraightHigh(ranks: number[]): number {
  const present = Array<boolean>(15).fill(false);
  for (const rank of ranks) {
    present[rank] = true;
  }

  if (present[14]) {
    present[1] = true;
  }

  for (let high = 14; high >= 5; high -= 1) {
    if (
      present[high] &&
      present[high - 1] &&
      present[high - 2] &&
      present[high - 3] &&
      present[high - 4]
    ) {
      return high;
    }
  }

  return 0;
}

export function evaluateBestHand(cards: Card[]): HandScore {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error("evaluateBestHand requires 5 to 7 cards.");
  }

  const rankCount = Array<number>(15).fill(0);
  const suitRanks: Record<Suit, number[]> = {
    s: [],
    h: [],
    d: [],
    c: [],
  };

  for (const card of cards) {
    const { rank, suit } = parseCard(card);
    rankCount[rank] += 1;
    suitRanks[suit].push(rank);
  }

  let flushSuit: Suit | null = null;
  for (const suit of SUIT_ORDER) {
    if (suitRanks[suit].length >= 5) {
      flushSuit = suit;
      break;
    }
  }

  if (flushSuit) {
    const straightFlushHigh = findStraightHigh(suitRanks[flushSuit]);
    if (straightFlushHigh > 0) {
      return score(8, [straightFlushHigh]);
    }
  }

  const trips: number[] = [];
  const pairCandidates: number[] = [];
  let quads = 0;

  for (let rank = 14; rank >= 2; rank -= 1) {
    const count = rankCount[rank];
    if (count === 4) {
      quads = rank;
    }
    if (count >= 3) {
      trips.push(rank);
    }
    if (count >= 2) {
      pairCandidates.push(rank);
    }
  }

  if (quads > 0) {
    let kicker = 0;
    for (let rank = 14; rank >= 2; rank -= 1) {
      if (rank !== quads && rankCount[rank] > 0) {
        kicker = rank;
        break;
      }
    }

    return score(7, [quads, kicker]);
  }

  if (trips.length > 0) {
    const tripRank = trips[0];
    let pairRank = 0;

    for (const candidate of pairCandidates) {
      if (candidate !== tripRank) {
        pairRank = candidate;
        break;
      }
    }

    if (pairRank === 0 && trips.length > 1) {
      pairRank = trips[1];
    }

    if (pairRank > 0) {
      return score(6, [tripRank, pairRank]);
    }
  }

  if (flushSuit) {
    const flushRanks = [...new Set(suitRanks[flushSuit])].sort(sortDesc);
    return score(5, flushRanks.slice(0, 5));
  }

  const distinctRanks: number[] = [];
  for (let rank = 14; rank >= 2; rank -= 1) {
    if (rankCount[rank] > 0) {
      distinctRanks.push(rank);
    }
  }

  const straightHigh = findStraightHigh(distinctRanks);
  if (straightHigh > 0) {
    return score(4, [straightHigh]);
  }

  if (trips.length > 0) {
    const tripRank = trips[0];
    const kickers: number[] = [];

    for (let rank = 14; rank >= 2; rank -= 1) {
      if (rank !== tripRank && rankCount[rank] > 0) {
        kickers.push(rank);
      }
      if (kickers.length === 2) {
        break;
      }
    }

    return score(3, [tripRank, ...kickers]);
  }

  if (pairCandidates.length >= 2) {
    const highPair = pairCandidates[0];
    const lowPair = pairCandidates[1];
    let kicker = 0;

    for (let rank = 14; rank >= 2; rank -= 1) {
      if (rank !== highPair && rank !== lowPair && rankCount[rank] > 0) {
        kicker = rank;
        break;
      }
    }

    return score(2, [highPair, lowPair, kicker]);
  }

  if (pairCandidates.length === 1) {
    const pair = pairCandidates[0];
    const kickers: number[] = [];

    for (let rank = 14; rank >= 2; rank -= 1) {
      if (rank !== pair && rankCount[rank] > 0) {
        kickers.push(rank);
      }
      if (kickers.length === 3) {
        break;
      }
    }

    return score(1, [pair, ...kickers]);
  }

  return score(0, distinctRanks.slice(0, 5));
}

export function compareScores(a: HandScore, b: HandScore): number {
  for (let i = 0; i < 6; i += 1) {
    if (a[i] > b[i]) {
      return 1;
    }
    if (a[i] < b[i]) {
      return -1;
    }
  }

  return 0;
}

export function compareHands(heroCards: Card[], villainCards: Card[], board: Card[]): HandOutcome {
  const heroScore = evaluateBestHand([...heroCards, ...board]);
  const villainScore = evaluateBestHand([...villainCards, ...board]);
  const compared = compareScores(heroScore, villainScore);

  if (compared > 0) {
    return "win";
  }
  if (compared < 0) {
    return "lose";
  }
  return "tie";
}

export function comparePlayerHands(playerHands: Card[][], board: Card[]): MultiwayHandResult {
  if (playerHands.length < 2) {
    throw new Error("comparePlayerHands requires at least 2 players.");
  }

  const scores = playerHands.map((cards) => evaluateBestHand([...cards, ...board]));
  let bestScore = scores[0];
  let winningPlayerIndices = [0];

  for (let index = 1; index < scores.length; index += 1) {
    const compared = compareScores(scores[index], bestScore);

    if (compared > 0) {
      bestScore = scores[index];
      winningPlayerIndices = [index];
      continue;
    }

    if (compared === 0) {
      winningPlayerIndices.push(index);
    }
  }

  return {
    scores,
    winningPlayerIndices,
  };
}
