import { useCallback } from "react";
import type { TimelineEvent } from "@/features/hand/domain/events";
import type { HandConfig, SeatIndex } from "@/features/hand/domain/handConfig";
import { shouldAdvanceStreet } from "@/features/hand/editor/services/streetAdvanceService";
import { createStreetEvent } from "@/features/hand/editor/services/streetAdvanceService";
import { isHandOverByFolds } from "@/features/hand/engine/streetCompletion";

type UseStreetAdvanceParams = {
  config: HandConfig | null;
  buttonSeat: SeatIndex | null;
  events: TimelineEvent[];
  showBoardDialog: boolean;
  appendEvent: (event: TimelineEvent) => void;
  setPendingStreetAdvance: (
    advance: {
      nextStreet: "FLOP" | "TURN" | "RIVER" | "SHOWDOWN";
    } | null
  ) => void;
  setShowBoardDialog: (show: boolean) => void;
};

// 보드 카드가 이미 설정되어 있는지 확인하는 헬퍼 함수
// function isBoardCardAlreadySet(
//   eventsUpToCursor: TimelineEvent[],
//   street: "FLOP" | "TURN" | "RIVER"
// ): boolean {
//   switch (street) {
//     case "FLOP": {
//       const flopEvent = eventsUpToCursor.find((e) => e.type === "REVEAL_FLOP");
//       return (
//         !!flopEvent &&
//         flopEvent.type === "REVEAL_FLOP" &&
//         !!flopEvent.payload?.cards &&
//         flopEvent.payload.cards.length === 3
//       );
//     }
//     case "TURN": {
//       const turnEvent = eventsUpToCursor.find((e) => e.type === "REVEAL_TURN");
//       return (
//         !!turnEvent &&
//         turnEvent.type === "REVEAL_TURN" &&
//         turnEvent.payload?.card !== null &&
//         turnEvent.payload?.card !== undefined
//       );
//     }
//     case "RIVER": {
//       const riverEvent = eventsUpToCursor.find(
//         (e) => e.type === "REVEAL_RIVER"
//       );
//       return (
//         !!riverEvent &&
//         riverEvent.type === "REVEAL_RIVER" &&
//         riverEvent.payload?.card !== null &&
//         riverEvent.payload?.card !== undefined
//       );
//     }
//   }
// }

export function useStreetAdvance({
  config,
  buttonSeat,
  events,
  showBoardDialog,
  appendEvent,
  setPendingStreetAdvance,
  setShowBoardDialog,
}: UseStreetAdvanceParams) {
  // 스트리트 진행 처리 함수
  const handleStreetAdvance = useCallback(
    (checkCursor: number) => {
      if (!config || buttonSeat === null || showBoardDialog) return;

      const advanceResult = shouldAdvanceStreet({
        events,
        cursor: checkCursor,
        config,
        buttonSeat,
      });

      if (!advanceResult.shouldAdvance || !advanceResult.nextStreet) return;

      const eventsUpToCursor = events.slice(0, checkCursor);

      // SHOWDOWN으로 진행해야 하는 경우 (올인 상황 등)
      if (advanceResult.nextStreet === "SHOWDOWN") {
        // 1. 폴드 승리 체크
        const foldCheck = isHandOverByFolds({
          config,
          eventsApplied: eventsUpToCursor,
        });

        if (foldCheck.over) {
          appendEvent(createStreetEvent({ street: "SHOWDOWN" }));
          return;
        }

        // 올인 런아웃은 자동 모달 오픈 대신 수동 편집 흐름으로 처리한다.
        // FLOP/TURN/RIVER 이벤트가 없으면 빈 이벤트를 먼저 생성해 로그에 표시하고,
        // 사용자가 해당 스트리트를 클릭했을 때만 카드 선택 모달을 연다.
        const hasFlop = eventsUpToCursor.some((e) => e.type === "REVEAL_FLOP");
        const hasTurn = eventsUpToCursor.some((e) => e.type === "REVEAL_TURN");
        const hasRiver = eventsUpToCursor.some(
          (e) => e.type === "REVEAL_RIVER"
        );

        const missingStreets: Array<"FLOP" | "TURN" | "RIVER"> = [];
        if (!hasFlop) missingStreets.push("FLOP");
        if (!hasTurn) missingStreets.push("TURN");
        if (!hasRiver) missingStreets.push("RIVER");

        if (missingStreets.length > 0) {
          for (const street of missingStreets) {
            appendEvent(createStreetEvent({ street }));
          }
          return;
        }

        // 모든 보드 이벤트가 있으면 최종 SHOWDOWN 진행
        appendEvent(createStreetEvent({ street: "SHOWDOWN" }));
        return;
      }

      // 일반적인 FLOP/TURN/RIVER 진행 (올인 아님)
      // 이미 해당 타입의 이벤트가 있다면 모달을 띄우지 않음
      const alreadyHasEvent = eventsUpToCursor.some(
        (e) => e.type === advanceResult.nextStreet
      );

      if (alreadyHasEvent) return;

      // 카드 선택 모달 표시
      setPendingStreetAdvance({ nextStreet: advanceResult.nextStreet });
      setShowBoardDialog(true);
    },
    [
      config,
      buttonSeat,
      showBoardDialog,
      events,
      appendEvent,
      setPendingStreetAdvance,
      setShowBoardDialog,
    ]
  );

  return {
    handleStreetAdvance,
  };
}
