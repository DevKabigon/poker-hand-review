// src/features/hand/domain/eventFactories.ts

import type { Card } from "./cards";
import type {
  ActionType,
  ActionEvent,
  PostBlindsEvent,
  RevealFlopEvent,
  RevealTurnEvent,
  RevealRiverEvent,
  ShowdownEvent,
  ShowdownRevealEvent,
  TimelineEvent,
} from "./events";
import { BlindsConfig } from "./handConfig";

/**
 * 이벤트 팩토리
 *
 * - 모든 타임라인 이벤트는 반드시 이 헬퍼 함수를 통해 생성한다.
 *   (객체 리터럴을 직접 만들지 않는다)
 * - amount는 누적 금액이 아니라,
 *   "이번 액션으로 팟에 추가된 칩(delta)"을 의미한다.
 */

export function postBlinds(
  posts: Record<number, number>,
  blinds: BlindsConfig // ✅ 추가
): PostBlindsEvent {
  for (const [seatStr, amount] of Object.entries(posts)) {
    const seat = Number(seatStr);
    if (!Number.isFinite(seat) || seat < 0) {
      throw new Error("seat must be a non-negative number");
    }
    if (amount <= 0) {
      throw new Error("posted amount must be > 0");
    }
  }

  return {
    type: "POST_BLINDS",
    payload: {
      posts,
      blinds, // ✅ 그대로 저장
    },
  };
}

export function action(
  seat: number,
  actionType: ActionType,
  amount?: number
): ActionEvent {
  // 기본 가드: 좌석 번호는 0 이상이어야 한다 (도메인 최소 검증)
  if (seat < 0) throw new Error("seat must be >= 0");

  // ✅ CHECK나 FOLD인 경우, 또는 amount가 0인 경우 amount 필드를 삭제합니다.
  if (
    actionType === "CHECK" ||
    actionType === "FOLD" ||
    amount === 0 ||
    amount === undefined
  ) {
    return {
      type: "ACTION",
      payload: {
        seat,
        action: actionType,
        // amount 필드를 아예 넣지 않음
      },
    };
  }

  return {
    type: "ACTION",
    payload: { seat, action: actionType, amount },
  };
}

// 보드 카드를 선택적으로 만들기 (빈 배열 또는 null 허용)
export function revealFlop(
  cards: [Card, Card, Card] | []
): RevealFlopEvent {
  return {
    type: "REVEAL_FLOP",
    payload: { cards },
  };
}

export function revealTurn(card: Card | null): RevealTurnEvent {
  return {
    type: "REVEAL_TURN",
    payload: { card },
  };
}

export function revealRiver(card: Card | null): RevealRiverEvent {
  return {
    type: "REVEAL_RIVER",
    payload: { card },
  };
}

export function showdown(): ShowdownEvent {
  // 쇼다운 진입 이벤트 (카드 공개는 별도의 이벤트로 처리)
  return { type: "SHOWDOWN" };
}

export function showdownReveal(
  seat: number,
  cards: [Card, Card]
): ShowdownRevealEvent {
  // 기본 가드: 좌석 번호는 0 이상이어야 한다
  if (seat < 0) throw new Error("seat must be >= 0");

  return {
    type: "SHOWDOWN_REVEAL",
    payload: { seat, cards },
  };
}

/**
 * 편의용 이벤트 팩토리 객체
 *
 * - 단일 객체로 이벤트 생성 함수를 모아두고 싶을 때 사용
 * - 선택 사항이지만, UI/엔진에서 import가 깔끔해진다
 */
export const eventFactory = {
  postBlinds,
  action,
  revealFlop,
  revealTurn,
  revealRiver,
  showdown,
  showdownReveal,
} as const;

/**
 * 타입 보조용
 *
 * - 이 파일이 최소 하나 이상의 TimelineEvent 생성 경로를
 *   제공한다는 것을 명시적으로 보장하기 위한 타입
 * - 자동완성 및 리팩토링 시 도움됨 (선택 사항)
 */
export type AnyCreatedEvent = TimelineEvent;
