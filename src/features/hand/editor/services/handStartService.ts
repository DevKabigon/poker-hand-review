// src/features/hand/editor/services/handStartService.ts

import type { HandConfig, SeatIndex } from "../../domain/handConfig";
import type { TimelineEvent } from "../../domain/events";
import { computePostBlindsPosts } from "../../domain/postBlinds";
import { eventFactory } from "../../domain/eventFactories";

export type StartHandResult = {
  event: TimelineEvent;
  cursor: number;
};

/**
 * 핸드 시작 로직
 * - 핸드 시작에 필요한 모든 검증과 이벤트 생성 담당
 *
 * @param config 핸드 설정 (null일 수 있음)
 * @param buttonSeat 딜러 버튼 좌석 (null일 수 있음)
 * @param events 현재 이벤트 배열 (핸드가 이미 시작되었는지 확인용)
 * @returns 생성된 POST_BLINDS 이벤트와 초기 cursor 값
 * @throws Error 핸드 시작 조건이 만족되지 않을 때
 */
export function startHand(
  config: HandConfig | null,
  buttonSeat: SeatIndex | null,
  events: TimelineEvent[]
): StartHandResult {
  if (!config) {
    throw new Error("cannot start hand: config is not set");
  }
  if (buttonSeat === null) {
    throw new Error("cannot start hand: buttonSeat is not set");
  }
  if (events.length > 0) {
    throw new Error("hand already started");
  }

  const posts = computePostBlindsPosts(config, buttonSeat);
  const event = eventFactory.postBlinds(posts, config.blinds);

  return {
    event,
    cursor: 1,
  };
}
