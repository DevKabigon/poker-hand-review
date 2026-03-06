"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useTranslations } from "next-intl";
import { DefaultContainer } from "@/components/default-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHandEditorStore } from "@/features/hand/editor/handEditorStore";

export default function DashboardHandPage() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const config = useHandEditorStore((s) => s.config);
  const eventsCount = useHandEditorStore((s) => s.events.length);
  const [isHandStoreHydrated, setIsHandStoreHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useHandEditorStore.persist;
    const handleHydrated = () => setIsHandStoreHydrated(true);

    if (persistApi.hasHydrated()) {
      handleHydrated();
    }

    const unsubscribe = persistApi.onFinishHydration(handleHydrated);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isHandStoreHydrated) return;

    const hasActiveSession = !!config || eventsCount > 0;

    // 활성 세션이 없으면 이전 handId를 재사용하지 않고 새로 생성
    let handId = hasActiveSession
      ? sessionStorage.getItem("currentHandId")
      : null;

    if (!handId) {
      handId = nanoid(10);
      sessionStorage.setItem("currentHandId", handId);
    }

    const targetPath = !config
      ? `/hands/${handId}/setup`
      : eventsCount > 0
      ? `/hands/${handId}/record`
      : `/hands/${handId}/players`;

    router.replace(targetPath);
  }, [config, eventsCount, isHandStoreHydrated, router]);

  return (
    <main className="flex flex-1 items-center py-8">
      <DefaultContainer className="w-full max-w-2xl">
        <Card className="rounded-3xl border-border/70 bg-card/75 shadow-[var(--shadow-soft)]">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t("handRoutingTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </DefaultContainer>
    </main>
  );
}
