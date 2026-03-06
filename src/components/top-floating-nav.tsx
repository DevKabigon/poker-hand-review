"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { DefaultContainer } from "@/components/default-container";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { TopNavAuthMenu } from "@/components/top-nav-auth-menu";
import { MobileNavSheetButton } from "@/components/mobile-nav-sheet-button";

export function TopFloatingNav() {
  const tCommon = useTranslations("common");
  const tTools = useTranslations("toolsHub");
  const pathname = usePathname();
  const locale = useLocale();
  const { user } = useAuthStore();
  const isEnglish = locale === "en";

  const navItems = [
    {
      href: "/hand",
      label: tCommon("handReview"),
      isActive: pathname.startsWith("/hand") || pathname.startsWith("/hands"),
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
    {
      href: "/tools/outs",
      label: isEnglish ? tCommon("toolOutsNav") : tTools("outsTitle"),
      isActive: pathname.startsWith("/tools/outs"),
    },
    {
      href: "/tools/odds",
      label: isEnglish ? tCommon("toolOddsNav") : tTools("oddsTitle"),
      isActive: pathname.startsWith("/tools/odds"),
    },
    {
      href: "/tools/insurance",
      label: isEnglish
        ? tCommon("toolInsuranceNav")
        : tTools("insuranceTitle"),
      isActive: pathname.startsWith("/tools/insurance"),
    },
  ];

  return (
    <div className="relative z-50 shrink-0 pt-4">
      <DefaultContainer>
        <header className="mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between rounded-3xl border border-border/75 bg-card/78 px-3 py-2 shadow-[0_14px_40px_rgb(15_23_42/16%)] backdrop-blur-xl sm:px-4 dark:shadow-[0_18px_48px_rgb(0_0_0/46%)]">
          <div className="hidden min-w-0 items-center gap-2 min-[900px]:flex min-[900px]:gap-4">
            <BrandLogo
              className="group cursor-pointer"
              markClassName="h-9 w-9 transition-transform duration-200 group-hover:scale-105 sm:h-10 sm:w-10"
              labelClassName="text-lg leading-none sm:text-xl md:text-[1.35rem]"
              priority
            />

            <nav className="hidden items-center gap-1 min-[900px]:flex">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant={item.isActive ? "sidebarOutline" : "ghost"}
                  size="sm"
                  className="rounded-xl"
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </nav>
          </div>

          <div className="hidden items-center gap-1 sm:gap-2 min-[900px]:flex">
            <LocaleSwitcher />
            <ThemeToggle />
            <TopNavAuthMenu />
          </div>

          <div className="flex w-full items-center justify-between min-[900px]:hidden">
            <BrandLogo
              className="group cursor-pointer"
              markClassName="h-9 w-9 transition-transform duration-200 group-hover:scale-105"
              labelClassName="text-lg leading-none"
              priority
            />
            <MobileNavSheetButton />
          </div>
        </header>
      </DefaultContainer>
    </div>
  );
}
