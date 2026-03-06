"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { DefaultContainer } from "@/components/default-container";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { updateProfileUsername } from "@/features/auth/usecases/updateProfileUsername";

function getFallbackUsername(email: string | null | undefined): string {
  if (!email) return "";
  return email.split("@")[0] ?? "";
}

export default function DashboardSettingsPage() {
  const t = useTranslations("settings");
  const router = useRouter();
  const { user, username, isLoading, setUsername } = useAuthStore();

  const initialUsername = useMemo(() => {
    if (username) return username;
    if (user?.user_metadata?.full_name) {
      return String(user.user_metadata.full_name);
    }
    return getFallbackUsername(user?.email);
  }, [username, user?.email, user?.user_metadata?.full_name]);

  const [inputValue, setInputValue] = useState(initialUsername);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInputValue(initialUsername);
  }, [initialUsername]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/auth/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <main className="flex flex-1 flex-col py-8">
        <DefaultContainer>
          <Card className="mx-auto max-w-2xl rounded-2xl border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-28 animate-pulse rounded-xl bg-card/70" />
            </CardContent>
          </Card>
        </DefaultContainer>
      </main>
    );
  }

  const normalizedInput = inputValue.trim();
  const canSave = normalizedInput.length > 0 && normalizedInput !== initialUsername;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    const result = await updateProfileUsername(user.id, inputValue);

    if (!result.ok) {
      const descriptionByReason: Record<string, string> = {
        required: t("errors.required"),
        tooShort: t("errors.tooShort"),
        tooLong: t("errors.tooLong"),
        unknown: t("errors.unknown"),
      };
      toast.error(t("toastSaveFailed"), {
        description: descriptionByReason[result.reason] ?? t("errors.unknown"),
      });
      setIsSaving(false);
      return;
    }

    setUsername(result.username);
    setInputValue(result.username);
    toast.success(t("toastSaveSuccess"), {
      description: t("toastSaveSuccessDesc"),
    });
    setIsSaving(false);
  };

  return (
    <main className="flex flex-1 flex-col py-8">
      <DefaultContainer>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <Button asChild variant="ghost" className="w-fit px-2">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToDashboard")}
            </Link>
          </Button>

          <Card className="rounded-2xl border-border/70 bg-card/75">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl">{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="settings-email">{t("emailLabel")}</Label>
                  <Input
                    id="settings-email"
                    value={user.email ?? ""}
                    readOnly
                    disabled
                    className="h-11 rounded-xl"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="settings-username">{t("usernameLabel")}</Label>
                  <Input
                    id="settings-username"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder={t("usernamePlaceholder")}
                    minLength={2}
                    maxLength={24}
                    className="h-11 rounded-xl"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">{t("usernameHint")}</p>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    type="submit"
                    className="min-w-36 rounded-xl"
                    disabled={!canSave || isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("saving")}
                      </>
                    ) : (
                      t("save")
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DefaultContainer>
    </main>
  );
}
