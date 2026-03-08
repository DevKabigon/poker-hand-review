import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing, type AppLocale } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);
const UNSUPPORTED_LOCALE_FALLBACK: AppLocale = "en";

function getPreferredLocale(acceptLanguage: string | null): AppLocale {
  if (!acceptLanguage) {
    return UNSUPPORTED_LOCALE_FALLBACK;
  }

  const preferences = acceptLanguage
    .split(",")
    .map((entry) => {
      const [rawTag, ...params] = entry.trim().split(";");
      const qualityParam = params.find((param) => param.trim().startsWith("q="));
      const quality = qualityParam ? Number(qualityParam.trim().slice(2)) : 1;

      return {
        tag: rawTag.toLowerCase(),
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .sort((left, right) => right.quality - left.quality);

  for (const { tag } of preferences) {
    if (!tag || tag === "*") {
      continue;
    }

    const baseTag = tag.split("-")[0];

    if (routing.locales.includes(tag as AppLocale)) {
      return tag as AppLocale;
    }

    if (routing.locales.includes(baseTag as AppLocale)) {
      return baseTag as AppLocale;
    }
  }

  return UNSUPPORTED_LOCALE_FALLBACK;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;
  const maybeLocale = pathname.split("/")[1];
  const hasLocalePrefix = routing.locales.includes(maybeLocale as AppLocale);

  if (!hasLocalePrefix) {
    const locale = getPreferredLocale(request.headers.get("accept-language"));
    const localizedPathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

    return NextResponse.redirect(
      new URL(`${localizedPathname}${search}`, request.url),
    );
  }

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
  const effectiveMaybeLocale = segments[1];
  const effectiveHasLocalePrefix = routing.locales.includes(
    effectiveMaybeLocale as (typeof routing.locales)[number],
  );
  const currentLocale: AppLocale = effectiveHasLocalePrefix
    ? (effectiveMaybeLocale as AppLocale)
    : routing.defaultLocale;
  const localizedPathname = effectiveHasLocalePrefix
    ? `/${segments.slice(2).join("/")}` || "/"
    : effectiveUrl.pathname;
  const normalizedPathname =
    localizedPathname.length > 1 && localizedPathname.endsWith("/")
      ? localizedPathname.slice(0, -1)
      : localizedPathname;

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
