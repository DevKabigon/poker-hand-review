import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing, type AppLocale } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 현재 로그인된 유저 정보 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rewriteHeader = response.headers.get("x-middleware-rewrite");
  const effectiveUrl = rewriteHeader ? new URL(rewriteHeader) : request.nextUrl;

  const segments = effectiveUrl.pathname.split("/");
  const maybeLocale = segments[1];
  const hasLocalePrefix = routing.locales.includes(maybeLocale as (typeof routing.locales)[number]);
  const currentLocale: AppLocale = hasLocalePrefix
    ? (maybeLocale as AppLocale)
    : routing.defaultLocale;
  const pathname = hasLocalePrefix
    ? `/${segments.slice(2).join("/")}` || "/"
    : effectiveUrl.pathname;
  const normalizedPathname =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  const isProtectedRoute =
    normalizedPathname.startsWith("/history") ||
    normalizedPathname.startsWith("/settings");

  const isAuthRoute =
    normalizedPathname.startsWith("/auth/login") ||
    normalizedPathname.startsWith("/auth/signup");

  if (isProtectedRoute && !user) {
    const redirectResponse = NextResponse.redirect(
      new URL(`/${currentLocale}/auth/login`, request.url),
    );
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (isAuthRoute && user) {
    const redirectResponse = NextResponse.redirect(
      new URL(`/${currentLocale}`, request.url),
    );
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};
