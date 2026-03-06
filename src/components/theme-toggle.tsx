"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full w-9 h-9 md:w-10 md:h-10 hover:bg-primary/10 transition-all relative overflow-hidden group"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <Sun className="h-4 w-4 md:h-5 md:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
        <Moon className="absolute h-4 w-4 md:h-5 md:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary group-hover:drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
      </div>
    </Button>
  );
}
