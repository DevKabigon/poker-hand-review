"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import {
  Sun,
  Moon,
  LogOut,
  LogIn,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function MainHeader() {
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { user, username, isLoading, setAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();

  // 로그아웃 로직
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
    displayName.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    "U";
  const userName = displayName || "User";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        {/* 로고 섹션 */}
        <BrandLogo
          className="group cursor-pointer"
          markClassName="h-9 w-9 transition-transform duration-200 group-hover:scale-105"
          labelClassName="text-xl"
        />

        {/* 우측 메뉴 섹션 */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>

          {/* 테마 스위처 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full w-9 h-9"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{tCommon("themeToggle")}</span>
          </Button>

          {/* 인증 상태에 따른 버튼 렌더링 */}
          {!isLoading &&
            (user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0"
                  >
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt="Profile"
                      />
                    <AvatarFallback className="bg-secondary text-foreground">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {userName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/hand")}
                    className="cursor-pointer"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>{tCommon("dashboard")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/settings")}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{tCommon("settings")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{tCommon("logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="primary"
                onClick={() => router.push("/auth/login")}
                className="h-9 px-4 font-semibold shadow-sm"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {tCommon("login")}
              </Button>
            ))}
        </div>
      </nav>
    </header>
  );
}
