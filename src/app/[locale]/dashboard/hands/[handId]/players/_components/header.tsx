"use client";

import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MobileNavSheetButton } from "@/components/mobile-nav-sheet-button";

export function Header() {
  const t = useTranslations("handFlow.players");
  const tSetup = useTranslations("handFlow.setup");
  const params = useParams();
  const router = useRouter();
  const handId = params.handId as string;

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 px-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden rounded-xl min-[900px]:inline-flex"
          onClick={() => router.push(`/hands/${handId}/setup`)}
        >
          {tSetup("title")}
        </Button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 md:h-11 md:w-11">
          <Users className="h-5 w-5 text-primary md:h-6 md:w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            {t("title")}
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            {t("description")}
          </p>
        </div>
      </div>

      <div className="mt-0.5 flex items-center gap-2">
        <MobileNavSheetButton className="min-[900px]:hidden" />
      </div>
    </div>
  );
}

