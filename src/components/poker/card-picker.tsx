"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { getCardImage } from "@/features/hand/ui/assets";
import { Card, RANKS, SUITS } from "@/features/hand/domain/cards";
import { PlayerConfig } from "@/features/hand/domain/handConfig";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface CardPickerProps {
  // 핸드 선택: [Card | null, Card | null] 튜플
  // 보드 선택: Card[] 배열
  // 둘 다 지원하기 위해 유니온 타입 사용
  selectedCards: PlayerConfig["holdCards"] | Card[];
  // 부모의 상태 업데이트 함수 (string[]을 받도록 유지)
  onChange: (cards: string[] | null) => void;
  deadCards?: string[];
  maxCards?: number;
  className?: string;
}

export const CardPicker = ({
  selectedCards,
  onChange,
  deadCards = [],
  maxCards = 2,
  className,
}: CardPickerProps) => {
  const t = useTranslations("handFlow.cardPicker");
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // ✅ 핵심: 튜플 또는 배열에서 null을 제거하고 일반 Card[] 배열로 변환하여 로직 처리
  // 튜플 [Card | null, Card | null]과 Card[] 배열 모두 처리
  const normalizeToArray = (
    cards: PlayerConfig["holdCards"] | Card[]
  ): (Card | null)[] => {
    if (!cards) return [];
    // 튜플과 배열 모두 배열이므로 스프레드 연산자로 변환
    return [...cards];
  };

  const currentSelection = normalizeToArray(selectedCards).filter(
    (c): c is Card => c !== null
  );

  const handleCardClick = (card: string) => {
    if (deadCards.includes(card)) return;

    // 카드가 이미 선택되어 있다면 제거
    if (currentSelection.includes(card as Card)) {
      const newSelection = currentSelection.filter((c) => c !== card);
      onChange(newSelection.length > 0 ? newSelection : null);
      return;
    }

    // 새 카드 추가 (최대 개수 제한 로직)
    const newSelection =
      currentSelection.length >= maxCards
        ? [...currentSelection.slice(1), card as Card]
        : [...currentSelection, card as Card];

    onChange(newSelection);
  };

  useEffect(() => {
    if (loadedCount >= 52) {
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loadedCount]);

  return (
    <div
      className={cn(
        "relative w-full max-w-sm space-y-4 select-none sm:max-w-md sm:space-y-6",
        className,
      )}
    >
      {!isReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-3xl">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="mt-2 text-xs font-bold text-muted-foreground animate-pulse">
            {t("preparing")}
          </p>
        </div>
      )}

      {/* 1. Preview Area */}
      <div className="flex items-center justify-between bg-muted/30 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border/50 min-h-16 sm:min-h-22">
        <div className="flex gap-2 sm:gap-3 items-center">
          {currentSelection.length === 0 ? (
            <div className="flex items-center gap-2 px-1 text-muted-foreground/50 italic">
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">
                {t("selectCards", { count: maxCards })}
              </span>
            </div>
          ) : (
            <div className="flex gap-2">
              {currentSelection.map((card) => (
                <div
                  key={card}
                  className="relative group animate-in zoom-in-95 duration-200"
                  onClick={() => handleCardClick(card)}
                >
                  <div className="h-12 w-9 sm:h-14 sm:w-10.5 rounded-md border border-white/10 overflow-hidden shadow-lg cursor-pointer">
                    <Image
                      src={getCardImage(card)}
                      alt={card}
                      width={42}
                      height={56}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5 z-20">
                    <X className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              ))}
              {/* 빈 슬롯 표시 */}
              {Array.from({ length: maxCards - currentSelection.length }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="h-12 w-9 sm:h-14 sm:w-10.5 border-2 border-dashed border-muted-foreground/20 rounded-md bg-muted/10"
                  />
                )
              )}
            </div>
          )}
        </div>
        {currentSelection.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-bold hover:text-destructive"
            onClick={() => onChange(null)}
          >
            {t("reset")}
          </Button>
        )}
      </div>

      {/* 2. Grid Area */}
      <div
        className={cn(
          "flex flex-col gap-1 sm:gap-1.5 transition-all duration-500",
          isReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        {SUITS.map((suit) => (
          <div key={suit} className="flex justify-between gap-1">
            {RANKS.map((rank) => {
              const card = `${rank}${suit}`;
              const isSelected = currentSelection.includes(card as Card);
              const isDead = deadCards.includes(card) && !isSelected;

              return (
                <button
                  key={card}
                  type="button"
                  disabled={isDead}
                  onClick={() => handleCardClick(card)}
                  className={cn(
                    "relative w-[7.2%] aspect-2/3 rounded-[3px] sm:rounded-md transition-all border",
                    "bg-background border-border/40 hover:border-primary/50",
                    isSelected &&
                      "border-primary ring-2 ring-primary/30 z-10 scale-110 shadow-xl brightness-110",
                    isDead && "opacity-5 grayscale pointer-events-none"
                  )}
                >
                  <Image
                    src={getCardImage(card)}
                    alt={card}
                    fill
                    unoptimized
                    sizes="48px"
                    className="rounded-sm object-cover"
                    onLoad={() => setLoadedCount((prev) => prev + 1)}
                  />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-1 opacity-40">
        <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tighter">
          {t("deckMatrix")}
        </span>
        <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-tighter">
          {t("blockedCount", { count: deadCards.length })}
        </span>
      </div>
    </div>
  );
};
