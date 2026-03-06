"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CardPicker } from "@/components/poker/card-picker";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { getCardImage } from "@/features/hand/ui/assets";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";
import Image from "next/image";
import { Card } from "@/features/hand/domain/cards";
import { PlayerConfig } from "@/features/hand/domain/handConfig";
import { useTranslations } from "next-intl";

interface BoardSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void; // 모달 닫기 (스킵으로 처리)
  onConfirm: (cards: Card[]) => void;
  onSkip?: () => void; // 보드 카드 없이 진행 (onClose와 동일하게 처리)
  nextStreet: "FLOP" | "TURN" | "RIVER";
  board: Card[];
  players: PlayerConfig[];
  // 수정 모드일 때 이후 스트리트 이벤트에서 사용된 카드 (플랍 수정 시 턴/리버 카드 제외용)
  futureStreetCards?: Card[];
  // 수정 모드일 때 현재 스트리트의 카드 (미리 선택되어야 함)
  currentStreetCards?: Card[];
}

export function BoardSelectionDialog({
  isOpen,
  onClose,
  onConfirm,
  onSkip,
  nextStreet,
  board,
  players,
  futureStreetCards = [],
  currentStreetCards = [],
}: BoardSelectionDialogProps) {
  const t = useTranslations("handFlow.record.boardDialog");
  const [tempSelection, setTempSelection] = useState<Card[]>([]);
  const streetLabel =
    nextStreet === "FLOP"
      ? t("streetFlop")
      : nextStreet === "TURN"
      ? t("streetTurn")
      : t("streetRiver");

  // 현재 보드 상태에 따라 필요한 카드 계산
  // 턴/리버 모달에서는 누락된 모든 카드를 한 번에 선택 가능
  // 리버에서 5장 모두 수정 가능하도록 지원
  const getRequiredCards = () => {
    switch (nextStreet) {
      case "FLOP":
        // 플랍만 필요 (3장)
        return { flop: 3, turn: 0, river: 0, total: 3 };
      case "TURN":
        // 플랍이 없으면 플랍 3장 + 턴 1장 필요
        if (board.length === 0) {
          return { flop: 3, turn: 1, river: 0, total: 4 };
        }
        // 플랍이 있으면 턴 1장만 필요
        return { flop: 0, turn: 1, river: 0, total: 1 };
      case "RIVER":
        // 리버에서 5장 모두 수정 가능
        if (board.length === 5) {
          // 이미 5장이 있으면 전체 수정 가능
          return { flop: 3, turn: 1, river: 1, total: 5 };
        }
        // 플랍 없음: 플랍 3장 + 턴 1장 + 리버 1장
        if (board.length === 0) {
          return { flop: 3, turn: 1, river: 1, total: 5 };
        }
        // 플랍만 있음: 턴 1장 + 리버 1장
        if (board.length === 3) {
          return { flop: 0, turn: 1, river: 1, total: 2 };
        }
        // 플랍 + 턴 있음: 리버 1장만
        if (board.length === 4) {
          return { flop: 0, turn: 0, river: 1, total: 1 };
        }
        return { flop: 0, turn: 0, river: 0, total: 0 };
      default:
        return { flop: 0, turn: 0, river: 0, total: 0 };
    }
  };

  const required = getRequiredCards();
  const targetTotal = nextStreet === "FLOP" ? 3 : nextStreet === "TURN" ? 4 : 5;
  const requiredCount = required.total;

  const deadCards = [
    ...players.flatMap((p) => p.holdCards.filter((c): c is Card => c !== null)),
    ...board,
    ...futureStreetCards, // 수정 모드일 때 이후 스트리트 이벤트에서 사용된 카드
  ];

  const handleConfirm = () => {
    if (tempSelection.length === requiredCount) {
      // 선택한 카드와 필요한 카드 정보를 함께 전달
      onConfirm(tempSelection);
      onClose();
    }
  };

  // 필요한 카드가 없으면 모달을 표시하지 않음
  if (requiredCount === 0) return null;

  // CardPicker는 이제 Card[] 배열을 직접 받을 수 있음
  // 보드 카드 선택을 위해 배열을 직접 전달
  const handleCardPickerChange = (cards: string[] | null) => {
    if (!cards) {
      setTempSelection([]);
      return;
    }
    // 필요한 카드 수만큼만 선택 (CardPicker는 maxCards 제한을 내부에서 처리)
    const selected = cards.slice(0, requiredCount) as Card[];
    setTempSelection(selected);
  };

  // 모달 닫기 핸들러 (X 클릭 또는 외부 클릭 시 스킵으로 처리)
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // 모달이 닫힐 때만 스킵 처리
      if (onSkip) {
        onSkip();
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg rounded-[2rem] border-white/10 bg-card/90 backdrop-blur-xl shadow-2xl p-4 sm:p-6 overflow-hidden"
        onOpenAutoFocus={() => {
          setTempSelection(
            currentStreetCards.length > 0 ? [...currentStreetCards] : []
          );
        }}
      >
        {/* 헤더 */}
        <DialogHeader className="flex flex-row items-center gap-3 space-y-0 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Layers className="w-4 h-4" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-black tracking-tighter uppercase">
            {t("title", { street: streetLabel })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5">
          {/* 보드 미리보기 */}
          <div className="relative p-3 sm:p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col items-center">
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
              {Array.from({ length: 5 }).map((_, index) => {
                let cardSrc: Card | null = null;
                let isTemp = false;
                const isTargetSlot = index < targetTotal;

                if (index < board.length) {
                  cardSrc = board[index];
                } else {
                  const tempIndex = index - board.length;
                  if (tempIndex < tempSelection.length) {
                    cardSrc = tempSelection[tempIndex];
                    isTemp = true;
                  }
                }

                const showGap = index === 2 || index === 3;

                return (
                  <div key={index}>
                    <div
                      className={cn(
                        "relative transition-all",
                        !isTargetSlot && "opacity-10 grayscale scale-90"
                      )}
                    >
                      {cardSrc ? (
                        <div className="relative group">
                          {isTemp && (
                            <div className="absolute inset-0 bg-primary/40 blur-sm rounded-md animate-pulse z-0" />
                          )}
                          <div
                            className={cn(
                              "relative z-10 overflow-hidden rounded-md border transition-all duration-200",
                              "h-16 w-12 sm:h-18 sm:w-13.5 md:h-20 md:w-15",
                              isTemp
                                ? "border-primary scale-105"
                                : "border-white/10"
                            )}
                          >
                            <Image
                              src={getCardImage(cardSrc)}
                              alt={cardSrc}
                              width={60}
                              height={80}
                              priority
                              unoptimized
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "h-16 sm:h-18 md:h-20 w-11 sm:w-12.5 md:w-14 border-2 border-dashed rounded-md flex items-center justify-center",
                            isTargetSlot
                              ? "border-primary/20 bg-primary/5"
                              : "border-white/5"
                          )}
                        >
                        <span className="text-[8px] text-muted-foreground font-black opacity-30">
                          {index < 3
                              ? t("streetFlop")
                              : index === 3
                              ? t("streetTurn")
                              : t("streetRiver")}
                        </span>
                      </div>
                    )}
                    </div>
                    {showGap && <div className="w-1 sm:w-1.5 md:w-2" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 카드 선택기 영역 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                  {t("selectPrefix")} <span className="text-primary">{requiredCount}</span>{" "}
                  {t("selectSuffix")}
                </Label>
                {required.flop > 0 && (
                  <span className="text-[9px] text-muted-foreground/70">
                    {t("flopCount", { count: required.flop })}
                    {required.turn > 0 || required.river > 0 ? " + " : ""}
                    {required.turn > 0 && t("turnCount", { count: required.turn })}
                    {required.turn > 0 && required.river > 0 ? " + " : ""}
                    {required.river > 0 && t("riverCount", { count: required.river })}
                  </span>
                )}
                {required.flop === 0 && required.turn > 0 && (
                  <span className="text-[9px] text-muted-foreground/70">
                    {t("turnCount", { count: required.turn })}
                    {required.river > 0
                      ? ` + ${t("riverCount", { count: required.river })}`
                      : ""}
                  </span>
                )}
                {required.flop === 0 &&
                  required.turn === 0 &&
                  required.river > 0 && (
                    <span className="text-[9px] text-muted-foreground/70">
                      {t("riverCount", { count: required.river })}
                    </span>
                  )}
              </div>
              <Badge
                variant="outline"
                className="text-[9px] border-white/10 bg-white/5 font-bold"
              >
                {tempSelection.length} / {requiredCount}
              </Badge>
            </div>

            <div className="p-2 rounded-2xl bg-black/10 border border-white/5">
              <CardPicker
                selectedCards={tempSelection}
                onChange={handleCardPickerChange}
                deadCards={deadCards}
                maxCards={requiredCount}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 sm:mt-6 flex gap-2">
          {onSkip && (
            <Button
              onClick={() => {
                onSkip();
                onClose();
              }}
              variant="outline"
              className="flex-1 h-11 sm:h-12 rounded-xl font-black text-sm sm:text-md transition-all active:scale-95 border-border"
            >
              {t("skip")}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={tempSelection.length !== requiredCount}
            className={cn(
              "flex-1 h-11 sm:h-12 rounded-xl font-black text-sm sm:text-md transition-all active:scale-95",
              tempSelection.length === requiredCount
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-muted text-muted-foreground opacity-40"
            )}
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
