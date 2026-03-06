"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Crown, User, Wallet, ShieldCheck, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlayerConfig } from "@/features/hand/domain/handConfig";
import { CardPicker } from "./card-picker";
import { getCardImage } from "@/features/hand/ui/assets";
import { Card } from "@/features/hand/domain/cards";
import { Separator } from "../ui/separator";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface PlayerDetailDialogProps {
  player: PlayerConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (seat: number, data: Partial<PlayerConfig>) => void;
  bbUnit: number;
  allPlayers: PlayerConfig[];
  blockedCards?: Card[];
}

export const PlayerDetailDialog = ({
  player,
  isOpen,
  onClose,
  onUpdate,
  bbUnit,
  allPlayers,
  blockedCards = [],
}: PlayerDetailDialogProps) => {
  const t = useTranslations("handFlow.playerDialog");

  if (!player) return null;

  const deadCards = Array.from(
    new Set([
      ...allPlayers
        .filter((p) => p.seat !== player.seat)
        .flatMap((p) => p.holdCards || [])
        .filter((card): card is Card => !!card),
      ...blockedCards,
    ])
  );

  const sanitizePlayerName = (name: string): string => {
    const maxLength = 12;
    const trimmed = name.trim().slice(0, maxLength);
    return trimmed;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* sm:max-w-100 -> max-w-[92vw] 로 변경하여 모바일 양옆 여백 확보 */}
      <DialogContent className="max-w-[92vw] sm:max-w-100 rounded-[2rem] sm:rounded-[2.5rem] border-border bg-popover backdrop-blur-xl shadow-2xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 sm:gap-4">
            <div
              className={cn(
                "p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-inner",
                player.isHero
                  ? "bg-primary/20 text-primary"
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              {player.isHero ? (
                <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-lg sm:text-xl font-bold tracking-tight">
                {player.isHero ? t("heroSettings") : t("playerSettings")}
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">
                {t("seatLabel", { seat: player.seat + 1 })}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 sm:gap-8 py-4 sm:py-6">
          {/* 1. 핸드 선택 영역 */}
          <div className="space-y-2 sm:space-y-3 text-center">
            <Label className="text-xs sm:text-sm font-bold text-muted-foreground">
              {t("holeCards")}
            </Label>

            <Popover>
              <PopoverTrigger asChild>
                <div className="flex justify-center gap-1 cursor-pointer group">
                  {[0, 1].map((idx) => {
                    const card = player.holdCards?.[idx];
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "w-14 h-20 sm:w-16 sm:h-22 rounded-xl border-2 flex items-center justify-center transition-all group-hover:border-primary/40",
                          card
                            ? "border-border bg-card"
                            : "border-dashed border-border bg-muted/50"
                        )}
                      >
                        {card ? (
                          <Image
                            src={getCardImage(card)}
                            alt={card}
                            width={64}
                            height={88}
                            unoptimized
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          <Plus className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-[22rem] max-w-[calc(100vw-1.5rem)] sm:w-[36rem] sm:max-w-[calc(100vw-2rem)] p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] bg-popover border-border shadow-3xl backdrop-blur-2xl"
                side="top"
                align="center"
              >
                <CardPicker
                  selectedCards={player.holdCards || []}
                  onChange={(cards) =>
                    onUpdate(player.seat, { holdCards: cards as [Card, Card] })
                  }
                  deadCards={deadCards}
                  maxCards={2}
                  className="w-full max-w-none sm:max-w-none"
                />
              </PopoverContent>
            </Popover>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground">
              {t("tapToSelect")}
            </p>
          </div>

          <Separator className="bg-border" />

          {/* 2. 입력 영역 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] sm:text-xs font-bold text-muted-foreground ml-1 uppercase">
                {t("nickname")}
              </Label>
              <Input
                value={player.name}
                onChange={(e) => {
                  const sanitized = sanitizePlayerName(e.target.value);
                  onUpdate(player.seat, { name: sanitized });
                }}
                className="h-10 sm:h-12 rounded-xl border-border bg-background/50 font-medium text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] sm:text-xs font-bold text-muted-foreground ml-1 uppercase">
                {t("stack")}
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={player.stack}
                  onChange={(e) =>
                    onUpdate(player.seat, {
                      stack: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="h-10 sm:h-12 rounded-xl border-border bg-background/50 text-primary font-bold pl-8 sm:pl-9 text-sm"
                />
                <Wallet className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] sm:text-[10px] font-black text-primary/60">
                  {(player.stack / bbUnit).toFixed(0)}BB
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          {!player.isHero && (
            <Button
              variant="super"
              className="w-full sm:flex-1 h-10 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-sm"
              onClick={() => onUpdate(player.seat, { isHero: true })}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              {t("setAsHero")}
            </Button>
          )}
          <Button
            variant="primary"
            className="w-full sm:flex-1 h-10 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-xl shadow-primary/20"
            onClick={onClose}
          >
            {t("done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
