"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BettingDerived } from "@/features/hand/engine/bettingDerived";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  actorName: string | null;
  street: string;

  bb: number;
  pot: number; // chips
  toCall: number; // chips
  actorStackChips: number;

  investedForBet: number; // ✅ 이미 이번 betting에서 넣은 총액(TO 기준)
  minRaiseTo: number; // ✅ 최소 raise "to"
  canRaiseForSeat: boolean; // ✅ reopen 정책(raise 가능 여부)
  betting: BettingDerived | null;

  onAction: (
    action: "FOLD" | "CHECK" | "CALL" | "BET" | "RAISE" | "ALL_IN",
    amount?: number, // ✅ 항상 "TO(chips)"로 전달
  ) => void;

  onSaveClick?: () => void; // ✅ 저장 함수 추가
  isSaving?: boolean; // ✅ 저장 상태 추가
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;

  disabled?: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function ActionPanel({
  actorName,
  street,
  bb,
  pot,
  toCall,
  investedForBet,
  minRaiseTo,
  canRaiseForSeat,
  onAction,
  disabled,
  betting,
  actorStackChips,
  onSaveClick,
  isSaving,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: Props) {
  const t = useTranslations("handFlow.record.actionPanel");
  const isActorTurn = !!actorName;
  const isCall = toCall > 0;
  const isPreflop = street === "PREFLOP";

  // 기존: investedForBet > 0 만 봄 (취약)
  const hasBetThisStreet = investedForBet > 0;
  const isRaiseContext = isPreflop || isCall || hasBetThisStreet;

  const actionTitle = isRaiseContext ? "RAISE" : "BET";
  const canInteract = isActorTurn && !disabled;
  const isShowdown = street === "SHOWDOWN";
  // const isStreetEnded = !isActorTurn && !isShowdown;

  const toBB = (amt: number) => (bb > 0 ? (amt / bb).toFixed(1) : "0.0");

  // ✅ 입력은 BB 단위(표시/입력은 BB) + 의미는 TO(총액)
  const [inputBB, setInputBB] = useState<string>("");

  const betToChips = (() => {
    const n = Number(inputBB);
    if (!Number.isFinite(n) || n <= 0 || bb <= 0) return 0;
    return Math.round(n * bb);
  })();

  // ✅ TO 기반 최소값
  const minToForBet = Math.max(1, investedForBet + 1);

  // 엔진 minRaiseTo가 정답 + 안전가드
  // 소수점 값도 처리하기 위해 최소 레이즈 단위는 bb 사용
  // PREFLOP: 최소 레이즈는 BB만큼, POSTFLOP: 최소 1칩
  const minRaiseUnit = street === "PREFLOP" ? bb : 1;
  const minToForRaise = Math.max(
    minRaiseTo,
    investedForBet + toCall + minRaiseUnit,
  );

  const looksLikeOpenRaise = isPreflop && minRaiseTo <= bb * 2 + 1; // +1은 칩 반올림/가드\

  const maxTo = investedForBet + actorStackChips; // ✅ 이번 스트릿에서 TO로 갈 수 있는 최대

  const allInTo = maxTo;

  const canAllIn = canInteract && allInTo > investedForBet;

  const commitAllIn = () => {
    if (!canAllIn) return;

    // ✅ 올인 버튼을 직접 눌렀을 때는 항상 전체 스택을 베팅합니다.
    // 올인 콜은 CALL 버튼에서만 처리합니다.
    // ALL_IN 액션의 amount는 delta (추가 베팅 금액)이므로 actorStackChips를 사용
    const allInDelta = actorStackChips;

    // UX: 입력칸도 올인으로 세팅(원치 않으면 제거)
    if (bb > 0) setInputBB((allInTo / bb).toFixed(1));

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[ActionPanel ALL_IN] actorStackChips=${actorStackChips}, allInDelta=${allInDelta}, toCall=${toCall}`,
      );
    }

    onAction("ALL_IN", allInDelta);
    setInputBB("");
  };

  const quickButtons = (() => {
    if (!bb) return [];
    if (!betting) return [];

    // ✅ 1) BET 컨텍스트: pot% (33/50/75/100)
    if (!isRaiseContext) {
      return [0.33, 0.5, 0.75, 1.0].map((r) => {
        const delta = Math.round(pot * r);
        const rawTo = investedForBet + delta;
        const to = clamp(rawTo, minToForBet, maxTo);
        return {
          label: `${Math.round(r * 100)}%`,
          bb: Number((to / bb).toFixed(1)),
        };
      });
    }

    // ✅ 2) 프리플랍 최초 오픈만: 2 / 2.5 / 3 / 4 BB (TO)
    if (looksLikeOpenRaise) {
      return [2, 2.5, 3, 4].map((x) => ({
        label: `${x}BB`,
        bb: x,
      }));
    }

    // ✅ 그 외 모든 RAISE 컨텍스트: 2x/2.5x/3x/4x (기준 = currentBetTo)
    return [2, 2.5, 3, 4].map((m) => {
      const rawTo = Math.round(betting.maxInvestedForBet * m);
      const to = clamp(Math.max(rawTo, minRaiseTo), minRaiseTo, maxTo);

      return { label: `${m}x`, bb: Number((to / bb).toFixed(1)) };
    });
  })();

  const primaryDisabled = (() => {
    if (!canInteract) return true;
    if (betToChips <= 0) return true;
    if (betToChips > maxTo) return true;

    // ✅ TO는 이미 넣은 금액보다 커야 의미 있음
    if (betToChips <= investedForBet) return true;

    if (!isRaiseContext) {
      // BET
      return betToChips < minToForBet;
    }

    // RAISE(콜 있음)
    if (!canRaiseForSeat) return true;
    return betToChips < minToForRaise;
  })();

  const commitPrimaryBet = () => {
    if (primaryDisabled) return;

    if (!isRaiseContext) {
      onAction("BET", betToChips);
      setInputBB("");
      return;
    }

    onAction("RAISE", betToChips);
    setInputBB("");
  };

  const headerText = (() => {
    if (isShowdown) return t("showdown");
    if (isActorTurn) return t("toAct", { name: actorName ?? "" });
    return t("streetEnded");
  })();

  const placeholderBB = (() => {
    if (bb <= 0) return "0.0";

    if (!isRaiseContext) {
      const minBetTo = investedForBet + bb;
      return (minBetTo / bb).toFixed(1);
    }

    // ✅ RAISE는 최소 raise to
    return (minToForRaise / bb).toFixed(1);
  })();

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card/95 dark:bg-zinc-900/90 backdrop-blur-sm shadow-sm",
        "px-2 py-2 md:px-2.5 md:py-2.5",
        "flex flex-col gap-1 transition-all duration-300",
        isShowdown && "bg-purple-500/8 border-purple-500/25",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!onUndo || !canUndo}
            className="h-8 w-8 rounded-xl p-0 md:h-9 md:w-9"
          >
            <ChevronLeft className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRedo}
            disabled={!onRedo || !canRedo}
            className="h-8 w-8 rounded-xl p-0 md:h-9 md:w-9"
          >
            <ChevronRight className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
        </div>

        <Badge
          variant="outline"
          className="h-6 rounded-md border-primary/30 bg-primary/6 px-2 text-[10px] font-bold uppercase tracking-wider text-primary md:h-7 md:px-2.5 md:text-xs"
        >
          {street}
        </Badge>
      </div>

      {/* 1. 상단 상태 헤더 */}
      <div className="flex items-center justify-between gap-2 min-h-6">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-all duration-500",
              isActorTurn
                ? "bg-primary animate-pulse"
                : isShowdown
                  ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" // 보라색 글로우 효과
                  : "bg-orange-400",
            )}
          />
          <span
            className={cn(
              "text-xs md:text-[15px] font-semibold truncate text-foreground",
              isShowdown && "text-purple-300",
            )}
          >
            {headerText}
          </span>
        </div>

        {isCall && !isShowdown && (
          <Badge
            variant="secondary"
            className="shrink-0 h-5 px-2 text-[10px] font-semibold bg-muted text-foreground border border-border/70 md:h-6 md:text-[11px]"
          >
            {t("toCall")}: {toBB(toCall)} {t("bbUnit")}
          </Badge>
        )}
      </div>

      {/* 2. 중간 영역: 쇼다운이면 분석 멘트, 아니면 베팅 컨트롤 */}
      {isShowdown ? (
        <div className="flex items-center px-1.5 py-1 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-[11px] md:text-xs text-muted-foreground leading-relaxed">
            {t("completedLine1")}
            <br />
            {t("completedLine2")}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-lg border border-border/70 bg-background/70 dark:bg-zinc-950/45",
            "px-1.5 py-1",
            (!isActorTurn || disabled) && "opacity-40 pointer-events-none",
          )}
        >
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-5 gap-1 flex-3">
              {quickButtons.slice(0, 5).map((q) => (
                <Button
                  key={q.label}
                  variant="secondary"
                  size="sm"
                  className="h-7 text-[10px] font-semibold bg-muted/80 hover:bg-muted border border-border/70 text-foreground active:scale-95 md:h-8 md:text-[11px]"
                  onClick={() => setInputBB(String(q.bb))}
                >
                  {q.label}
                </Button>
              ))}
            </div>

            <div className="relative flex-1 min-w-27">
              <Input
                type="text"
                inputMode="decimal"
                value={inputBB}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || /^\d*\.?\d*$/.test(v)) setInputBB(v);
                }}
                onBlur={() => {
                  const n = Number(inputBB);
                  if (!Number.isFinite(n) || n <= 0) return;
                  setInputBB(n.toFixed(1));
                }}
                placeholder={placeholderBB}
                className="h-7 px-2 text-center font-semibold text-sm bg-background/90 border-border rounded-md focus:ring-1 focus:ring-primary/40 md:h-8 md:text-[15px]"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  {t("bbUnit")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. 하단 버튼 영역 */}
      <div className="flex h-9 min-w-0 gap-1.5 md:h-10 mt-1">
        {isShowdown ? (
          <Button
            variant="outline"
            className={cn(
              "h-full w-full rounded-xl font-semibold transition-all active:scale-95",
              "border-border bg-background/70 hover:bg-muted",
              "text-foreground",
            )}
            onClick={onSaveClick}
            disabled={isSaving || !onSaveClick}
          >
            <Save className="h-4 w-4 mr-1.5 opacity-70" />
            {isSaving ? t("saving") : t("saveHand")}
          </Button>
        ) : (
          /* ✅ 기존 액션 버튼 세트 */
          <>
            <Button
              disabled={!canInteract}
              variant="danger"
              className="flex-1 min-w-0 h-full overflow-hidden rounded-xl px-1.5 text-[11px] font-semibold text-white active:scale-95 md:px-2.5 md:text-[15px]"
              onClick={() => onAction("FOLD")}
            >
              <span className="truncate">{t("fold")}</span>
            </Button>

            {!isCall ? (
              <Button
                disabled={!canInteract}
                variant="primary"
                className="flex-1 min-w-0 h-full overflow-hidden rounded-xl px-1.5 text-[11px] font-semibold text-white active:scale-95 md:px-2.5 md:text-[15px]"
                onClick={() => onAction("CHECK")}
              >
                <span className="truncate">{t("check")}</span>
              </Button>
            ) : (
              <Button
                disabled={!canInteract}
                variant="super"
                className="flex-1 min-w-0 h-full overflow-hidden rounded-xl px-1.5 text-[11px] font-semibold text-white active:scale-95 md:px-2.5 md:text-[15px]"
                onClick={() => {
                  const actualCallAmount = Math.min(toCall, actorStackChips);
                  onAction(
                    actorStackChips <= toCall ? "ALL_IN" : "CALL",
                    actualCallAmount,
                  );
                }}
              >
                <span className="truncate md:hidden">{t("call")}</span>
                <span className="hidden truncate md:inline">
                  {t("call")} {toBB(Math.min(toCall, actorStackChips))}{" "}
                  {t("bbUnit")}
                </span>
              </Button>
            )}

            <Button
              disabled={primaryDisabled}
              variant="raise"
              className="flex-[1.2] min-w-0 h-full overflow-hidden rounded-xl px-1.5 text-[11px] font-semibold text-white active:scale-95 disabled:opacity-40 md:px-2.5 md:text-[15px]"
              onClick={commitPrimaryBet}
            >
              <span className="truncate md:hidden">
                {actionTitle === "RAISE" ? t("raise") : t("bet")}
              </span>
              <span className="hidden truncate md:inline">
                {actionTitle === "RAISE" ? t("raise") : t("bet")}{" "}
                {betToChips > 0
                  ? `${toBB(betToChips)} ${t("bbUnit")}`
                  : isRaiseContext
                    ? `${toBB(minToForRaise)} ${t("bbUnit")}`
                    : `${toBB(investedForBet + bb)} ${t("bbUnit")}`}
              </span>
            </Button>

            <Button
              disabled={!canAllIn}
              variant="secondary"
              className="flex-[1.05] min-w-0 h-full overflow-hidden rounded-xl px-1.5 text-[11px] font-semibold text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 md:px-2.5 md:text-[15px]"
              onClick={commitAllIn}
            >
              <span className="truncate md:hidden">{t("allIn")}</span>
              <span className="hidden truncate md:inline">
                {t("allIn")} {toBB(actorStackChips)} {t("bbUnit")}
              </span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
