import { useTranslations } from "next-intl";

export function StepIndicator() {
  const t = useTranslations("handFlow.setup");

  return (
    <div className="mt-6 mb-3 flex flex-col items-center gap-2 lg:mt-4 lg:mb-1">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">
        {t("stepProgress", { current: 1, total: 3 })}
      </p>
      <div
        className="flex justify-center gap-1.5"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={3}
        aria-valuenow={1}
        aria-label={t("stepProgress", { current: 1, total: 3 })}
      >
        <div className="h-1 w-6 rounded-full bg-primary shadow-[0_0_8px_rgba(0,0,0,0.15)] dark:shadow-[0_0_8px_rgba(24,203,139,0.35)]" />
        <div className="h-1 w-4 rounded-full bg-muted" />
        <div className="h-1 w-4 rounded-full bg-muted" />
      </div>
    </div>
  );
}

