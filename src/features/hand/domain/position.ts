export type Position =
  | "SB"
  | "BB"
  | "BTN"
  | "UTG"
  | "UTG+1"
  | "UTG+2"
  | "UTG+3"
  | "HJ"
  | "LJ"
  | "CO";

export const POSITION_MAP: Record<number, Position[]> = {
  2: ["SB", "BB"],
  3: ["BTN", "SB", "BB"],
  4: ["BTN", "SB", "BB", "UTG"],
  5: ["BTN", "SB", "BB", "UTG", "CO"],
  6: ["BTN", "SB", "BB", "UTG", "HJ", "CO"],
  7: ["BTN", "SB", "BB", "UTG", "LJ", "HJ", "CO"],
  8: ["BTN", "SB", "BB", "UTG", "UTG+1", "LJ", "HJ", "CO"],
  9: ["BTN", "SB", "BB", "UTG", "UTG+1", "UTG+2", "LJ", "HJ", "CO"],
  10: ["BTN", "SB", "BB", "UTG", "UTG+1", "UTG+2", "UTG+3", "LJ", "HJ", "CO"],
};

export function getPositionLabels(
  numPlayers: number,
  buttonSeat: number
): Record<number, string> {
  const labels = POSITION_MAP[numPlayers];
  if (!labels) return {};

  const positions: Record<number, string> = {};

  // 버튼 좌석부터 시계방향으로 라벨을 하나씩 할당
  for (let i = 0; i < numPlayers; i++) {
    const seatIndex = (buttonSeat + i) % numPlayers;
    positions[seatIndex] = labels[i];
  }

  return positions;
}
