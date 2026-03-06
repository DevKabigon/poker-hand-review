// src/features/hand/domain/events.ts

import { Card } from "./cards";
import { BlindsConfig } from "./handConfig";

// 모든 이벤트 공통 형태
export type TimelineEventBase<
  T extends string,
  P = undefined
> = P extends undefined ? { type: T } : { type: T; payload: P };

export const ACTION_TYPES = [
  "FOLD",
  "CHECK",
  "CALL",
  "BET",
  "RAISE",
  "ALL_IN",
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

export type ActionEvent = TimelineEventBase<
  "ACTION",
  {
    seat: number;
    action: ActionType;
    // amount is the chip amount put into the pot by this action (delta), not total invested.
    amount?: number;
  }
>;

/**
 * 블라인드/안티 포스팅 이벤트
 * - “핸드 시작 시 강제로 빠지는 돈”도 이벤트로 기록한다.
 * - 이후 cursor=1 상태가 'Post Blinds 완료' 상태가 된다.
 */
export type PostBlindsEvent = {
  type: "POST_BLINDS";
  payload: {
    posts: Record<number, number>;
    blinds: BlindsConfig; // ✅ 추가
  };
};

// 보드 카드를 선택적으로 만들기 (나중에 추가 가능)
export type RevealFlopEvent = TimelineEventBase<
  "REVEAL_FLOP",
  { cards: [Card, Card, Card] | [] }
>;

export type RevealTurnEvent = TimelineEventBase<
  "REVEAL_TURN",
  { card: Card | null }
>;

export type RevealRiverEvent = TimelineEventBase<
  "REVEAL_RIVER",
  { card: Card | null }
>;

export type ShowdownEvent = TimelineEventBase<"SHOWDOWN">;

export type ShowdownRevealEvent = TimelineEventBase<
  "SHOWDOWN_REVEAL",
  { seat: number; cards: [Card, Card] }
>;

export type TimelineEvent =
  | PostBlindsEvent
  | ActionEvent
  | RevealFlopEvent
  | RevealTurnEvent
  | RevealRiverEvent
  | ShowdownEvent
  | ShowdownRevealEvent;
