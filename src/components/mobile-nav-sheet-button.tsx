"use client";

import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, LogIn, LogOut, Menu, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand/brand-logo";

type MobileNavSheetButtonProps = {
  className?: string;
};

export function MobileNavSheetButton({ className }: MobileNavSheetButtonProps) {
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const tTools = useTranslations("toolsHub");
  const pathname = usePathname();
  const router = useRouter();
  const { user, username, isLoading, setAuth } = useAuthStore();
  const [open, setOpen] = useState(false);

  const navItems = [
    {
      href: "/hand",
      label: tCommon("handReview"),
      isActive: pathname.startsWith("/hand") || pathname.startsWith("/hands"),
    },
    {
      href: "/tools/outs",
      label: tTools("outsTitle"),
      isActive: pathname.startsWith("/tools/outs"),
    },
    {
      href: "/tools/odds",
      label: tTools("oddsTitle"),
      isActive: pathname.startsWith("/tools/odds"),
    },
    {
      href: "/tools/insurance",
      label: tTools("insuranceTitle"),
      isActive: pathname.startsWith("/tools/insurance"),
    },
    ...(user
      ? [
          {
            href: "/history",
            label: tCommon("handHistory"),
            isActive: pathname.startsWith("/history"),
          },
        ]
      : []),
  ];

  const displayName =
    username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    "";
  const userInitial =
    displayName.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await setAuth(null);
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 rounded-xl border border-border/65 bg-card/85",
            className,
          )}
          aria-label="메뉴 열기"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        hideCloseButton
        className="w-[86vw] max-w-sm border-border/70 bg-card/98 pt-4"
      >
        <SheetHeader className="pb-3">
          <div className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-border/70 bg-background/65 px-3 py-2.5">
            <div className="pointer-events-none absolute -right-6 -top-10 h-20 w-20 rounded-full bg-primary/18 blur-2xl" />
            <div className="pointer-events-none absolute -left-8 -bottom-10 h-24 w-24 rounded-full bg-chart-2/15 blur-2xl" />

            <div className="relative z-10 flex items-center gap-2.5">
              <SheetClose asChild>
                <BrandLogo
                  href="/"
                  className="cursor-pointer"
                  markClassName="h-8 w-8"
                  labelClassName="text-base leading-none"
                />
              </SheetClose>
              <SheetTitle className="sr-only">PokerHandReview 메뉴</SheetTitle>
              <SheetDescription className="sr-only">
                모바일 메뉴에서 페이지 이동과 설정을 사용할 수 있습니다.
              </SheetDescription>
            </div>

            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative z-10 h-8 w-8 rounded-lg border border-border/60 bg-card/85"
                aria-label="메뉴 닫기"
              >
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="space-y-1.5 px-4">
          {navItems.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-11 w-full items-center justify-between rounded-xl border px-3 text-[13px] font-semibold transition-colors",
                  item.isActive
                    ? "border-primary/45 bg-primary/12 text-primary"
                    : "border-border/70 bg-background/65 text-foreground hover:bg-muted/50",
                )}
              >
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4 opacity-75" />
              </Link>
            </SheetClose>
          ))}
        </div>

        <div className="mt-3 space-y-3 border-t border-border/70 px-4 pt-4">
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/65 px-2 py-1">
            <span className="pl-1 text-xs font-semibold text-muted-foreground">
              {tCommon("settings")}
            </span>
            <div className="flex items-center gap-1">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : user ? (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/65 px-3 py-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt="User Avatar" />
                  <AvatarFallback className="bg-secondary text-sm font-black text-foreground">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {displayName || tDashboard("newPlayer")}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>

              <SheetClose asChild>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 w-full justify-start rounded-xl"
                >
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    {tCommon("settings")}
                  </Link>
                </Button>
              </SheetClose>

              <Button
                variant="danger"
                className="h-11 w-full justify-start rounded-xl text-white hover:text-white [&_svg]:text-white"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {tCommon("logout")}
              </Button>
            </>
          ) : (
            <SheetClose asChild>
              <Button asChild variant="super" className="h-11 w-full justify-start rounded-xl">
                <Link href="/auth/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  {tCommon("login")}
                </Link>
              </Button>
            </SheetClose>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
