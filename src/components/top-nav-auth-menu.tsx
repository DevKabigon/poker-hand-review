"use client";

import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { History, LogIn, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

type TopNavAuthMenuProps = {
  showHistoryShortcut?: boolean;
};

export function TopNavAuthMenu({
  showHistoryShortcut = true,
}: TopNavAuthMenuProps) {
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const { user, username, isLoading, setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await setAuth(null);
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  if (!user) {
    return (
      <Button asChild variant="ghost" size="sm" className="rounded-xl">
        <Link href="/auth/login">
          <LogIn className="mr-1.5 h-4 w-4" />
          {tCommon("login")}
        </Link>
      </Button>
    );
  }

  const displayName =
    username ||
    user.user_metadata?.full_name ||
    user.user_metadata?.display_name ||
    "";
  const userInitial =
    displayName.charAt(0) || user.email?.charAt(0).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative h-9 w-9 overflow-hidden rounded-full border border-border/70 p-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt="User Avatar" />
            <AvatarFallback className="bg-secondary text-sm font-black text-foreground">
              {userInitial}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="mt-2 w-60 rounded-xl" forceMount>
        <DropdownMenuLabel className="py-3 font-normal">
          <div className="flex flex-col space-y-2">
            <p className="truncate text-sm font-bold leading-none">
              {displayName || tDashboard("newPlayer")}
            </p>
            <p className="truncate text-[11px] italic leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {showHistoryShortcut ? (
          <DropdownMenuItem
            onClick={() => router.push("/history")}
            className="cursor-pointer gap-3 py-2"
          >
            <History className="h-4 w-4 text-muted-foreground" />
            <span>{tCommon("handHistory")}</span>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem
          onClick={() => router.push("/settings")}
          className="cursor-pointer gap-3 py-2"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span>{tCommon("settings")}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="destructive"
          onClick={handleLogout}
          className="cursor-pointer gap-3 py-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="font-semibold">{tCommon("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
