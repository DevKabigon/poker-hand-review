import Image from "next/image";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

type BrandMarkProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  labelClassName?: string;
  href?: string;
  priority?: boolean;
};

export function BrandMark({
  className,
  imageClassName,
  priority = false,
}: BrandMarkProps) {
  return (
    <span
      className={cn(
        "relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/10 bg-white/90 shadow-sm dark:border-white/10 dark:bg-slate-900",
        className,
      )}
    >
      <Image
        src="/Logo.png"
        alt="PokerHandReview logo"
        fill
        priority={priority}
        sizes="(max-width: 768px) 32px, 36px"
        className={cn("object-contain p-1", imageClassName)}
      />
    </span>
  );
}

export function BrandLogo({
  className,
  markClassName,
  labelClassName,
  href = "/",
  priority = false,
}: BrandLogoProps) {
  const content = (
    <span
      className={cn("inline-flex items-center gap-2.5 leading-none", className)}
    >
      <BrandMark className={markClassName} priority={priority} />
      <span
        className={cn(
          plusJakartaSans.className,
          "inline-flex items-center whitespace-nowrap text-lg font-extrabold leading-none tracking-tight",
          labelClassName,
        )}
      >
        <span className="text-[#00bc7d]">PokerHand</span>
        <span className="text-[#8c52ff]">Review</span>
      </span>
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex shrink-0 items-center">
      {content}
    </Link>
  );
}
