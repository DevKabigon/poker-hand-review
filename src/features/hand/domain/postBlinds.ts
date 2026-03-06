// src/features/hand/domain/postBlinds.ts

import type { HandConfig, SeatIndex } from "./handConfig";
import { validateHandConfig } from "./handConfig";

/**
 * 포스트 블라인드 계산 결과
 * - eventFactory.postBlinds(posts)에 그대로 넣을 수 있는 형태
 */
export type PostBlindsPosts = Record<number, number>;

/**
 * HandConfig와 버튼(딜러) 좌석을 기반으로
 * SB/BB/Ante(BB Ante 포함) 포스팅 금액을 계산한다.
 *
 * 설계 의도:
 * - “포스트 블라인드”는 이벤트이므로, 이벤트 payload(posts)를 자동 산출하기 위한 순수 함수가 필요하다.
 * - 이 함수는 오직 "설정값 → 결과(posts)"만 만든다. 상태 변경/저장은 하지 않는다.
 *
 * 주의(현재 MVP 스펙):
 * - 모든 플레이어가 핸드에 참여(active)한다고 가정한다.
 * TODO : - 스택이 0인 플레이어, sit-out, dead blind 등 복잡한 상황은 이후 확장 포인트.
 */
export function computePostBlindsPosts(
  config: HandConfig,
  buttonSeat: SeatIndex
): PostBlindsPosts {
  validateHandConfig(config);

  // ✅ stack > 0 인 플레이어만 "active"로 취급
  const activePlayers = config.players.filter((p) => p.stack > 0);
  const seats = activePlayers.map((p) => p.seat);

  // ✅ 최소 2명은 있어야 핸드 시작 가능
  if (seats.length < 2) {
    throw new Error("at least 2 players with stack > 0 are required");
  }

  // 버튼 좌석 유효성 체크 (현재 참여자 중 한 명이어야 한다)
  if (!seats.includes(buttonSeat)) {
    throw new Error("buttonSeat must be one of the player seats");
  }

  // SB/BB 좌석 계산
  const { sbSeat, bbSeat } = computeBlindSeats(seats, buttonSeat);

  const posts: PostBlindsPosts = {};

  // SB/BB 포스팅
  addPost(posts, sbSeat, config.blinds.sb);
  addPost(posts, bbSeat, config.blinds.bb);

  // Ante 처리
  const { anteMode, anteAmount } = config.blinds;

  if (anteMode === "ANTE") {
    if (!anteAmount || anteAmount <= 0) {
      throw new Error("anteAmount must be provided when anteMode=ANTE");
    }
    // 모든 플레이어가 동일 ante를 낸다
    for (const seat of seats) {
      addPost(posts, seat, anteAmount);
    }
  }

  if (anteMode === "BB_ANTE") {
    if (!anteAmount || anteAmount <= 0) {
      throw new Error("anteAmount must be provided when anteMode=BB_ANTE");
    }
    // BB만 ante를 낸다
    addPost(posts, bbSeat, anteAmount);
  }

  return posts;
}

/**
 * SB/BB 좌석 계산
 * - seats: 참여 플레이어 좌석 배열
 * - buttonSeat: 딜러 버튼 좌석
 *
 * 규칙(일반):
 * - SB = 버튼 다음 좌석
 * - BB = SB 다음 좌석
 *
 * 규칙(헤즈업 2인):
 * - 버튼(딜러) = SB
 * - 상대 = BB
 */
export function computeBlindSeats(
  seats: number[],
  buttonSeat: number
): { sbSeat: number; bbSeat: number } {
  const uniq = Array.from(new Set(seats));
  if (uniq.length < 2) throw new Error("at least 2 players are required");

  // 원형 이동을 위해 seats를 정렬해둔다
  const ordered = [...uniq].sort((a, b) => a - b);

  if (ordered.length === 2) {
    // 헤즈업: 버튼이 SB
    const sbSeat = buttonSeat;
    const bbSeat = nextSeat(ordered, sbSeat);
    return { sbSeat, bbSeat };
  }

  // 일반(3명 이상): 버튼 다음이 SB
  const sbSeat = nextSeat(ordered, buttonSeat);
  const bbSeat = nextSeat(ordered, sbSeat);
  return { sbSeat, bbSeat };
}

/**
 * 정렬된 seats 배열에서 current 다음 좌석을 반환한다 (원형)
 */
function nextSeat(orderedSeats: number[], current: number) {
  const idx = orderedSeats.indexOf(current);
  if (idx === -1) throw new Error("current seat not found in seats");
  const nextIdx = (idx + 1) % orderedSeats.length;
  return orderedSeats[nextIdx];
}

/**
 * posts에 (seat -> amount)를 누적 반영한다.
 * - 같은 seat에 SB+ANTE처럼 여러 항목이 들어갈 수 있으므로 누적한다.
 */
function addPost(posts: PostBlindsPosts, seat: number, amount: number) {
  if (amount <= 0) return;
  posts[seat] = (posts[seat] ?? 0) + amount;
}
