"use client";

import { usePathname } from "@/i18n/navigation";
import { TopFloatingNav } from "@/components/top-floating-nav";
import { cn } from "@/lib/utils";

export function HandsLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideMobileTopNav = /\/hands\/[^/]+\/(setup|players|record)$/.test(
    pathname,
  );

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-transparent">
      <div className={cn(hideMobileTopNav ? "hidden min-[900px]:block" : "")}>
        <TopFloatingNav />
      </div>
      <main className={cn("pb-4", hideMobileTopNav ? "pt-2 min-[900px]:pt-3" : "pt-3")}>
        {children}
      </main>
    </div>
  );
}
