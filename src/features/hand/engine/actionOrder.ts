// src/features/hand/engine/actionOrder.ts
import type { HandConfig, SeatIndex } from "@/features/hand/domain/handConfig";
import type { Street } from "@/features/hand/engine/reducer";
import { computeBlindSeats } from "@/features/hand/domain/postBlinds";

function rotateSeats(seats: SeatIndex[], startSeat: SeatIndex): SeatIndex[] {
  const idx = seats.indexOf(startSeat);
  if (idx === -1) return seats;
  return [...seats.slice(idx), ...seats.slice(0, idx)];
}

function orderedSeats(config: HandConfig): SeatIndex[] {
  // postBlinds.ts도 정렬해서 계산하니까 여기도 정렬로 통일
  return [...config.players.map((p) => p.seat)].sort((a, b) => a - b);
}

export function getActionOrderForStreet(
  street: Street,
  config: HandConfig,
  buttonSeat: SeatIndex
): SeatIndex[] {
  const seats = orderedSeats(config);
  if (street === "SHOWDOWN") return [];

  const { sbSeat, bbSeat } = computeBlindSeats(seats, buttonSeat);

  if (street === "PREFLOP") {
    // UTG = BB 다음
    const bbIdx = seats.indexOf(bbSeat);
    const utgSeat = seats[(bbIdx + 1) % seats.length];
    return rotateSeats(seats, utgSeat);
  }

  // FLOP/TURN/RIVER
  if (seats.length === 2) {
    // ✅ 헤즈업 포스트플랍: 버튼이 아닌 사람(BB 위치)이 먼저 액션합니다.
    // 현재 코드의 rotateSeats(seats, buttonSeat)는 버튼이 먼저하게 됩니다.
    // 따라서 BB 위치인 bbSeat부터 시작하도록 수정합니다.
    return rotateSeats(seats, bbSeat);
  }

  // multiway: SB first actor postflop
  return rotateSeats(seats, sbSeat);
}
