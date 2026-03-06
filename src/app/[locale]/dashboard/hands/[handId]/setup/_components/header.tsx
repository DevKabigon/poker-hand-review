import { Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { MobileNavSheetButton } from "@/components/mobile-nav-sheet-button";

export function Header() {
  const t = useTranslations("handFlow.setup");

  return (
    <div className="mb-5 flex items-center justify-between gap-3 px-1 lg:mb-3">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
          <Settings2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
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
      <MobileNavSheetButton className="min-[900px]:hidden" />
    </div>
  );
}
