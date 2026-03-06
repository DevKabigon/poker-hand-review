import { useCallback, useMemo } from "react";
import { Card } from "@/features/hand/domain/cards";
import { createStreetEvent } from "@/features/hand/editor/services/streetAdvanceService";
import { replayToCursor } from "@/features/hand/engine/reducer";
import type { TimelineEvent } from "@/features/hand/domain/events";

type PendingStreetAdvance = {
  nextStreet: "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";
};

type EditingStreetEvent = {
  eventIndex: number;
  eventType: "REVEAL_FLOP" | "REVEAL_TURN" | "REVEAL_RIVER";
};

type UseBoardSelectionDialogParams = {
  pendingStreetAdvance: PendingStreetAdvance | null;
  editingStreetEvent: EditingStreetEvent | null;
  events: TimelineEvent[];
  engineStateBoard: Card[];
  appendEvent: (event: TimelineEvent) => void;
  replaceStreetEvents: (params: {
    street: "FLOP" | "TURN" | "RIVER";
    cards: Card[];
  }) => void;
  setShowBoardDialog: (show: boolean) => void;
  setPendingStreetAdvance: (advance: PendingStreetAdvance | null) => void;
  setEditingStreetEvent: (event: EditingStreetEvent | null) => void;
  setLastError: (error: string | null) => void;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown error";
}

export function useBoardSelectionDialog({
  pendingStreetAdvance,
  editingStreetEvent,
  events,
  engineStateBoard,
  appendEvent,
  replaceStreetEvents,
  setShowBoardDialog,
  setPendingStreetAdvance,
  setEditingStreetEvent,
  setLastError,
}: UseBoardSelectionDialogParams) {
  // 보드 카드 다이얼로그 닫기
  const handleClose = useCallback(() => {
    setShowBoardDialog(false);
    setPendingStreetAdvance(null);
    setEditingStreetEvent(null);
  }, [setShowBoardDialog, setPendingStreetAdvance, setEditingStreetEvent]);

  // 필요한 카드 계산 헬퍼
  const getRequiredCardsForStreet = useCallback(
    (nextStreet: "FLOP" | "TURN" | "RIVER", currentBoardLength: number) => {
      switch (nextStreet) {
        case "FLOP":
          return { flop: 3, turn: 0, river: 0 };
        case "TURN":
          return currentBoardLength === 0
            ? { flop: 3, turn: 1, river: 0 }
            : { flop: 0, turn: 1, river: 0 };
        case "RIVER":
          if (currentBoardLength === 0) return { flop: 3, turn: 1, river: 1 };
          if (currentBoardLength === 3) return { flop: 0, turn: 1, river: 1 };
          if (currentBoardLength === 4) return { flop: 0, turn: 0, river: 1 };
          return { flop: 0, turn: 0, river: 0 };
      }
    },
    []
  );

  // 카드로부터 스트리트 이벤트 생성 및 추가
  const createStreetEventsFromCards = useCallback(
    (
      cards: Card[],
      required: { flop: number; turn: number; river: number }
    ) => {
      let cardIndex = 0;

      if (required.flop > 0 && cards.length >= required.flop) {
        appendEvent(
          createStreetEvent({
            street: "FLOP",
            cards: { flop: cards.slice(0, 3) as [Card, Card, Card] },
          })
        );
        cardIndex = 3;
      }

      if (required.turn > 0 && cards.length >= cardIndex + 1) {
        appendEvent(
          createStreetEvent({
            street: "TURN",
            cards: { turn: cards[cardIndex] },
          })
        );
        cardIndex += 1;
      }

      if (required.river > 0 && cards.length >= cardIndex + 1) {
        appendEvent(
          createStreetEvent({
            street: "RIVER",
            cards: { river: cards[cardIndex] },
          })
        );
      }
    },
    [appendEvent]
  );

  // 보드 카드 다이얼로그 스킵
  const handleSkip = useCallback(() => {
    if (!pendingStreetAdvance) return;

    if (editingStreetEvent) {
      // 수정 모드에서는 스킵 시 아무것도 하지 않음
      handleClose();
      return;
    }

    // 보드 카드 없이 스트리트 진행
    appendEvent(createStreetEvent({ street: pendingStreetAdvance.nextStreet }));
    handleClose();
  }, [pendingStreetAdvance, editingStreetEvent, appendEvent, handleClose]);

  // 보드 카드 다이얼로그 확인
  const handleConfirm = useCallback(
    (cards: Card[]) => {
      if (!pendingStreetAdvance) return;

      try {
        // 수정 모드 처리
        if (editingStreetEvent) {
          const street =
            editingStreetEvent.eventType === "REVEAL_FLOP"
              ? "FLOP"
              : editingStreetEvent.eventType === "REVEAL_TURN"
              ? "TURN"
              : "RIVER";

          replaceStreetEvents({
            street,
            cards: street === "RIVER" && cards.length === 5 ? cards : cards,
          });
          handleClose();
          return;
        }

        // 새로 추가하는 경우
        if (pendingStreetAdvance.nextStreet === "SHOWDOWN") {
          handleClose();
          return;
        }

        const required = getRequiredCardsForStreet(
          pendingStreetAdvance.nextStreet,
          engineStateBoard.length
        );
        createStreetEventsFromCards(cards, required);
        handleClose();
      } catch (error: unknown) {
        setLastError(getErrorMessage(error));
      }
    },
    [
      pendingStreetAdvance,
      editingStreetEvent,
      engineStateBoard.length,
      getRequiredCardsForStreet,
      createStreetEventsFromCards,
      replaceStreetEvents,
      handleClose,
      setLastError,
    ]
  );

  // 수정 모드일 때 보드 상태 계산
  const editingBoard = useMemo(() => {
    if (!editingStreetEvent) return engineStateBoard;
    const eventsUpToClick = events.slice(0, editingStreetEvent.eventIndex);
    const boardState = replayToCursor(eventsUpToClick, eventsUpToClick.length);
    return boardState.board;
  }, [editingStreetEvent, events, engineStateBoard]);

  return {
    handleClose,
    handleSkip,
    handleConfirm,
    editingBoard,
  };
}
