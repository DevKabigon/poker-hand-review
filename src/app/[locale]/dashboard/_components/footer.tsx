import { DefaultContainer } from "@/components/default-container";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="sticky bottom-0 z-40 border-t border-border/70 bg-background/45 py-6 backdrop-blur-sm">
      <DefaultContainer>
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            © 2025 PokerHandReview
          </p>
          <div className="flex gap-6 text-xs font-semibold text-muted-foreground">
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-foreground"
            >
              Contact
            </Link>
          </div>
        </div>
      </DefaultContainer>
    </footer>
  );
}
