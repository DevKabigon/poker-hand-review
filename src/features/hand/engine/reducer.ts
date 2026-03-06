// src/features/hand/engine/reducer.ts

import type { Card } from "../domain/cards";
import type { TimelineEvent } from "../domain/events";

/**
 * 스트리트(라운드) 상태
 * - 실제 액션 순서/베팅 라운드 종료 판정은 나중 단계에서 구현한다.
 * - MVP에서는 카드 공개 이벤트를 기준으로 street만 업데이트한다.
 */
export type Street = "PREFLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";

export interface Pot {
  amount: number;
  eligibleSeatSet: number[]; // 이 팟을 가져갈 수 있는 좌석들
}

export type ActionLogItem =
  | {
      kind: "POST_BLINDS";
      cursor: number;
      seat: number;
      action: string;
      amount: number;
    }
  | {
      kind: "ACTION";
      cursor: number;
      seat: number;
      action: string;
      amount?: number;
    }
  | { kind: "STREET"; cursor: number; street: Street; cards?: Card[] }
  | { kind: "SHOWDOWN"; cursor: number; text: string }
  | { kind: "REVEAL"; cursor: number; seat: number; cards: Card[] };

/**
 * 최소 엔진 상태 (MVP)
 * - Undo/Redo/점프는 "cursor 이동 + 재생(replay)"로 해결한다.
 * - 즉, state는 항상 이벤트를 재생해서 생성되는 파생값이다.
 */
export type HandEngineState = {
  street: Street;
  board: Card[]; // 0~5장
  totalPot: number; // UI 표시용(합계)
  pots: Pot[]; // 정확한 분배/자격용
  actionLogs: ActionLogItem[]; // 오른쪽 로그 UI용 (나중에 구조화 가능)
};

/**
 * 초기 상태
 * - cursor=0 상태(baseState)는 나중에 HandConfig + POST_BLINDS로 만들 예정
 * - 지금은 MVP라서 "프리플랍, 보드 없음, 로그 없음"으로 시작한다.
 */
export function createInitialEngineState(): HandEngineState {
  return {
    street: "PREFLOP",
    board: [],
    totalPot: 0,
    pots: [],
    actionLogs: [],
  };
}

/**
 * 단일 이벤트를 상태에 적용한다 (pure reducer)
 * - 상태를 직접 mutate하지 않고 새로운 상태를 반환한다.
 */
export function applyEvent(
  prev: HandEngineState,
  event: TimelineEvent,
  cursorAfterApply: number // ✅ 핵심: 이 이벤트를 적용한 뒤의 커서(= i+1)
): HandEngineState {
  switch (event.type) {
    case "POST_BLINDS": {
      const { posts } = event.payload;
      const postedTotal = Object.values(posts).reduce((sum, n) => sum + n, 0);

      const newLogs: ActionLogItem[] = Object.entries(posts).map(
        ([seat, amt]) => ({
          kind: "POST_BLINDS",
          cursor: cursorAfterApply,
          seat: Number(seat),
          action: "POST_BLIND",
          amount: amt,
        })
      );

      return {
        ...prev,
        totalPot: prev.totalPot + postedTotal,
        actionLogs: [...prev.actionLogs, ...newLogs],
      };
    }

    case "ACTION": {
      const { seat, action, amount } = event.payload;

      return {
        ...prev,
        actionLogs: [
          ...prev.actionLogs,
          { kind: "ACTION", cursor: cursorAfterApply, seat, action, amount },
        ],
      };
    }

    case "REVEAL_FLOP": {
      const { cards } = event.payload;
      // 빈 배열이면 보드 카드 없이 스트리트만 진행
      if (cards.length === 0) {
        return {
          ...prev,
          street: "FLOP",
          board: [...prev.board], // 기존 보드 유지
          actionLogs: [
            ...prev.actionLogs,
            {
              kind: "STREET",
              cursor: cursorAfterApply,
              street: "FLOP",
              cards: [],
            },
          ],
        };
      }
      return {
        ...prev,
        street: "FLOP",
        board: [...cards],
        actionLogs: [
          ...prev.actionLogs,
          { kind: "STREET", cursor: cursorAfterApply, street: "FLOP", cards },
        ],
      };
    }

    case "REVEAL_TURN":
    case "REVEAL_RIVER": {
      const isTurn = event.type === "REVEAL_TURN";
      const card = event.payload.card;
      const nextStreet = isTurn ? "TURN" : "RIVER";

      // 카드가 null이면 보드 카드 없이 스트리트만 진행
      if (card === null) {
        return {
          ...prev,
          street: nextStreet,
          board: [...prev.board], // 기존 보드 유지
          actionLogs: [
            ...prev.actionLogs,
            {
              kind: "STREET",
              cursor: cursorAfterApply,
              street: nextStreet,
              cards: [],
            },
          ],
        };
      }

      return {
        ...prev,
        street: nextStreet,
        board: [...prev.board, card],
        actionLogs: [
          ...prev.actionLogs,
          {
            kind: "STREET",
            cursor: cursorAfterApply,
            street: nextStreet,
            cards: [card],
          },
        ],
      };
    }

    case "SHOWDOWN": {
      return {
        ...prev,
        street: "SHOWDOWN",
        actionLogs: [
          ...prev.actionLogs,
          { kind: "SHOWDOWN", cursor: cursorAfterApply, text: "SHOWDOWN" },
        ],
      };
    }

    case "SHOWDOWN_REVEAL": {
      const { seat, cards } = event.payload;
      return {
        ...prev,
        actionLogs: [
          ...prev.actionLogs,
          { kind: "REVEAL", cursor: cursorAfterApply, seat, cards: [...cards] },
        ],
      };
    }

    default:
      return prev;
  }
}

/**
 * 이벤트 배열을 cursor까지 재생해서 상태를 만든다.
 * - Undo/Redo/점프는 "cursor 변경 후 이 함수를 다시 호출"하는 방식으로 구현한다.
 *
 * @param events 타임라인 이벤트 배열
 * @param cursor 0..events.length 범위 (cursor=0이면 아무 이벤트도 적용하지 않음)
 */
export function replayToCursor(
  events: TimelineEvent[],
  cursor: number
): HandEngineState {
  const base = createInitialEngineState();

  // cursor 범위를 강제로 보정 (UI/서버 버그 방어)
  const safeCursor = Math.max(0, Math.min(cursor, events.length));

  // 0..safeCursor-1 까지 적용
  return events.slice(0, safeCursor).reduce(applyEvent, base);
}
