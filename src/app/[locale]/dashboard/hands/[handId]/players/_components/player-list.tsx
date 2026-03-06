"use client";

import { useState } from "react";
import { ArrowRight, Edit2, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCardImage } from "@/features/hand/ui/assets";
import { HandConfig, PlayerConfig } from "@/features/hand/domain/handConfig";
import { Params } from "next/dist/server/request/params";
import { useHandEditorStore } from "@/features/hand/editor/handEditorStore";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ResumeHandDialog } from "../../record/_components";
import { useTranslations } from "next-intl";
import Image from "next/image";

export function PlayerList({
  handlePlayerClick,
  players,
  config,
  params,
}: {
  handlePlayerClick: (seat: number) => void;
  players: PlayerConfig[];
  config: HandConfig;
  params: Params;
}) {
  const t = useTranslations("handFlow.players");
  const bbUnit = config.blinds.bb;
  const router = useRouter();
  const { startHand, events, reset } = useHandEditorStore();
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  const handleNextStep = () => {
    if (!config) return;

    // 플레이어 셋팅 페이지에서 액션 레코딩 페이지로 이동하는 것을 표시
    sessionStorage.setItem("fromPlayerSettings", "true");

    // POST_BLINDS를 제외한 실제 액션이 있는지 확인
    const hasActions = events.length > 1;

    // 이미 핸드가 시작되어 있고 액션이 있으면 다이얼로그 표시
    if (hasActions) {
      setShowResumeDialog(true);
      return;
    }

    // 이벤트가 없거나 POST_BLINDS만 있으면 바로 시작
    navigateToActionRecording();
  };

  const navigateToActionRecording = () => {
    if (!config) return;

    try {
      // 이벤트가 없으면 핸드 시작 (POST_BLINDS 생성)
      if (events.length === 0) {
        startHand();
      }

      // 기록 페이지로 이동
      router.push(`/hands/${params.handId}/record`);
    } catch (error) {
      // 예상치 못한 에러 발생 시
      console.error("Failed to start hand:", error);
      toast.error(t("toastStartFailed"));
    }
  };

  const handleResume = () => {
    setShowResumeDialog(false);
    navigateToActionRecording();
  };

  const handleNewHand = () => {
    setShowResumeDialog(false);
    // 액션만 초기화 (플레이어 설정은 유지)
    reset({ keepSetup: true });
    navigateToActionRecording();
  };

  return (
    <div className="w-full">
      <Card className="rounded-[1.5rem] border-border bg-card/40 p-1 shadow-xl backdrop-blur-md md:rounded-[2rem]">
        <div className="p-5 md:p-6">
          <div className="mb-8 grid gap-4 sm:grid-cols-2 min-[1500px]:grid-cols-3">
            {players.map((player) => (
              <div
                key={player.seat}
                onClick={() => handlePlayerClick(player.seat)}
                className={cn(
                  "group relative flex items-center gap-4 rounded-2xl border p-4 transition-all text-left cursor-pointer",
                  player.isHero
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/10"
                    : "border-border bg-background/50 hover:bg-muted/50"
                )}
              >
                <div className="flex shrink-0">
                  {[0, 1].map((idx) => {
                    const card = player.holdCards?.[idx];
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "h-10 w-7 rounded-sm border border-black/20 overflow-hidden shadow-sm transition-all",
                          card ? "z-10" : "opacity-30 grayscale"
                        )}
                      >
                        <Image
                          src={getCardImage(card || "BACK")}
                          alt="card"
                          width={28}
                          height={40}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex min-w-0 items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm leading-5 font-bold">
                      {player.name}
                    </p>
                    {player.isHero && (
                      <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] leading-none font-black text-primary-foreground">
                        {t("heroBadge")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-mono">
                      {player.stack}{" "}
                      <span className="text-[10px] text-primary/60 opacity-80">
                        ({(player.stack / bbUnit).toFixed(1)} BB)
                      </span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <Edit2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleNextStep}
            className="h-12 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] md:h-11"
          >
            {t("startRecordingAction")}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </Card>

      <ResumeHandDialog
        isOpen={showResumeDialog}
        onOpenChange={setShowResumeDialog}
        onResume={handleResume}
        onNewHand={handleNewHand}
      />
    </div>
  );
}
