"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Play, ArrowRight } from "lucide-react";
import { useHandEditorStore } from "../features/hand/editor/handEditorStore";
import { usePathname, useRouter } from "@/i18n/navigation";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

export function StartNewHandButton({
  size,
  location,
}: {
  size?:
    | "default"
    | "sm"
    | "lg"
    | "icon"
    | "icon-sm"
    | "icon-lg"
    | null
    | undefined;
  location?: string;
}) {
  const t = useTranslations("startHand");
  const router = useRouter();
  const pathname = usePathname();
  const { reset, events, config, mode } = useHandEditorStore();
  const [showResetDialog, setShowResetDialog] = useState(false);

  // 'record' 모드일 때만 현재 세션으로 간주
  const isRecording = mode === "record";
  const hasStartedHand = isRecording && events.length > 0;
  const hasConfig = isRecording && config !== null;
  const hasSession = hasStartedHand || hasConfig;

  // 기존 핸드 ID 가져오기 (sessionStorage 또는 URL에서)
  const getCurrentHandId = () => {
    // URL에서 handId 추출 시도
    const urlMatch = pathname?.match(/\/(?:dashboard\/hands|hands)\/([^/]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    // sessionStorage에서 가져오기
    return sessionStorage.getItem("currentHandId");
  };

  const startNewHand = () => {
    const handId = nanoid(10);
    sessionStorage.setItem("currentHandId", handId);
    // ✅ 확실하게 모든 초기화(모드 포함)를 수행
    reset({ keepSetup: false });
    router.push(`/hands/${handId}/setup`);
  };

  const handleResume = () => {
    let currentHandId = getCurrentHandId();

    // 세션은 있는데 handId만 없는 경우를 방어
    if (!currentHandId && hasSession) {
      currentHandId = nanoid(10);
      sessionStorage.setItem("currentHandId", currentHandId);
    }

    if (!currentHandId) {
      startNewHand();
      return;
    }

    // 액션이 시작된 경우(record), 아직 설정만 있는 경우(players)로 복귀
    const target = hasStartedHand ? "record" : "players";
    router.push(`/hands/${currentHandId}/${target}`);
  };

  const handleNewHandClick = () => {
    if (hasSession) {
      setShowResetDialog(true);
      return;
    }
    startNewHand();
  };

  const handleConfirmNewHand = () => {
    setShowResetDialog(false);
    startNewHand();
  };
  const showLabel = location === "marketing";

  return (
    <>
      {hasSession ? (
        <>
          <Button
            onClick={handleResume}
            className="rounded-full md:rounded-2xl"
            size={size || "default"}
            variant="super"
            aria-label={t("resumeRecording")}
          >
            <span className="flex flex-row items-center justify-center">
              <span
                className={cn(
                  "sm:inline whitespace-nowrap",
                  showLabel ? "block ml-2" : "hidden",
                )}
              >
                {t("resumeRecording")}
              </span>
              <Play className={cn(showLabel ? "ml-2" : "")} />
            </span>
          </Button>

          <Button
            onClick={handleNewHandClick}
            className="rounded-full md:rounded-2xl"
            size={size || "default"}
            variant="primary"
            aria-label={t("startNewHand")}
          >
            <span className="flex flex-row items-center justify-center">
              <span
                className={cn(
                  "sm:inline whitespace-nowrap",
                  showLabel ? "block ml-2" : "hidden",
                )}
              >
                {t("startNewHand")}
              </span>
              <RotateCcw className={cn(showLabel ? "ml-2" : "")} />
            </span>
          </Button>
        </>
      ) : (
        <Button
          onClick={handleNewHandClick}
          className="rounded-full md:rounded-2xl"
          size={size || "default"}
          variant="primary"
          aria-label={t("startNewHand")}
        >
          <span className="flex flex-row items-center justify-center">
            <span
              className={cn(
                "sm:inline whitespace-nowrap",
                showLabel ? "block ml-2" : "hidden",
              )}
            >
              {t("startNewHand")}
            </span>
            <ArrowRight className={cn(showLabel ? "ml-2" : "")} />
          </span>
        </Button>
      )}

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newTitle")}</DialogTitle>
            <DialogDescription>{t("newDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowResetDialog(false)}>
              {t("cancel")}
            </Button>
            <Button variant="danger" onClick={handleConfirmNewHand}>
              {t("newTitle")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
