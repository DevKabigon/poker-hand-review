const FALLBACK_SITE_URL = "https://www.poker-hand-review.com";

function normalizeSiteUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_SITE_URL,
);

export const SITE_NAME = "PokerHandReview";
export const SITE_SHORT_NAME = "PHR";
export const SITE_TITLE = "PokerHandReview | Poker Hand Replayer & Analyzer";
export const SITE_DESCRIPTION =
  "Review and analyze poker hands with practical tools for outs, odds, and decision quality.";
export const OG_IMAGE_PATH = "/og-image.png";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
