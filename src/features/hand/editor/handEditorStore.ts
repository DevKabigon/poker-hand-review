// src/features/hand/editor/handEditorStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TimelineEvent } from "../domain/events";
import {
  HandConfig,
  SeatIndex,
  validateHandConfig,
} from "../domain/handConfig";
import { Card } from "../domain/cards";
import { startHand } from "./services/handStartService";
import { validateAndPrepareAppend } from "./services/eventAppendService";
import {
  shouldAdvanceStreet,
  createStreetEvent,
} from "./services/streetAdvanceService";
import { eventFactory } from "../domain/eventFactories";

export type HandMode = "record" | "review";

/**
 * 핸드 에디터 상태 (MVP)
 * - events + cursor가 유일한 “편집 상태”
 * - 화면에 보여줄 파생 상태(engineState)는 events/cursor로부터 매번 재생(replay)해서 만든다.
 */
type HandEditorState = {
  /* ===========================
   * 고정 설정 (Undo/Redo 대상 아님)
   * =========================== */

  // 핸드 설정 (Setup 화면에서 결정)
  config: HandConfig | null;

  // 딜러 버튼 좌석
  buttonSeat: SeatIndex;

  /* ===========================
   * 편집 상태 (Undo/Redo 대상)
   * =========================== */

  mode: HandMode;

  // 타임라인 이벤트 (append-only가 원칙)
  events: TimelineEvent[];

  // 커서: 0..events.length
  // - cursor=0이면 아무 이벤트도 적용되지 않은 상태
  // - cursor=N이면 events[0..N-1]까지 적용된 상태
  cursor: number;

  // "undo 후 새 이벤트 추가"를 위해 유지하는 미래 이벤트 영역
  // - undo한 상태에서 새 이벤트를 추가하면, futureEvents는 폐기된다.
  // - DB에는 남겨도 되지만, UI 타임라인에서는 inactive 처리(또는 삭제)한다.
  futureEvents: TimelineEvent[];

  // === Derived (파생 상태) ===
  // UI에서 필요하면 selector로 replayToCursor(events, cursor) 호출하면 된다.
  // 여기엔 저장하지 않는다. (저장하면 꼬임)
  // engineState: ... (저장 금지)

  /* ===========================
   * Actions
   * =========================== */

  // Setup 단계
  setConfig: (config: HandConfig) => void;
  setButtonSeat: (seat: SeatIndex) => void;

  // 핸드 시작 (POST_BLINDS 자동 추가)
  startHand: () => void;

  setMode: (mode: HandMode) => void;

  // 커서 이동 (로그 점프 / 리뷰 prev-next 공통)
  setCursor: (nextCursor: number) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;

  advanceStreetIfNeeded: (next: {
    flop?: [Card, Card, Card];
    turn?: Card;
    river?: Card;
  }) => void;

  // 이벤트 추가 (기록 모드에서만)
  appendEvent: (event: TimelineEvent) => void;

  // 보드 카드 이벤트 교체 (스트리트 이벤트만)
  replaceStreetEvents: (params: {
    street: "FLOP" | "TURN" | "RIVER";
    cards: Card[];
  }) => void;

  // 전체 초기화 (새 핸드 시작)
  reset: (opts?: { keepSetup?: boolean }) => void;
};

/**
 * 커서 보정 함수 (0..len 범위로 클램프)
 */
function clampCursor(cursor: number, len: number) {
  return Math.max(0, Math.min(cursor, len));
}

export const useHandEditorStore = create<HandEditorState>()(
  persist(
    (set, get) => ({
      /* ===========================
       * Setup 상태
       * =========================== */

      config: null,
      buttonSeat: 0,

      setConfig: (config) => {
        validateHandConfig(config);
        set({ config });
      },

      setButtonSeat: (seat) => set({ buttonSeat: seat }),

      startHand: () => {
        const { config, buttonSeat, events } = get();

        const result = startHand(config, buttonSeat, events);

        set({
          events: [result.event],
          cursor: result.cursor,
          futureEvents: [],
        });
      },

      /* ===========================
       * 타임라인 상태
       * =========================== */

      mode: "record",
      events: [],
      cursor: 0,
      futureEvents: [],

      setMode: (mode) => set({ mode }),

      setCursor: (nextCursor) => {
        const { events } = get();
        set({ cursor: clampCursor(nextCursor, events.length) });
      },

      undo: () => {
        const { cursor } = get();
        if (cursor <= 0) return;
        set({ cursor: cursor - 1 });
      },

      redo: () => {
        const { cursor, events } = get();
        if (cursor >= events.length) return;
        set({ cursor: cursor + 1 });
      },

      appendEvent: (event) => {
        const { mode, events, cursor, config, buttonSeat } = get();

        const result = validateAndPrepareAppend({
          mode,
          events,
          cursor,
          config,
          buttonSeat,
          event,
        });

        set({
          events: result.nextEvents,
          cursor: result.nextCursor,
          futureEvents: [],
        });
      },

      replaceStreetEvents: (params) => {
        const { street, cards } = params;
        const { events } = get();

        // 보드 카드 이벤트 찾기
        let flopIndex = -1;
        let turnIndex = -1;
        let riverIndex = -1;

        for (let i = 0; i < events.length; i++) {
          if (events[i].type === "REVEAL_FLOP" && flopIndex === -1) {
            flopIndex = i;
          } else if (events[i].type === "REVEAL_TURN" && turnIndex === -1) {
            turnIndex = i;
          } else if (events[i].type === "REVEAL_RIVER" && riverIndex === -1) {
            riverIndex = i;
          }
        }

        const newEvents = [...events];
        let cardIndex = 0;

        // 플랍 이벤트 처리
        // 플랍만 수정할 때는 플랍 이벤트만 교체하고, 턴/리버는 건드리지 않음
        if (street === "FLOP") {
          const flopCards = cards.slice(0, 3) as [Card, Card, Card] | [];
          if (flopIndex !== -1) {
            // 기존 플랍 이벤트 교체
            newEvents[flopIndex] = eventFactory.revealFlop(
              flopCards.length === 3 ? flopCards : []
            );
          } else if (flopCards.length === 3) {
            // 플랍 이벤트가 없으면 추가 (첫 번째 ACTION 이벤트 앞에)
            const firstActionIndex = newEvents.findIndex(
              (e) => e.type === "ACTION"
            );
            const insertIndex =
              firstActionIndex !== -1 ? firstActionIndex : newEvents.length;
            newEvents.splice(
              insertIndex,
              0,
              eventFactory.revealFlop(flopCards)
            );
            // 인덱스 업데이트
            if (turnIndex !== -1 && turnIndex >= insertIndex) turnIndex++;
            if (riverIndex !== -1 && riverIndex >= insertIndex) riverIndex++;
            flopIndex = insertIndex;
          }
          // 플랍만 수정할 때는 여기서 종료
        } else if (street === "TURN") {
          // 턴만 수정할 때는 턴 이벤트만 교체하고, 플랍/리버는 건드리지 않음
          const turnCard = cards[0] || null;
          if (turnIndex !== -1) {
            // 기존 턴 이벤트 교체
            newEvents[turnIndex] = eventFactory.revealTurn(turnCard);
          } else if (turnCard !== null) {
            // 턴 이벤트가 없으면 추가 (플랍 이벤트 뒤, 첫 번째 ACTION 이벤트 앞)
            const insertIndex =
              flopIndex !== -1
                ? flopIndex + 1
                : newEvents.findIndex((e) => e.type === "ACTION");
            const finalInsertIndex =
              insertIndex !== -1 ? insertIndex : newEvents.length;
            newEvents.splice(
              finalInsertIndex,
              0,
              eventFactory.revealTurn(turnCard)
            );
            // 인덱스 업데이트
            if (riverIndex !== -1 && riverIndex >= finalInsertIndex)
              riverIndex++;
            turnIndex = finalInsertIndex;
          }
          // 턴만 수정할 때는 여기서 종료
        } else if (street === "RIVER") {
          // 리버 수정 시: 리버만 수정하는 경우와 5장 모두 추가하는 경우를 구분
          if (cards.length === 5) {
            // 리버에서 5장을 추가하는 경우: 플랍/턴/리버 모두 처리
            const flopCards = cards.slice(0, 3) as [Card, Card, Card] | [];
            if (flopIndex !== -1) {
              // 기존 플랍 이벤트 교체
              if (flopCards.length === 3) {
                newEvents[flopIndex] = eventFactory.revealFlop(flopCards);
              }
            } else if (flopCards.length === 3) {
              // 플랍 이벤트가 없으면 추가 (첫 번째 ACTION 이벤트 앞에)
              const firstActionIndex = newEvents.findIndex(
                (e) => e.type === "ACTION"
              );
              const insertIndex =
                firstActionIndex !== -1 ? firstActionIndex : newEvents.length;
              newEvents.splice(
                insertIndex,
                0,
                eventFactory.revealFlop(flopCards)
              );
              // 인덱스 업데이트
              if (turnIndex !== -1 && turnIndex >= insertIndex) turnIndex++;
              if (riverIndex !== -1 && riverIndex >= insertIndex) riverIndex++;
              flopIndex = insertIndex;
            }
            cardIndex = 3;

            // 턴 이벤트 처리
            const turnCard = cards[cardIndex] || null;
            if (turnIndex !== -1) {
              // 기존 턴 이벤트 교체
              if (turnCard !== null) {
                newEvents[turnIndex] = eventFactory.revealTurn(turnCard);
              }
            } else if (turnCard !== null) {
              // 턴 이벤트가 없으면 추가 (플랍 이벤트 뒤, 첫 번째 ACTION 이벤트 앞)
              const insertIndex =
                flopIndex !== -1
                  ? flopIndex + 1
                  : newEvents.findIndex((e) => e.type === "ACTION");
              const finalInsertIndex =
                insertIndex !== -1 ? insertIndex : newEvents.length;
              newEvents.splice(
                finalInsertIndex,
                0,
                eventFactory.revealTurn(turnCard)
              );
              // 인덱스 업데이트
              if (riverIndex !== -1 && riverIndex >= finalInsertIndex)
                riverIndex++;
              turnIndex = finalInsertIndex;
            }
            cardIndex += 1;

            // 리버 이벤트 처리
            const riverCard = cards[cardIndex] || null;
            if (riverIndex !== -1) {
              // 기존 리버 이벤트 교체
              newEvents[riverIndex] = eventFactory.revealRiver(riverCard);
            } else if (riverCard !== null) {
              // 리버 이벤트가 없으면 추가 (턴 이벤트 뒤, 첫 번째 ACTION 이벤트 앞)
              const insertIndex =
                turnIndex !== -1
                  ? turnIndex + 1
                  : flopIndex !== -1
                  ? flopIndex + 1
                  : newEvents.findIndex((e) => e.type === "ACTION");
              const finalInsertIndex =
                insertIndex !== -1 ? insertIndex : newEvents.length;
              newEvents.splice(
                finalInsertIndex,
                0,
                eventFactory.revealRiver(riverCard)
              );
              riverIndex = finalInsertIndex;
            }
          } else {
            // 리버만 수정하는 경우: 리버 이벤트만 교체
            const riverCard = cards[0] || null;
            if (riverIndex !== -1) {
              // 기존 리버 이벤트 교체
              newEvents[riverIndex] = eventFactory.revealRiver(riverCard);
            } else if (riverCard !== null) {
              // 리버 이벤트가 없으면 추가 (턴 이벤트 뒤, 첫 번째 ACTION 이벤트 앞)
              const insertIndex =
                turnIndex !== -1
                  ? turnIndex + 1
                  : flopIndex !== -1
                  ? flopIndex + 1
                  : newEvents.findIndex((e) => e.type === "ACTION");
              const finalInsertIndex =
                insertIndex !== -1 ? insertIndex : newEvents.length;
              newEvents.splice(
                finalInsertIndex,
                0,
                eventFactory.revealRiver(riverCard)
              );
              riverIndex = finalInsertIndex;
            }
          }
        }

        // 리버 이벤트 처리
        if (street === "RIVER") {
          const riverCard = cards[cardIndex] || null;
          if (riverIndex !== -1) {
            // 기존 리버 이벤트 교체
            newEvents[riverIndex] = eventFactory.revealRiver(riverCard);
          } else if (riverCard !== null) {
            // 리버 이벤트가 없으면 추가 (턴 이벤트 뒤, 첫 번째 ACTION 이벤트 앞)
            const insertIndex =
              turnIndex !== -1
                ? turnIndex + 1
                : flopIndex !== -1
                ? flopIndex + 1
                : newEvents.findIndex((e) => e.type === "ACTION");
            const finalInsertIndex =
              insertIndex !== -1 ? insertIndex : newEvents.length;
            newEvents.splice(
              finalInsertIndex,
              0,
              eventFactory.revealRiver(riverCard)
            );
            riverIndex = finalInsertIndex;
          }
        }

        set({
          events: newEvents,
          // cursor는 유지 (이벤트 교체만 수행)
        });
      },

      reset: (opts) => {
        const keepSetup = opts?.keepSetup ?? false;

        set((state) => ({
          mode: "record",
          events: [],
          cursor: 0,
          futureEvents: [],
          config: keepSetup ? state.config : null,
          buttonSeat: 0,
        }));
      },

      advanceStreetIfNeeded: (nextCards) => {
        const { events, cursor, config, buttonSeat } = get();
        if (!config || buttonSeat === null) return;

        const result = shouldAdvanceStreet({
          events,
          cursor,
          config,
          buttonSeat,
        });

        if (!result.shouldAdvance || !result.nextStreet) return;

        const streetEvent = createStreetEvent({
          street: result.nextStreet,
          cards: nextCards,
        });

        get().appendEvent(streetEvent);
      },
    }),
    {
      name: "hand-editor-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
