// src/features/hand/editor/services/eventAppendService.ts

import type { TimelineEvent } from "../../domain/events";
import type { HandConfig, SeatIndex } from "../../domain/handConfig";
import { validateActionOrThrow } from "../../engine/validateAction";
import { replayToCursor } from "../../engine/reducer";

export type AppendEventParams = {
  mode: "record" | "review";
  events: TimelineEvent[];
  cursor: number;
  config: HandConfig | null;
  buttonSeat: SeatIndex | null;
  event: TimelineEvent;
};

export type AppendEventResult = {
  nextEvents: TimelineEvent[];
  nextCursor: number;
};

/**
 * 이벤트 추가 로직
 * - 이벤트 검증 및 추가 준비 담당
 *
 * @param params 이벤트 추가에 필요한 파라미터
 * @returns 다음 이벤트 배열과 cursor 값
 * @throws Error 검증 실패 시
 */
export function validateAndPrepareAppend(
  params: AppendEventParams
): AppendEventResult {
  const { mode, events, cursor, config, buttonSeat, event } = params;

  if (mode !== "record") {
    // review 모드에서는 조용히 반환 (기존 동작 유지)
    return {
      nextEvents: events,
      nextCursor: cursor,
    };
  }

  if (event.type === "POST_BLINDS" && events.length > 0) {
    throw new Error("POST_BLINDS can only be added as the first event");
  }

  // ACTION 이벤트 검증
  if (event.type === "ACTION") {
    if (!config) {
      throw new Error("config is not set");
    }
    if (buttonSeat === null) {
      throw new Error("buttonSeat is not set");
    }

    const safeCursor = Math.max(0, Math.min(cursor, events.length));
    const eventsApplied = events.slice(0, safeCursor);
    const base = replayToCursor(eventsApplied, eventsApplied.length);

    // hand started guard (POST_BLINDS가 적용돼 있어야)
    const started = eventsApplied[0]?.type === "POST_BLINDS";
    if (!started) {
      throw new Error("hand not started (POST_BLINDS not applied)");
    }

    validateActionOrThrow({
      street: base.street,
      eventsApplied,
      config,
      buttonSeat,
      event,
    });
  }

  // Undo 상태에서 새 이벤트 추가 시 미래 이벤트 처리
  const nextEvents = [...events.slice(0, cursor), event];

  return {
    nextEvents,
    nextCursor: nextEvents.length,
  };
}
