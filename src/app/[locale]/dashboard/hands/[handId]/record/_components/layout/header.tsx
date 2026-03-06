// src/app/hands/[handId]/new/(action-recording)/_components/header.tsx

import { ChevronLeft, RotateCcw, RotateCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Street } from "@/features/hand/engine/reducer";
import { useTranslations } from "next-intl";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  street: Street;
  onBackClick: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSaveClick: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canSave: boolean;
  isSaving: boolean;
}

export function ActionRecordingHeader({
  street,
  onBackClick,
  onUndo,
  onRedo,
  onSaveClick,
  canUndo,
  canRedo,
  canSave,
  isSaving,
}: HeaderProps) {
  const t = useTranslations("handFlow.record");

  return (
    <header className="mb-2 flex items-center justify-between gap-2 md:mb-3">
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <SidebarTrigger className="h-8 w-8 rounded-xl border border-border/65 bg-card/75 md:hidden" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onBackClick}
          className="h-8 w-8 rounded-full md:h-9 md:w-9"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight md:text-lg">
            {t("title")}
          </h1>
          <Badge
            variant="outline"
            className="mt-1 h-5 px-1.5 text-[10px] font-semibold capitalize md:text-xs"
          >
            {street}
          </Badge>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-8 px-2 text-xs md:h-9 md:px-2.5"
        >
          <RotateCcw className="h-3.5 w-3.5 md:mr-1.5 md:h-4 md:w-4" />
          <span className="hidden md:inline">{t("undo")}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="h-8 px-2 text-xs md:h-9 md:px-2.5"
        >
          <RotateCw className="h-3.5 w-3.5 md:mr-1.5 md:h-4 md:w-4" />
          <span className="hidden md:inline">{t("redo")}</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onSaveClick}
          disabled={!canSave || isSaving}
          className="h-8 px-2 text-xs md:h-9 md:px-2.5"
        >
          <Save className="h-3.5 w-3.5 md:mr-1.5 md:h-4 md:w-4" />
          <span className="hidden md:inline">
            {isSaving ? t("saving") : t("saveHand")}
          </span>
        </Button>
      </div>
    </header>
  );
}
