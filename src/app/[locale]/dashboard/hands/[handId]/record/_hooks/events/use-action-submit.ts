import { useCallback } from "react";
import { eventFactory } from "@/features/hand/domain/eventFactories";
import type { ActionType, TimelineEvent } from "@/features/hand/domain/events";
import { useTranslations } from "next-intl";

type UseActionSubmitParams = {
  currentActor: number | null;
  appendEvent: (event: TimelineEvent) => void;
  setLastError: (value: string | null) => void;
};

/**
 * 액션 입력값을 이벤트로 변환해 append한다.
 * UI 레이어는 이 훅을 호출해 이벤트 생성/예외 처리를 위임한다.
 */
export function useActionSubmit({
  currentActor,
  appendEvent,
  setLastError,
}: UseActionSubmitParams) {
  const t = useTranslations("handFlow.record");

  const handleAction = useCallback(
    (action: ActionType, amount?: number) => {
      if (currentActor === null) return;

      setLastError(null);

      try {
        appendEvent(eventFactory.action(currentActor, action, amount));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("errorAppendAction");
        setLastError(message);
      }
    },
    [appendEvent, currentActor, setLastError, t]
  );

  return {
    handleAction,
  };
}
