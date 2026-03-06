"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { DefaultContainer } from "@/components/default-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Main } from "./_components/main";

export default function DashboardPage() {
  const tDashboard = useTranslations("dashboard");
  const { user, isLoading, isInitialized } = useAuthStore();

  if (isLoading || !isInitialized) {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-xl rounded-3xl border-border/70 bg-card/75">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-1 flex-col py-8">
        <DefaultContainer className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-xl rounded-3xl border-border/70 bg-card/75">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl tracking-tight">{tDashboard("gateTitle")}</CardTitle>
              <CardDescription className="text-base">{tDashboard("gateDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="primary" className="flex-1">
                <Link href="/auth/login">{tDashboard("gateLogin")}</Link>
              </Button>
            </CardContent>
          </Card>
        </DefaultContainer>
      </main>
    );
  }

  return <Main />;
}
