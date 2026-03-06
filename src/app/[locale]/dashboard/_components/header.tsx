"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StartNewHandButton } from "@/components/start-new-hand-button";
import { History, LayoutDashboard, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DefaultContainer } from "@/components/default-container";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTranslations } from "next-intl";

export function Header() {
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const router = useRouter();
  const { user, username, setAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await setAuth(null);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const displayName =
    username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    "";

  const userInitial =
    displayName.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border/70 bg-background/55 backdrop-blur-md">
      <DefaultContainer>
        <div className="flex h-16 items-center justify-between gap-2">
          {/* 왼쪽 섹션: 로고 및 배지 */}
          <div className="flex items-center gap-2 min-w-0">
            <BrandLogo
              className="group cursor-pointer"
              markClassName="transition-transform duration-200 group-hover:scale-105"
              labelClassName="text-lg md:text-xl"
            />

            {/* 모바일에서는 배지와 구분선 숨김 */}
            <div className="hidden sm:flex items-center shrink-0">
              <Separator orientation="vertical" className="h-5 mx-2" />
              <Badge
                variant="secondary"
                className="rounded-md border-none px-2 py-0.5 text-sm font-bold"
              >
                {tDashboard("badge")}
              </Badge>
            </div>
          </div>

          {/* 오른쪽 섹션: 액션 버튼 및 유저 메뉴 */}
          <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
            {/* StartNewHandButton 내부에서도 모바일 대응이 되어있다고 가정합니다. 
                텍스트가 너무 길면 이 버튼이 로고를 밀어낼 수 있습니다. */}
            <StartNewHandButton />

            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button className="relative h-8 w-8 overflow-hidden rounded-full border border-border/70 p-0 transition-all hover:bg-accent md:h-9 md:w-9">
                    <Avatar className="h-7 w-7 md:h-8 md:w-8">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt="User Avatar"
                      />
                      <AvatarFallback className="bg-secondary text-xs font-black text-foreground md:text-sm">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 md:w-60 mt-2 rounded-xl shadow-2xl border-slate-200 dark:border-slate-800"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal py-3">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-bold leading-none truncate">
                        {displayName || tDashboard("newPlayer")}
                      </p>
                      <p className="text-[11px] leading-none text-muted-foreground truncate italic">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard")}
                    className="cursor-pointer py-2 gap-3 rounded-lg focus:bg-slate-100 dark:focus:bg-slate-800"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span className="font-medium">{tCommon("dashboard")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      router.push("/dashboard/history");
                    }}
                    className="cursor-pointer py-2 gap-3 rounded-lg focus:bg-slate-100 dark:focus:bg-slate-800"
                  >
                    <History className="w-4 h-4 text-slate-500" />
                    <span className="font-medium">
                      {tCommon("handHistory")}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard/settings")}
                    className="cursor-pointer py-2 gap-3 rounded-lg focus:bg-slate-100 dark:focus:bg-slate-800"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span className="font-medium">{tCommon("settings")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                    className="cursor-pointer py-2 gap-3 rounded-lg focus:bg-slate-100 dark:focus:bg-slate-800"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-bold">{tCommon("logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Skeleton className="h-8 w-8 md:h-9 md:w-9 rounded-full" />
            )}
            <div className="hidden sm:block">
              <LocaleSwitcher />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </DefaultContainer>
    </header>
  );
}
