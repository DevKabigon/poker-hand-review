import { routing, type AppLocale } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/site-config";

export const HREF_LANG_BY_LOCALE: Record<AppLocale, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
};

function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  if (pathname === "/") return "/";
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function localizePathname(locale: AppLocale, pathname = "/"): string {
  const normalized = normalizePathname(pathname);
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}

export function localizedAbsoluteUrl(locale: AppLocale, pathname = "/"): string {
  return absoluteUrl(localizePathname(locale, pathname));
}

export function localizedAlternates(pathname: string) {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [
      HREF_LANG_BY_LOCALE[locale],
      localizedAbsoluteUrl(locale, pathname),
    ]),
  );

  return {
    languages,
  };
}
