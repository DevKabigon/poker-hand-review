"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  CirclePlay,
  History,
  Layers,
  LogIn,
  LogOut,
  Settings,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StartNewHandButton } from "@/components/start-new-hand-button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { supabase } from "@/lib/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHandEditorStore } from "@/features/hand/editor/handEditorStore";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <DashboardShellInner>{children}</DashboardShellInner>
    </SidebarProvider>
  );
}

function DashboardShellInner({ children }: DashboardShellProps) {
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const tMarketing = useTranslations("marketing");
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();
  const handConfig = useHandEditorStore((s) => s.config);
  const handEventsCount = useHandEditorStore((s) => s.events.length);
  const [isHandStoreHydrated, setIsHandStoreHydrated] = useState(false);
  const { user, username, isLoading, setAuth } = useAuthStore();

  useEffect(() => {
    const persistApi = useHandEditorStore.persist;
    const handleHydrated = () => setIsHandStoreHydrated(true);

    if (persistApi.hasHydrated()) {
      handleHydrated();
    }

    const unsubscribe = persistApi.onFinishHydration(handleHydrated);
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await setAuth(null);
      setOpenMobile(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleMobileNavigate = (href: string) => {
    setOpenMobile(false);
    router.push(href);
  };

  const displayName =
    username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.display_name ||
    "";

  const userInitial =
    displayName.charAt(0) ||
    user?.email?.charAt(0).toUpperCase() ||
    "U";

  const hasCurrentSession =
    isHandStoreHydrated && (!!handConfig || handEventsCount > 0);
  const sessionLabel = hasCurrentSession
    ? tDashboard("currentHand")
    : tDashboard("newHand");
  const headerBadgeLabel = pathname.startsWith("/dashboard/settings")
    ? tCommon("settings")
    : pathname.startsWith("/dashboard/history")
      ? tCommon("handHistory")
      : pathname.startsWith("/dashboard/hand") ||
          pathname.startsWith("/dashboard/hands")
        ? tCommon("hand")
        : tCommon("dashboard");
  const isRecordPage =
    pathname.startsWith("/dashboard/hands/") && pathname.endsWith("/record");

  const navItems = [
    {
      href: "/dashboard",
      label: tCommon("dashboard"),
      icon: Layers,
      isActive: pathname === "/dashboard",
    },
    {
      href: "/dashboard/hand",
      label: sessionLabel,
      icon: CirclePlay,
      isActive:
        pathname.startsWith("/dashboard/hand") ||
        pathname.startsWith("/dashboard/hands"),
    },
    {
      href: "/dashboard/history",
      label: tCommon("handHistory"),
      icon: History,
      isActive: pathname.startsWith("/dashboard/history"),
    },
    {
      href: "/dashboard/settings",
      label: tCommon("settings"),
      icon: Settings,
      isActive: pathname.startsWith("/dashboard/settings"),
    },
  ];

  return (
    <div className="min-h-screen w-full flex-1 bg-transparent">
      {isMobile ? (
        <Sidebar side="left">
          <SidebarHeader className="border-b border-sidebar-border/70 px-3 py-3">
            <BrandLogo
              className="group cursor-pointer"
              markClassName="h-9 w-9 transition-transform duration-200 group-hover:scale-105"
              labelClassName="text-lg leading-none"
            />
          </SidebarHeader>
          <SidebarContent className="px-3 py-3">
            <nav className="grid gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    type="button"
                    variant={item.isActive ? "sidebarOutline" : "sidebar"}
                    className="h-11 justify-start rounded-xl px-3 text-sm"
                    onClick={() => handleMobileNavigate(item.href)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </SidebarContent>
          <SidebarFooter className="p-3">
            <div className="mb-2 flex items-center justify-between rounded-xl border border-sidebar-border/70 bg-sidebar-accent/35 px-2.5 py-2">
              <LocaleSwitcher />
              <ThemeToggle />
              {isLoading ? (
                <Skeleton className="h-8 w-8 rounded-full" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="relative h-8 w-8 overflow-hidden rounded-full border border-border/70 p-0">
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url}
                          alt="User Avatar"
                        />
                        <AvatarFallback className="bg-secondary text-xs font-black text-foreground">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="mt-2 w-60 rounded-xl">
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
                    <div className="px-2 pb-2 [&>button]:w-full">
                      <StartNewHandButton size="sm" location="marketing" />
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleMobileNavigate("/dashboard")}
                      className="cursor-pointer gap-3 py-2"
                    >
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span>{tCommon("dashboard")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleMobileNavigate("/dashboard/hand")}
                      className="cursor-pointer gap-3 py-2"
                    >
                      <CirclePlay className="h-4 w-4 text-muted-foreground" />
                      <span>{sessionLabel}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleMobileNavigate("/dashboard/history")}
                      className="cursor-pointer gap-3 py-2"
                    >
                      <History className="h-4 w-4 text-muted-foreground" />
                      <span>{tCommon("handHistory")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleMobileNavigate("/dashboard/settings")}
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
              ) : (
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                >
                  <Link href="/auth/login" onClick={() => setOpenMobile(false)}>
                    <LogIn className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>

            <div className="grid gap-1">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-9 justify-start rounded-lg px-2.5 text-xs"
              >
                <Link href="/terms" onClick={() => setOpenMobile(false)}>
                  {tMarketing("footerTerms")}
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-9 justify-start rounded-lg px-2.5 text-xs"
              >
                <Link href="/privacy" onClick={() => setOpenMobile(false)}>
                  {tMarketing("footerPrivacy")}
                </Link>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
      ) : null}

      <div className="flex min-h-screen w-full">
        <aside className="hidden w-66 shrink-0 flex-col overflow-hidden border-r border-border/65 bg-card/42 px-4 py-5 backdrop-blur lg:flex">
          <BrandLogo
            className="group cursor-pointer px-2"
            markClassName="h-9 w-9 transition-transform duration-200 group-hover:scale-105"
            labelClassName="text-xl leading-none"
          />

          <nav className="mt-6 grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  asChild
                  variant={item.isActive ? "sidebarOutline" : "sidebar"}
                  className="h-11 justify-start rounded-xl px-3"
                >
                  <Link href={item.href}>
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-border/65 bg-background/55 p-3">
            <div className="grid gap-1">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-9 justify-start rounded-lg px-2.5 text-xs"
              >
                <Link href="/terms">{tMarketing("footerTerms")}</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-9 justify-start rounded-lg px-2.5 text-xs"
              >
                <Link href="/privacy">{tMarketing("footerPrivacy")}</Link>
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {!(isMobile && isRecordPage) ? (
            <header className="sticky top-0 z-40 border-b border-border/65 bg-background/52 px-4 backdrop-blur md:px-6">
              <div className="flex h-16 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="md:hidden">
                    <SidebarTrigger className="h-9 w-9 rounded-xl border border-border/65 bg-card/75" />
                  </div>
                  <div className="flex items-center leading-none lg:hidden">
                    <BrandLogo
                      className="group relative -translate-y-px cursor-pointer"
                      markClassName="h-9 w-9 transition-transform duration-200 group-hover:scale-105 sm:h-10 sm:w-10"
                      labelClassName="text-lg leading-none sm:text-xl md:text-[1.35rem]"
                    />
                  </div>
                  <Badge
                    variant="secondary"
                    className="hidden rounded-md px-2 py-0.5 sm:inline-flex"
                  >
                    {headerBadgeLabel}
                  </Badge>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <LocaleSwitcher />
                  <ThemeToggle />

                  {isLoading ? (
                    <Skeleton className="h-9 w-9 rounded-full" />
                  ) : user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button className="relative h-9 w-9 overflow-hidden rounded-full border border-border/70 p-0">
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
                        align="end"
                        className="mt-2 w-60 rounded-xl"
                      >
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
                        <div className="px-2 pb-2 [&>button]:w-full">
                          <StartNewHandButton size="sm" location="marketing" />
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push("/dashboard")}
                          className="cursor-pointer gap-3 py-2"
                        >
                          <Layers className="h-4 w-4 text-muted-foreground" />
                          <span>{tCommon("dashboard")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push("/dashboard/hand")}
                          className="cursor-pointer gap-3 py-2"
                        >
                          <CirclePlay className="h-4 w-4 text-muted-foreground" />
                          <span>{sessionLabel}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push("/dashboard/history")}
                          className="cursor-pointer gap-3 py-2"
                        >
                          <History className="h-4 w-4 text-muted-foreground" />
                          <span>{tCommon("handHistory")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push("/dashboard/settings")}
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
                          <span className="font-semibold">
                            {tCommon("logout")}
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button asChild variant="ghost" size="sm" className="rounded-xl">
                      <Link href="/auth/login">
                        <LogIn className="mr-1.5 h-4 w-4" />
                        {tCommon("login")}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </header>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </div>
    </div>
  );
}
