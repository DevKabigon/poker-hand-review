"use client";

import { useRef, useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TimelineEvent } from "@/features/hand/domain/events";
import { HandConfig, PlayerConfig } from "@/features/hand/domain/handConfig";
import { useTranslations } from "next-intl";

interface EventLogProps {
  events: TimelineEvent[];
  cursor: number;
  setCursor: (cursor: number) => void;
  config: HandConfig | null;
  currentActor: number | null;
  currentActorPlayer: PlayerConfig | null | undefined;
  isMobile: boolean;
  forceCompactTop?: boolean;
  positionMap?: Record<number, string>;
  showCurrentActor?: boolean; // 복기 모드에서는 false
  autoScrollToLatest?: boolean;
  onStreetEventClick?: (
    eventIndex: number,
    eventType: "REVEAL_FLOP" | "REVEAL_TURN" | "REVEAL_RIVER"
  ) => void;
}

function getEventLabel(ev: TimelineEvent): {
  kind: string;
  label: string;
  cards?: string[];
} {
  switch (ev.type) {
    case "POST_BLINDS":
      return { kind: "POST_BLINDS", label: "POST_BLINDS" };
    case "ACTION":
      return { kind: "ACTION", label: ev.payload?.action ?? "ACTION" };
    case "REVEAL_FLOP":
      // 빈 배열이면 카드 없음
      const flopCards =
        ev.payload?.cards && ev.payload.cards.length > 0
          ? ev.payload.cards
          : undefined;
      return { kind: "STREET", label: "FLOP", cards: flopCards };
    case "REVEAL_TURN":
      // null이면 카드 없음
      const turnCard = ev.payload?.card ?? null;
      return {
        kind: "STREET",
        label: "TURN",
        cards: turnCard ? [turnCard] : undefined,
      };
    case "REVEAL_RIVER":
      // null이면 카드 없음
      const riverCard = ev.payload?.card ?? null;
      return {
        kind: "STREET",
        label: "RIVER",
        cards: riverCard ? [riverCard] : undefined,
      };
    case "SHOWDOWN":
      return { kind: "SHOWDOWN", label: "SHOWDOWN" };
    case "SHOWDOWN_REVEAL":
      return { kind: "REVEAL", label: "REVEAL", cards: ev.payload?.cards };
    default:
      return { kind: "ETC", label: "UNKNOWN" };
  }
}

function getBadgeClass(kind: string, label: string) {
  // log UI에서 쓰던 컬러룰 그대로 가져오면 됨
  switch (label) {
    case "FOLD":
      return "bg-destructive/14 text-destructive border border-destructive/35 dark:bg-destructive/16 dark:text-red-300 dark:border-destructive/45";
    case "CHECK":
      return "bg-emerald-500/14 text-emerald-700 border border-emerald-500/40 dark:bg-emerald-500/18 dark:text-emerald-300 dark:border-emerald-500/45";
    case "CALL":
      return "bg-sky-500/14 text-sky-700 border border-sky-500/40 dark:bg-sky-500/18 dark:text-sky-300 dark:border-sky-500/45";
    case "BET":
    case "RAISE":
      return "bg-orange-500/14 text-orange-700 border border-orange-500/40 dark:bg-orange-500/18 dark:text-orange-300 dark:border-orange-500/45";
    case "ALL_IN":
      return "bg-violet-500/14 text-violet-700 border border-violet-500/40 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/45";
    case "SB":
    case "BB":
    case "BB + Ante":
      return "bg-muted/60 text-foreground/90 border border-border dark:bg-muted/45 dark:text-muted-foreground";
    default:
      return "bg-muted/55 text-foreground/85 border border-border dark:bg-muted/40 dark:text-muted-foreground";
  }
}

export function EventLog({
  events,
  cursor,
  setCursor,
  config,
  currentActor,
  currentActorPlayer,
  isMobile,
  forceCompactTop = false,
  positionMap = {},
  showCurrentActor = true, // 기본값은 true (액션 레코딩 모드)
  autoScrollToLatest = true,
  onStreetEventClick,
}: EventLogProps) {
  const t = useTranslations("handFlow.record");
  const eventRowRefs = useRef<Record<number, HTMLElement | null>>({});
  const useCompactTop = isMobile || forceCompactTop;

  const stackByCursor = useMemo(() => {
    if (!config) return {} as Record<number, Record<number, number>>;

    const runningStack: Record<number, number> = {};
    for (const p of config.players) {
      runningStack[p.seat] = p.stack;
    }

    const result: Record<number, Record<number, number>> = {};
    events.forEach((ev, idx) => {
      if (ev.type === "POST_BLINDS") {
        for (const [seatStr, amt] of Object.entries(ev.payload.posts)) {
          const seat = Number(seatStr);
          if (seat in runningStack && typeof amt === "number" && amt > 0) {
            runningStack[seat] = Math.max(0, runningStack[seat] - amt);
          }
        }
      }

      if (ev.type === "ACTION") {
        const { seat, amount } = ev.payload;
        if (seat in runningStack && typeof amount === "number" && amount > 0) {
          runningStack[seat] = Math.max(0, runningStack[seat] - amount);
        }
      }

      result[idx + 1] = { ...runningStack };
    });

    return result;
  }, [config, events]);

  // ✅ cursor가 바뀌면(undo/redo/클릭) active row/칩으로 자동 스크롤
  useEffect(() => {
    const el = eventRowRefs.current[cursor];
    if (!el) return;

    el.scrollIntoView({
      block: "nearest",
      inline: useCompactTop ? "center" : "nearest",
      behavior: "smooth",
    });
  }, [cursor, useCompactTop]);

  // ✅ 액션이 추가되면(이벤트 길이 증가) 항상 최신 이벤트로 자동 이동
  useEffect(() => {
    if (!autoScrollToLatest) return;
    if ((!showCurrentActor && !useCompactTop) || events.length === 0) return;

    requestAnimationFrame(() => {
      const lastRow = eventRowRefs.current[events.length];
      if (!lastRow) return;
      lastRow.scrollIntoView({
        block: "nearest",
        inline: useCompactTop ? "end" : "nearest",
        behavior: "smooth",
      });
    });
  }, [events.length, useCompactTop, showCurrentActor, autoScrollToLatest]);

  const toBB = (amount: number) => {
    if (!config?.blinds.bb) return "0";
    return (amount / config.blinds.bb).toFixed(1);
  };

  const toBBCompact = (amount: number) => {
    if (!config?.blinds.bb) return "0";
    const value = amount / config.blinds.bb;
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  };

  const getLabelText = (rawLabel: string) => {
    switch (rawLabel) {
      case "POST_BLINDS":
        return t("event.postBlinds");
      case "FLOP":
        return t("event.flop");
      case "TURN":
        return t("event.turn");
      case "RIVER":
        return t("event.river");
      case "SHOWDOWN":
        return t("event.showdown");
      case "REVEAL":
        return t("event.reveal");
      case "FOLD":
        return t("event.fold");
      case "CHECK":
        return t("event.check");
      case "CALL":
        return t("event.call");
      case "BET":
        return t("event.bet");
      case "RAISE":
        return t("event.raise");
      case "ALL_IN":
        return t("event.allIn");
      default:
        return rawLabel;
    }
  };

  if (useCompactTop) {
    const actingSeat = currentActor ?? null;
    const actingPosition =
      actingSeat !== null ? positionMap[actingSeat] : undefined;
    const actingFallbackName =
      actingSeat !== null
        ? config?.players?.find((p) => p.seat === actingSeat)?.name ??
          `P${actingSeat}`
        : undefined;
    const actingLabel = actingPosition || actingFallbackName || null;
    const actingStack =
      actingSeat !== null
        ? stackByCursor[cursor]?.[actingSeat] ?? currentActorPlayer?.stack
        : undefined;

    return (
      <div className="w-full min-h-[56px] md:min-h-[60px]">
        <div className="w-full overflow-x-auto pb-1 touch-pan-x [scrollbar-gutter:stable_both-edges]">
          <div className="flex w-max gap-2 px-1 pb-2 md:gap-2.5 md:pb-1">
            {events.map((ev, i) => {
              const evCursor = i + 1;
              const isActive = cursor === evCursor;
              const info = getEventLabel(ev);
              const displayLabel =
                info.label === "POST_BLINDS"
                  ? "포스트 블라인드"
                  : getLabelText(info.label);
              const badgeClass = getBadgeClass(info.kind, info.label);

              const seat =
                ev.type === "ACTION" || ev.type === "SHOWDOWN_REVEAL"
                  ? ev.payload?.seat
                  : undefined;

              const posLabel = seat !== undefined ? positionMap[seat] : undefined;
              const fallbackName =
                seat !== undefined
                  ? config?.players?.find((p) => p.seat === seat)?.name ?? `P${seat}`
                  : undefined;
              const actorLabel = posLabel || fallbackName || null;
              const stack =
                seat !== undefined ? stackByCursor[evCursor]?.[seat] : undefined;
              const actionAmount =
                ev.type === "ACTION" ? ev.payload?.amount : undefined;
              const showActionAmount =
                typeof actionAmount === "number" &&
                actionAmount > 0 &&
                ["BET", "RAISE", "CALL", "ALL_IN"].includes(info.label);

              const handleMobileClick = () => {
                if (
                  (ev.type === "REVEAL_FLOP" ||
                    ev.type === "REVEAL_TURN" ||
                    ev.type === "REVEAL_RIVER") &&
                  onStreetEventClick
                ) {
                  onStreetEventClick(i, ev.type);
                } else {
                  setCursor(evCursor);
                }
              };

              return (
                <button
                  key={i}
                  ref={(el) => {
                    eventRowRefs.current[evCursor] = el;
                  }}
                  type="button"
                  onClick={handleMobileClick}
                  className={cn(
                    "shrink-0 rounded-md border px-2.5 py-1.5 text-left transition md:px-3.5 md:py-2",
                    "bg-card/90 hover:bg-muted/55",
                    isActive ? "border-primary bg-primary/10" : "border-border/70"
                  )}
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap text-[11px] md:text-[13px]">
                    {actorLabel ? (
                      <span className="font-black text-foreground">{actorLabel}</span>
                    ) : null}
                    {actorLabel && typeof stack === "number" ? (
                      <span className="font-semibold text-muted-foreground">
                        {toBBCompact(stack)}
                        {t("bbUnit")}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "rounded-sm px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tight md:px-2 md:text-[11px]",
                        badgeClass
                      )}
                    >
                      {displayLabel}
                    </span>
                    {showActionAmount ? (
                      <span className="font-bold text-foreground">
                        {toBBCompact(actionAmount)}
                        {t("bbUnit")}
                      </span>
                    ) : null}
                    {info.cards?.length ? (
                      <span className="max-w-[8rem] truncate text-[10px] text-muted-foreground">
                        {info.cards.join(" ")}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}

            {showCurrentActor && actingSeat !== null ? (
              <div
                className={cn(
                  "shrink-0 rounded-md border px-2.5 py-1.5 md:px-3.5 md:py-2",
                  "border-amber-500/45 bg-amber-500/12"
                )}
              >
                <div className="flex items-center gap-1.5 whitespace-nowrap text-[11px] md:text-[13px]">
                  {actingLabel ? (
                    <span className="font-black text-foreground">
                      {actingLabel}
                    </span>
                  ) : null}
                  {typeof actingStack === "number" ? (
                    <span className="font-semibold text-muted-foreground">
                      {toBBCompact(actingStack)}
                      {t("bbUnit")}
                    </span>
                  ) : null}
                  <span className="rounded-sm border border-amber-500/50 bg-amber-500/18 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tight text-amber-700 dark:text-amber-300 md:px-2 md:text-[11px]">
                    {t("actingNow")}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-0 flex flex-col min-[1024px]:w-[21rem] min-[1280px]:w-[23rem] min-[1024px]:shrink-0">
      {/* ✅ ScrollArea는 남은 공간을 꽉 채우고, 그 안에서만 스크롤 */}
      <div className="h-[40vh] lg:h-[72vh] min-[1024px]:h-[calc(100vh-235px)]">
        <ScrollArea
          type="always"
          className="h-full pr-1 [&_[data-slot=scroll-area-scrollbar]]:w-3 [&_[data-slot=scroll-area-thumb]]:bg-foreground/35 dark:[&_[data-slot=scroll-area-thumb]]:bg-foreground/45"
        >
          <div className="p-2 space-y-2">
            {events.map((ev, i) => {
              const evCursor = i + 1;
              const isActive = cursor === evCursor;

              const info = getEventLabel(ev);
              const badgeClass = getBadgeClass(info.kind, info.label);
              const displayLabel = getLabelText(info.label);

              const seat =
                ev.type === "ACTION" || ev.type === "SHOWDOWN_REVEAL"
                  ? ev.payload?.seat
                  : undefined;

              const amount =
                ev.type === "ACTION" ? ev.payload?.amount : undefined;

              const name =
                seat !== undefined
                  ? config?.players?.find((p) => p.seat === seat)?.name ??
                    `P${seat}`
                  : null;

              // 스트리트 이벤트 클릭 핸들러
              const handleClick = () => {
                if (
                  (ev.type === "REVEAL_FLOP" ||
                    ev.type === "REVEAL_TURN" ||
                    ev.type === "REVEAL_RIVER") &&
                  onStreetEventClick
                ) {
                  // 스트리트 이벤트는 보드 카드 수정 모달 열기
                  onStreetEventClick(i, ev.type);
                } else {
                  // 다른 이벤트는 cursor 변경
                  setCursor(evCursor);
                }
              };

              return (
                <div
                  key={i}
                  ref={(el) => {
                    eventRowRefs.current[evCursor] = el;
                  }}
                  onClick={handleClick}
                  className={cn(
                    "cursor-pointer rounded-md border-2 px-3 py-2 text-sm transition",
                    isActive
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/60 border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-slate-600 w-6 shrink-0">
                      {i.toString().padStart(2, "0")}
                    </span>

                    {name && (
                      <span className="font-bold truncate max-w-28 text-foreground">
                        {name}
                      </span>
                    )}

                    <span
                      className={cn(
                        "w-24 text-center text-[11px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter shrink-0",
                        badgeClass
                      )}
                    >
                      {displayLabel}
                    </span>

                    {info.cards?.length ? (
                      <span className="text-xs text-muted-foreground truncate">
                        {info.cards.join(" ")}
                      </span>
                    ) : null}

                    {typeof amount === "number" && (
                      <div className="ml-auto shrink-0 font-mono font-bold text-foreground text-xs">
                        {toBB(amount)}{" "}
                        <span className="text-[10px] text-muted-foreground ml-1 font-normal">
                          {t("bbUnit")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 현재 액팅중인 플레이어 표시 (이벤트 로그 하단) - 액션 레코딩 모드에서만 */}
            {showCurrentActor && currentActor !== null && (
              <div
                className={cn(
                  "rounded-md border-2 border-amber-500 bg-amber-500/10 px-3 py-2 text-sm"
                )}
              >
                <div className="flex items-center gap-3">
                  {currentActorPlayer && (
                    <span className="font-bold truncate max-w-28 text-foreground">
                      {currentActorPlayer.name}
                    </span>
                  )}

                  <span className="text-xs font-bold text-amber-500 shrink-0">
                    {t("actingNow")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

