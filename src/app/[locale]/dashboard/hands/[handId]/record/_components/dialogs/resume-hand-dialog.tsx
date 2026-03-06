// src/app/hands/[handId]/new/(action-recording)/_components/resume-hand-dialog.tsx

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Play } from "lucide-react";
import { useTranslations } from "next-intl";

interface ResumeHandDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onResume: () => void;
  onNewHand: () => void;
}

export function ResumeHandDialog({
  isOpen,
  onOpenChange,
  onResume,
  onNewHand,
}: ResumeHandDialogProps) {
  const t = useTranslations("handFlow.record.resumeDialog");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            variant="super"
            onClick={onResume}
            className="h-auto w-full justify-start gap-3 py-4"
          >
            <Play className="w-4 h-4" />
            <div className="flex flex-col items-start">
              <span className="font-semibold">{t("continueTitle")}</span>
              <span className="text-xs text-white/85">
                {t("continueDescription")}
              </span>
            </div>
          </Button>
          <Button
            variant="primary"
            onClick={onNewHand}
            className="h-auto w-full justify-start gap-3 py-4"
          >
            <RotateCcw className="w-4 h-4" />
            <div className="flex flex-col items-start">
              <span className="font-semibold">{t("newHandTitle")}</span>
              <span className="text-xs text-white/85">
                {t("newHandDescription")}
              </span>
            </div>
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
