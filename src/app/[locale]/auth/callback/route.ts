import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { routing, type AppLocale } from "@/i18n/routing";

function getSafeRedirectPath(nextParam: string | null) {
  if (!nextParam) return "/";
  if (!nextParam.startsWith("/") || nextParam.startsWith("//")) {
    return "/";
  }
  return nextParam;
}

function getLocaleFromPathname(pathname: string): AppLocale {
  const maybeLocale = pathname.split("/")[1] as AppLocale | undefined;
  return routing.locales.includes(maybeLocale as AppLocale)
    ? (maybeLocale as AppLocale)
    : routing.defaultLocale;
}

function withLocalePrefix(pathname: string, locale: AppLocale): string {
  if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
    return pathname;
  }
  if (pathname === "/") {
    return `/${locale}`;
  }
  return `/${locale}${pathname}`;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const locale = getLocaleFromPathname(requestUrl.pathname);
  const code = requestUrl.searchParams.get("code");
  const safeRedirectPath = getSafeRedirectPath(
    requestUrl.searchParams.get("next"),
  );

  if (!code) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth/login?error=missing_code`, requestUrl.origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth/login?error=oauth_callback`, requestUrl.origin),
    );
  }

  return NextResponse.redirect(
    new URL(withLocalePrefix(safeRedirectPath, locale), requestUrl.origin),
  );
}
