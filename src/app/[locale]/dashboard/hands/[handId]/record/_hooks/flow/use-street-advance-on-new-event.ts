import { useEffect, useRef } from "react";

type UseStreetAdvanceOnNewEventParams = {
  eventsLength: number;
  handleStreetAdvance: (checkCursor: number) => void;
};

/**
 * 새 이벤트가 append된 경우에만 스트리트 진행 여부를 검사한다.
 * undo/redo/jump로 인한 cursor 이동에서는 실행하지 않는다.
 */
export function useStreetAdvanceOnNewEvent({
  eventsLength,
  handleStreetAdvance,
}: UseStreetAdvanceOnNewEventParams) {
  const prevEventsLengthRef = useRef<number>(eventsLength);

  useEffect(() => {
    if (eventsLength === 0) return;

    const isNewEventAdded = eventsLength > prevEventsLengthRef.current;
    if (!isNewEventAdded) {
      prevEventsLengthRef.current = eventsLength;
      return;
    }

    prevEventsLengthRef.current = eventsLength;
    handleStreetAdvance(eventsLength);
  }, [eventsLength, handleStreetAdvance]);
}
