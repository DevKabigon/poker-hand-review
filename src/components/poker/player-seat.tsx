// components/poker/player-seat.tsx

import { Card } from "@/features/hand/domain/cards";
import { getCardImage } from "@/features/hand/ui/assets";
import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface PlayerSeatProps {
  seat: number;
  name: string;
  stack: number;
  isHero: boolean;
  isActive: boolean;
  isHighlighted?: boolean;
  holdCards: [Card | null, Card | null];
  onClick: () => void;
  positionMap: Record<number, string>;
  invested: number;
  bb: number;
  actionBadge?: string;
  isFolded?: boolean;
  isClickable?: boolean;
  size?: "mobile" | "desktop";
  infoSize?: "default" | "lg";
}

export function PlayerSeat({
  seat,
  name,
  stack,
  isHero,
  isActive,
  isHighlighted = false,
  holdCards,
  onClick,
  positionMap,
  actionBadge,
  isFolded = false,
  isClickable = true,
  size = "desktop",
  infoSize = "default",
}: PlayerSeatProps) {
  const t = useTranslations("handFlow.table");
  const position = positionMap[seat];
  const isDealer = position === "BTN"; // BTN 포지션이면 딜러 버튼 표시
  const isMobileSize = size === "mobile";
  const isLargeInfo = infoSize === "lg";
  const stackLabel = Number.isInteger(stack)
    ? String(stack)
    : stack.toFixed(1).replace(/\.0$/, "");

  function getBadgeClass(label: string) {
    switch (label) {
      case "FOLD":
        return "bg-destructive/90 text-white border-2 border-destructive shadow-destructive/50";
      case "CHECK":
        return "bg-emerald-500/90 text-white border-2 border-emerald-400 shadow-emerald-500/50";
      case "CALL":
        return "bg-sky-500/90 text-white border-2 border-sky-400 shadow-sky-500/50";
      case "BET":
      case "RAISE":
        return "bg-orange-500/90 text-white border-2 border-orange-400 shadow-orange-500/50";
      case "ALL_IN":
        return "bg-purple-500/90 text-white border-2 border-purple-400 shadow-purple-500/50";
      default:
        return "bg-slate-700/90 text-white border-2 border-slate-500 shadow-slate-700/50";
    }
  }

  return (
    <>
      <div
        className={cn(
          "transition-all",
          isClickable && "cursor-pointer hover:scale-110",
          isActive &&
            "ring-2 ring-amber-500 ring-offset-2 ring-offset-amber-500 rounded-lg",
          isHighlighted &&
            !isActive &&
            "ring-2 ring-white ring-offset-2 ring-offset-white rounded-lg",
          isFolded && "opacity-40",
        )}
        onClick={onClick}
      >
        <div className="flex flex-col items-center relative">
          <div
            className={cn(
              "relative flex justify-center items-center",
              isMobileSize ? "h-[4.3rem] w-[5.6rem]" : "h-20 w-[6.9rem]",
            )}
          >
            {isDealer && (
              <div
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center rounded-full border-2 border-slate-700 bg-white shadow-md",
                  isMobileSize ? "-right-3.5 h-4 w-4" : "-right-5 h-5 w-5",
                )}
              >
                <span
                  className={cn(
                    "font-black text-slate-800",
                    isMobileSize ? "text-[8px]" : "text-[10px]",
                  )}
                >
                  D
                </span>
              </div>
            )}

            {/* Hero 표시 (왕관) - 카드 위에 작게 배치 */}
            {isHero && (
              <div
                className={cn(
                  "absolute z-20 bg-card rounded-full border border-primary/50 shadow-lg",
                  isMobileSize
                    ? "-top-3 -right-2.5 p-0.5"
                    : "-top-4 -right-4 p-0.5",
                )}
              >
                <Crown
                  className={cn(
                    "text-primary fill-primary",
                    isMobileSize ? "h-3 w-3" : "h-3.5 w-3.5",
                  )}
                />
              </div>
            )}

            {/* 카드 2장 (겹쳐진 형태) */}
            <div className="relative flex gap-0.5">
              {[0, 1].map((idx) => {
                const card = holdCards?.[idx];
                const cardImg = getCardImage(card || "BACK");

                return (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-sm border border-black/20 shadow-md overflow-hidden transition-all",
                      isMobileSize
                        ? "w-[2.95rem] h-[4.2rem]"
                        : "w-[3.2rem] h-[4.65rem]",
                      card ? "z-10 scale-105" : "opacity-90",
                    )}
                  >
                    <Image
                      src={cardImg}
                      alt="card"
                      width={64}
                      height={93}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </div>
                );
              })}
              {/* 액션 배지 - 카드 중앙에 표시 */}
              {actionBadge && (
                <div
                  className={cn(
                    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 rounded-md font-black uppercase tracking-tighter shadow-lg backdrop-blur-sm opacity-75",
                    isMobileSize
                      ? "px-1.5 py-0.5 text-[10px]"
                      : "px-2 py-1 text-[10px]",
                    getBadgeClass(actionBadge),
                  )}
                >
                  {actionBadge}
                </div>
              )}
            </div>
          </div>
          {/* 정보 영역 */}
          <div
            className={cn(
              "bg-background/80 backdrop-blur-md rounded-md border text-center",
              isMobileSize
                ? "px-2.5 py-0.75 min-w-20"
                : "px-3 py-1.25 min-w-23",
              isHero ? "border-primary/40" : "border-border",
            )}
          >
            <p
              className={cn(
                "font-bold text-foreground truncate",
                isMobileSize
                  ? isLargeInfo
                    ? "text-[13px] max-w-20"
                    : "text-[12px] max-w-20"
                  : isLargeInfo
                    ? "text-[13px] max-w-26"
                    : "text-[12px] max-w-26",
              )}
            >
              {name}
            </p>
            <div className="mt-0.5 flex items-center justify-center gap-1">
              {position && (
                <span
                  className={cn(
                    "rounded bg-slate-800 px-1.5 py-0.5 font-black leading-none tracking-tighter text-slate-200 border border-white/10",
                    isMobileSize
                      ? isLargeInfo
                        ? "text-[9px]"
                        : "text-[8px]"
                      : isLargeInfo
                        ? "text-[9px]"
                        : "text-[8px]",
                  )}
                >
                  {position}
                </span>
              )}
              <p
                className={cn(
                  "text-primary font-black leading-none whitespace-nowrap tabular-nums",
                  isMobileSize
                    ? isLargeInfo
                      ? "text-[12px]"
                      : "text-[11px]"
                    : isLargeInfo
                      ? "text-[13px]"
                      : "text-[12px]",
                )}
              >
                {stackLabel}
                {t("bbUnit")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
