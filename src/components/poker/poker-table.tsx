// components/poker/poker-table.tsx

import { PlayerConfig } from "@/features/hand/domain/handConfig";
import { PlayerSeat } from "./player-seat";
import { chipOffsetForSeat, makeSeatCoords } from "./seat";
import { useHandEditorStore } from "@/features/hand/editor/handEditorStore";
import { cn } from "@/lib/utils";
import { ChipStack } from "./chip-stack";
import { LabeledPot } from "@/features/hand/engine/potLabels";
import { Street } from "@/features/hand/engine/reducer";
import { Card } from "@/features/hand/domain/cards";
import { getCardImage } from "@/features/hand/ui/assets";
import Image from "next/image";
import { useTranslations } from "next-intl";

type PokerTableBaseProps = {
  players: PlayerConfig[];
  maxPlayers: number;
  isMobile: boolean;
  onSeatClick: (seat: number) => void;
  positionMap: Record<number, string>;
  isClickable?: boolean;
  tableTheme?: "default" | "classic";
  tableSize?: "default" | "compact" | "wide" | "wideTall" | "wideShort";
  seatInfoSize?: "default" | "lg";
  desktopSeatScale?: "default" | "compact";
};

type PokerTableEngineProps = {
  activeSeat?: number | null;
  highlightedSeat?: number | null;
  investedForBetBySeat?: Record<number, number>;
  pots?: LabeledPot[];
  totalPotChips?: number;
  preBetPotChips?: number;
  street?: Street;
  board?: Card[];
  stackBySeat?: Record<number, number>;
  actionBadgeBySeat?: Record<number, string>;
  foldedSeats?: Set<number>;
};

type PokerTableProps = PokerTableBaseProps & PokerTableEngineProps;

export function PokerTable({
  players,
  maxPlayers,
  isMobile,
  onSeatClick,
  positionMap,
  stackBySeat = {},
  activeSeat = null,
  highlightedSeat = null,
  investedForBetBySeat = {},
  pots = [],
  totalPotChips = 0,
  preBetPotChips = 0,
  street = "PREFLOP",
  board = [],
  actionBadgeBySeat = {},
  foldedSeats = new Set(),
  isClickable = true,
  tableTheme = "default",
  tableSize = "default",
  seatInfoSize = "default",
  desktopSeatScale = "default",
}: PokerTableProps) {
  const t = useTranslations("handFlow.table");
  const { config } = useHandEditorStore();
  const isWideTable =
    tableSize === "wide" ||
    tableSize === "wideTall" ||
    tableSize === "wideShort";
  const isActionOpen = activeSeat !== null;

  const heroSeat = players.find((p) => p.isHero)?.seat ?? 0;

  const baseCoords = makeSeatCoords({
    count: maxPlayers,
    variant: isMobile ? "mobile" : "desktop",
    topPaddingPct: isMobile ? (tableSize === "wide" ? 4 : 8) : 4,
    startAngleRad: Math.PI / 2,
  });

  if (!config) {
    return;
  }

  return (
    <div
      className={cn(
        "relative mx-auto transition-all duration-500",
        // ✅ 모바일 기준에서는 세로로 더 긴 비율 적용
        isMobile
          ? tableSize === "wide"
            ? "w-full max-w-100 aspect-[1/1.16] mt-3 mb-1"
            : "w-full max-w-100 aspect-[1/1.28] mt-6 mb-2"
          : tableSize === "wideTall"
            ? "w-full max-w-4xl aspect-[1.72/1] mt-0 mb-5"
            : tableSize === "wideShort"
              ? "w-full max-w-4xl aspect-[1.87/1] mt-0 mb-5"
              : tableSize === "wide"
                ? "w-full max-w-4xl aspect-[1.83/1] mt-0 mb-5"
                : tableSize === "compact"
                  ? "w-md aspect-square my-0"
                  : "w-130 aspect-square my-1",
      )}
    >
      {/* 테이블 상판 */}
      <div
        className={cn(
          "absolute transition-all duration-500",
          tableTheme === "classic"
            ? cn(
                "border-transparent bg-[#5f422d] bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,rgba(0,0,0,0)_1px,rgba(0,0,0,0)_6px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,rgba(0,0,0,0)_1px,rgba(0,0,0,0)_6px)] shadow-[0_12px_20px_rgba(0,0,0,0.24)]",
                isWideTable
                  ? "border-[9px] md:border-13"
                  : "border-[6px] md:border-8",
              )
            : "border-4 md:border-[6px] border-slate-800 dark:border-slate-700 bg-linear-to-b from-slate-600 to-slate-800 dark:from-slate-700 dark:to-slate-900 shadow-2xl",
          isMobile
            ? "inset-x-14 inset-y-8 rounded-[9999px]"
            : isWideTable
              ? "inset-x-4 inset-y-8 rounded-[9999px]"
              : "inset-x-4 inset-y-16 rounded-[100%/100%]",
        )}
      >
        {tableTheme === "classic" ? (
          <>
            <div
              className={cn(
                "pointer-events-none absolute bg-linear-to-b from-[#1f1a15] to-[#0e0d0b] shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),inset_0_-3px_7px_rgba(0,0,0,0.55)]",
                isMobile
                  ? "inset-1.75 rounded-[9999px]"
                  : isWideTable
                    ? "inset-2.75 md:inset-3.5 rounded-[9999px]"
                    : "inset-2 md:inset-2.5 rounded-[100%/100%]",
              )}
            />
            <div
              className={cn(
                "pointer-events-none absolute bg-[radial-gradient(ellipse_at_50%_45%,#2ea457_0%,#1f7f44_60%,#14562d_100%)]",
                isMobile
                  ? "inset-3.25 rounded-[9999px]"
                  : isWideTable
                    ? "inset-5 md:inset-6 rounded-[9999px]"
                    : "inset-3.5 md:inset-4 rounded-[100%/100%]",
              )}
            />
          </>
        ) : null}

        <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          {/* 1) total pot (항상 표시) */}
          <div className="mb-1 text-[11px] md:text-xs font-semibold bg-black/55 text-yellow-400 px-2.5 py-0.5 rounded-2xl">
            {t("totalPot")} : {totalPotChips / config.blinds.bb} {t("bbUnit")}
          </div>

          {/* 2) board (이미지 카드) */}
          {/* ✅ board ↔ prebet 사이 간격도 줄이려고 mb/pb 없이 유지 */}
          <div className="flex gap-0.5 md:gap-1">
            {board.map((card, i) => {
              const src = getCardImage(card);
              return (
                <div
                  key={`${card}-${i}`}
                  className={cn(
                    "relative rounded border border-black/20 shadow-md overflow-hidden",
                    isMobile ? "w-10 h-15" : "w-11 h-16.5 lg:w-14 lg:h-21",
                  )}
                >
                  <Image
                    src={src}
                    alt={card}
                    fill
                    sizes="40px"
                    unoptimized
                    className="object-cover"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center -mt-2">
            {!isActionOpen && pots.length > 0 ? (
              // 액션 종료(라운드 종료/쇼다운/핸드 종료) 시에만 확정 pot(Main/Side) 표시
              <div className="flex gap-1 items-end">
                {pots.map((pot, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <ChipStack amount={pot.amount} bb={config.blinds.bb} />
                    {pots.length > 1 && (
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        {idx === 0
                          ? t("mainPot")
                          : t("sidePot", { index: idx })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // 액션 진행 중에는 현재 스트리트 베팅분을 제외한 "기존 pot"만 중앙에 표시
              preBetPotChips > 0 && (
                <div className="flex flex-col items-center gap-1">
                  <ChipStack amount={preBetPotChips} bb={config.blinds.bb} />
                  {street !== "PREFLOP" && (
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                      {t("pot")}
                    </span>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* 칩 오버레이 */}
      {players.map((player) => {
        // ✅ 베팅 레벨만 표시 (ante 제외) - investedForBetBySeat 사용
        // BB Ante 모드에서 BB는 bb만 표시되어야 함 (ante 제외)
        const invested = investedForBetBySeat[player.seat] ?? 0;
        // 소수점 값도 처리하기 위해 0보다 큰 값이면 표시
        if (!(invested > 0)) {
          // 디버깅: invested가 0이거나 없는 경우 로그 (개발 환경에서만)
          if (process.env.NODE_ENV === "development" && config.blinds.bb < 1) {
            console.log(
              `[PokerTable] No chips for seat ${player.seat}, invested=${invested}, investedForBetBySeat=`,
              investedForBetBySeat,
            );
          }
          return null;
        }

        const physicalIndex =
          (player.seat - heroSeat + maxPlayers) % maxPlayers;
        const seatStyle = baseCoords[physicalIndex];

        return (
          <div
            key={`chips-${player.seat}`}
            style={{
              left: seatStyle.left,
              top: seatStyle.top,
              position: "absolute",
              ...chipOffsetForSeat({
                seatCoord: seatStyle,
                variant: isMobile ? "mobile" : "desktop",
              }),
            }}
            className="z-30 pointer-events-none"
          >
            <ChipStack amount={invested} bb={config.blinds.bb} />
          </div>
        );
      })}

      {/* 플레이어 배치 */}
      {players.map((player: PlayerConfig) => {
        const physicalIndex =
          (player.seat - heroSeat + maxPlayers) % maxPlayers;
        const seatStyle = baseCoords[physicalIndex];
        const stackChips = stackBySeat[player.seat] ?? player.stack; // fallback
        const bbStack = stackChips / config.blinds.bb;
        const isActive = activeSeat === player.seat;
        const isHighlighted = highlightedSeat === player.seat;
        // ✅ PlayerSeat에는 investedForBetBySeat 전달 (액션 패널 계산용)
        const invested = investedForBetBySeat[player.seat] ?? 0;
        const isFolded = foldedSeats.has(player.seat);

        return (
          <div
            key={player.seat}
            style={seatStyle}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
              // 모바일은 더 컴팩트, 데스크톱은 카드 가독성을 위해 확대
              isMobile
                ? tableSize === "wide"
                  ? "scale-[0.78]"
                  : "scale-[0.9]"
                : desktopSeatScale === "compact"
                  ? maxPlayers > 6
                    ? "scale-[0.94]"
                    : "scale-[1.04]"
                  : maxPlayers > 6
                    ? "scale-[1.02]"
                    : "scale-[1.14]",
            )}
          >
            <PlayerSeat
              seat={player.seat}
              name={player.name}
              stack={bbStack}
              holdCards={player.holdCards}
              isHero={player.isHero}
              isActive={isActive}
              isHighlighted={isHighlighted}
              onClick={() => onSeatClick(player.seat)}
              positionMap={positionMap}
              invested={invested}
              bb={config.blinds.bb}
              actionBadge={
                isHighlighted ? actionBadgeBySeat[player.seat] : undefined
              }
              isFolded={isFolded}
              isClickable={isClickable}
              size={isMobile ? "mobile" : "desktop"}
              infoSize={seatInfoSize}
            />
          </div>
        );
      })}
    </div>
  );
}
