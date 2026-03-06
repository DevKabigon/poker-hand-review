import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { TimelineEvent } from "@/features/hand/domain/events";
import type { HandConfig, SeatIndex } from "@/features/hand/domain/handConfig";
import { saveHand } from "@/features/hand/db/handService";
import { useTranslations } from "next-intl";

type UsePageActionsParams = {
  handId: string;
  user: { id: string } | null;
  config: HandConfig | null;
  events: TimelineEvent[];
  buttonSeat: SeatIndex | null;
  reset: (options: { keepSetup: boolean }) => void;
  setIsSaving: (isSaving: boolean) => void;
  setShowExitDialog: (show: boolean) => void;
  setShowSaveDialog: (show: boolean) => void;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function usePageActions({
  handId,
  user,
  config,
  events,
  buttonSeat,
  reset,
  setIsSaving,
  setShowExitDialog,
  setShowSaveDialog,
}: UsePageActionsParams) {
  const router = useRouter();
  const t = useTranslations("handFlow.record");

  // 뒤로가기 핸들러: 플레이어 셋팅으로 갈 때만 확인 다이얼로그 표시
  const handleBackClick = useCallback(() => {
    // POST_BLINDS를 제외한 실제 액션이 있는지 확인
    const hasActions = events.length > 1;

    if (hasActions) {
      // 세션 스토리지에서 플레이어 셋팅에서 왔는지 확인
      const fromPlayerSettings =
        sessionStorage.getItem("fromPlayerSettings") === "true";

      if (fromPlayerSettings) {
        // 플레이어 셋팅으로 가는 경우: 액션 초기화 확인 다이얼로그
        setShowExitDialog(true);
      } else {
        // 다른 곳으로 가는 경우: 저장되었다는 메시지 표시 후 뒤로가기
        toast.success(t("toastProgressSaved"), {
          description: t("toastProgressSavedDesc"),
        });
        router.back();
      }
    } else {
      // 이벤트가 없거나 POST_BLINDS만 있으면 바로 뒤로가기
      router.back();
    }
  }, [events.length, router, setShowExitDialog, t]);

  // 확인 다이얼로그에서 확인 클릭 시
  const handleConfirmExit = useCallback(() => {
    reset({ keepSetup: true });
    setShowExitDialog(false);
    // 플래그 제거
    sessionStorage.removeItem("fromPlayerSettings");
    router.back();
  }, [reset, router, setShowExitDialog]);

  // 저장 버튼 클릭 핸들러 (모달 열기)
  const handleSaveClick = useCallback(() => {
    // 로그인 상태 확인
    if (!user) {
      toast.error(t("toastLoginRequired"), {
        description: t("toastLoginRequiredDesc"),
      });
      router.push("/auth/login");
      return;
    }

    if (!config) {
      toast.error(t("toastConfigMissing"));
      return;
    }

    if (events.length === 0) {
      toast.error(t("toastNoEvents"));
      return;
    }

    if (buttonSeat === null) {
      toast.error(t("toastDealerMissing"));
      return;
    }

    // 모달 열기
    setShowSaveDialog(true);
  }, [user, config, events.length, buttonSeat, router, setShowSaveDialog, t]);

  // 실제 저장 핸들러 (모달에서 확인 클릭 시)
  const handleConfirmSave = useCallback(
    async (title: string, tags: string[]) => {
      if (!config || !user || buttonSeat === null) return;

      setIsSaving(true);
      try {
        await saveHand({
          handId,
          config,
          events,
          buttonSeat,
          title: title || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });

        toast.success(t("toastSaveSuccess"));

        // persist 초기화
        reset({ keepSetup: false });
        sessionStorage.removeItem("currentHandId");
        sessionStorage.removeItem("fromPlayerSettings");

        // 모달 닫기
        setShowSaveDialog(false);

        // 대시보드로 리다이렉트
        router.push("/history");
      } catch (error: unknown) {
        console.error("Failed to save hand:", error);
        toast.error(t("toastSaveFailed"), {
          description: getErrorMessage(error, t("toastSaveFailedDesc")),
        });
      } finally {
        setIsSaving(false);
      }
    },
    [
      config,
      user,
      buttonSeat,
      handId,
      events,
      reset,
      router,
      setIsSaving,
      setShowSaveDialog,
      t,
    ]
  );

  return {
    handleBackClick,
    handleConfirmExit,
    handleSaveClick,
    handleConfirmSave,
  };
}
