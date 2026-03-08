"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { BrandLogo } from "@/components/brand/brand-logo";
import { useTranslations } from "next-intl";
import { buildOAuthRedirectUrl } from "@/features/auth/lib/oauth";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isInitialized && user) {
      router.replace("/");
    }
  }, [isInitialized, user, router]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildOAuthRedirectUrl("/"),
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) {
        toast.error(t("toastLoginFailed"), { description: error.message });
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Google login error:", error);
      toast.error(t("toastUnexpectedError"), {
        description: t("toastUnexpectedErrorDesc"),
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-transparent px-4">
      <div className="z-10 w-full max-w-100 space-y-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {t("backToHome")}
        </Link>

        <Card className="rounded-3xl border-border/70 bg-card/75 shadow-(--shadow-soft) backdrop-blur-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mb-4 flex justify-center">
              <BrandLogo
                href=""
                className="pointer-events-none select-none"
                markClassName="h-10 w-10 rounded-xl shadow-lg"
                labelClassName="text-xl"
                priority
              />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t("title")}
            </CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            <Button
              variant="outline"
              type="button"
              className="h-11 w-full gap-2 rounded-lg"
              disabled={isLoading}
              onClick={handleGoogleLogin}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("signingIn")}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
