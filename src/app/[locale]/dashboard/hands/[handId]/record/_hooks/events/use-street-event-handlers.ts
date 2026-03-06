import { useCallback } from "react";
import { Card } from "@/features/hand/domain/cards";
import type { TimelineEvent } from "@/features/hand/domain/events";

type EditingStreetEvent = {
  eventIndex: number;
  eventType: "REVEAL_FLOP" | "REVEAL_TURN" | "REVEAL_RIVER";
};

type UseStreetEventHandlersParams = {
  events: TimelineEvent[];
  setEditingStreetEvent: (event: EditingStreetEvent | null) => void;
  setPendingStreetAdvance: (
    advance: {
      nextStreet: "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";
    } | null
  ) => void;
  setShowBoardDialog: (show: boolean) => void;
};

export function useStreetEventHandlers({
  events,
  setEditingStreetEvent,
  setPendingStreetAdvance,
  setShowBoardDialog,
}: UseStreetEventHandlersParams) {
  // 이벤트 로그에서 스트리트 이벤트 클릭 핸들러
  const handleStreetEventClick = useCallback(
    (
      eventIndex: number,
      eventType: "REVEAL_FLOP" | "REVEAL_TURN" | "REVEAL_RIVER"
    ) => {
      // 스트리트 타입 결정
      let street: "FLOP" | "TURN" | "RIVER" = "FLOP";
      if (eventType === "REVEAL_TURN") street = "TURN";
      if (eventType === "REVEAL_RIVER") street = "RIVER";

      setEditingStreetEvent({
        eventIndex,
        eventType,
      });
      setPendingStreetAdvance({
        nextStreet: street,
      });
      setShowBoardDialog(true);
    },
    [setEditingStreetEvent, setPendingStreetAdvance, setShowBoardDialog]
  );

  // 수정 모드일 때 이후 스트리트 이벤트에서 사용된 카드 추출
  const getFutureStreetCards = useCallback(
    (
      eventIndex: number,
      eventType: "REVEAL_FLOP" | "REVEAL_TURN" | "REVEAL_RIVER"
    ): Card[] => {
      const futureCards: Card[] = [];

      if (eventType === "REVEAL_FLOP") {
        // 플랍 이벤트 이후의 이벤트에서 턴/리버 카드 찾기
        for (let i = eventIndex + 1; i < events.length; i++) {
          const event = events[i];
          if (event.type === "REVEAL_TURN" && event.payload?.card) {
            futureCards.push(event.payload.card);
          } else if (event.type === "REVEAL_RIVER" && event.payload?.card) {
            futureCards.push(event.payload.card);
          }
        }
      } else if (eventType === "REVEAL_TURN") {
        // 턴 이벤트 이후의 이벤트에서 리버 카드 찾기
        for (let i = eventIndex + 1; i < events.length; i++) {
          const event = events[i];
          if (event.type === "REVEAL_RIVER" && event.payload?.card) {
            futureCards.push(event.payload.card);
          }
        }
      }

      return futureCards;
    },
    [events]
  );

  // 수정 모드일 때 현재 스트리트의 카드 추출
  const getCurrentStreetCards = useCallback(
    (
      eventIndex: number,
      eventType: "REVEAL_FLOP" | "REVEAL_TURN" | "REVEAL_RIVER"
    ): Card[] => {
      const event = events[eventIndex];
      if (!event) return [];

      switch (eventType) {
        case "REVEAL_FLOP": {
          if (event.type === "REVEAL_FLOP" && event.payload?.cards) {
            return event.payload.cards.length === 3
              ? [...event.payload.cards]
              : [];
          }
          return [];
        }
        case "REVEAL_TURN": {
          if (event.type === "REVEAL_TURN" && event.payload?.card) {
            return [event.payload.card];
          }
          return [];
        }
        case "REVEAL_RIVER": {
          if (event.type === "REVEAL_RIVER" && event.payload?.card) {
            return [event.payload.card];
          }
          return [];
        }
        default:
          return [];
      }
    },
    [events]
  );

  return {
    handleStreetEventClick,
    getFutureStreetCards,
    getCurrentStreetCards,
  };
}
