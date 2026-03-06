import Link from "next/link";
import { DefaultContainer } from "@/components/default-container";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StartNewHandButton } from "@/components/start-new-hand-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/brand/brand-logo";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur supports-backdrop-filter:bg-background/60">
      <DefaultContainer>
        <div className="flex h-16 items-center justify-between">
          <BrandLogo
            className="group cursor-pointer"
            markClassName="transition-transform duration-200 group-hover:scale-105"
            labelClassName="text-lg md:text-xl"
            priority
          />
          <nav className="hidden items-center gap-6 lg:flex">
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              How it works
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/hand">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Hand Review
              </Link>
            </Button>
            <StartNewHandButton />
            <ThemeToggle />
          </div>
        </div>
      </DefaultContainer>
    </header>
  );
}
