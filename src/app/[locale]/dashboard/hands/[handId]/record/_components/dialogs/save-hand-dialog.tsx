// src/app/hands/[handId]/new/(action-recording)/_components/save-hand-dialog.tsx

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";

interface SaveHandDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (title: string, tags: string[]) => void;
  isSaving: boolean;
}

export function SaveHandDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isSaving,
}: SaveHandDialogProps) {
  const t = useTranslations("handFlow.record.saveDialog");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");

  const handleConfirm = () => {
    const tagsArray = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    onConfirm(title.trim(), tagsArray);
    setTitle("");
    setTags("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setTitle("");
    setTags("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="save-title">{t("titleLabel")}</Label>
            <Input
              id="save-title"
              placeholder={t("titlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="save-tags">{t("tagsLabel")}</Label>
            <Input
              id="save-tags"
              placeholder={t("tagsPlaceholder")}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              {t("tagsHelp")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            {t("cancel")}
          </Button>
          <Button variant="default" onClick={handleConfirm} disabled={isSaving}>
            {isSaving ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
