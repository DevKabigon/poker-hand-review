"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { LayoutDashboard, LogOut, History, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { supabase } from "@/lib/supabase/client";
import { StartNewHandButton } from "@/components/start-new-hand-button";
import { useHandEditorStore } from "@/features/hand/editor/handEditorStore";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function NavUserArea() {
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navUserArea");
  const router = useRouter();
  const pathname = usePathname();
  const { user, username, setAuth } = useAuthStore();
  const { events } = useHandEditorStore();

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

  const handleDashboardClick = () => {
    // 액션 레코딩 페이지에 있고 이벤트가 있으면 토스트 표시
    const isActionRecordingPage =
      pathname?.includes("/new") &&
      !pathname?.includes("/setup") &&
      !pathname?.includes("/players");
    const hasActions = events.length > 1; // POST_BLINDS를 제외한 실제 액션

    if (isActionRecordingPage && hasActions) {
      toast.success(tNav("saveProgressTitle"), {
        description: tNav("saveProgressDescription"),
      });
    }
    router.push("/");
  };

  const handleHistoryClick = () => {
    // 액션 레코딩 페이지에 있고 이벤트가 있으면 토스트 표시
    const isActionRecordingPage =
      pathname?.includes("/new") &&
      !pathname?.includes("/setup") &&
      !pathname?.includes("/players");
    const hasActions = events.length > 1; // POST_BLINDS를 제외한 실제 액션

    if (isActionRecordingPage && hasActions) {
      toast.success(tNav("saveProgressTitle"), {
        description: tNav("saveProgressDescription"),
      });
    }
    router.push("/history");
  };

  // 아바타에 표시할 이니셜
  const displayName =
    username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    "";

  const userInitial =
    displayName.charAt(0) ||
    user?.email?.charAt(0).toUpperCase() ||
    "U";

  // 세션 확인 전이나 로그아웃 상태일 때
  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <StartNewHandButton />
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/auth/login")}
          className="rounded-xl"
        >
          {tCommon("signIn")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* 유저 아바타 드롭다운 */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button className="relative h-9 w-9 overflow-hidden rounded-full border border-border/70 p-0 transition-all hover:bg-accent">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user.user_metadata?.avatar_url}
                alt="User Avatar"
              />
              <AvatarFallback className="bg-secondary text-sm font-black text-foreground">
                {userInitial}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="mt-2 w-60 rounded-xl border-border/70 shadow-[var(--shadow-soft)]"
          align="end"
          forceMount
        >
          <DropdownMenuLabel className="font-normal py-3">
            <div className="flex flex-col space-y-2">
              <p className="text-sm font-bold leading-none">
                {displayName || tNav("newPlayer")}
              </p>
              <p className="text-xs leading-none text-muted-foreground truncate italic">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleDashboardClick}
            className="cursor-pointer gap-3 rounded-lg py-2 focus:bg-accent"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-500" />
            <span className="font-medium">{tCommon("dashboard")}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleHistoryClick}
            className="cursor-pointer gap-3 rounded-lg py-2 focus:bg-accent"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span className="font-medium">{tCommon("handHistory")}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => router.push("/settings")}
            className="cursor-pointer gap-3 rounded-lg py-2 focus:bg-accent"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span className="font-medium">{tCommon("settings")}</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            variant="destructive"
            onClick={handleLogout}
            className="cursor-pointer gap-3 rounded-lg py-2 focus:bg-accent"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-bold">{tCommon("logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

