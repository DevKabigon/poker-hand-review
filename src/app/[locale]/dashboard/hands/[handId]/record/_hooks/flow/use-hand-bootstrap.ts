import { useEffect } from "react";
import type { HandConfig, SeatIndex } from "@/features/hand/domain/handConfig";

type UseHandBootstrapParams = {
  config: HandConfig | null;
  buttonSeat: SeatIndex | null;
  eventsLength: number;
  startHand: () => void;
  setButtonSeat: (seat: SeatIndex) => void;
};

/**
 * 액션 기록 화면 진입 시 기본 버튼 좌석과 초기 POST_BLINDS 이벤트를 보장한다.
 */
export function useHandBootstrap({
  config,
  buttonSeat,
  eventsLength,
  startHand,
  setButtonSeat,
}: UseHandBootstrapParams) {
  useEffect(() => {
    if (!config) return;

    if (buttonSeat === null) {
      const defaultSeat = config.players.find((p) => p.isHero)?.seat ?? 0;
      setButtonSeat(defaultSeat);
      return;
    }

    if (eventsLength === 0) {
      try {
        startHand();
      } catch (error) {
        // Strict mode/중복 effect 타이밍에서 이미 시작된 핸드면 무시
        if (error instanceof Error && error.message.includes("already started")) {
          return;
        }
        console.error("[useHandBootstrap] Failed to start hand:", error);
      }
    }
  }, [config, buttonSeat, eventsLength, startHand, setButtonSeat]);
}
