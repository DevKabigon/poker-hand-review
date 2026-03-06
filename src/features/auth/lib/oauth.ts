function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function buildOAuthRedirectUrl(nextPath = "/") {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const origin =
    typeof window !== "undefined" ? window.location.origin : undefined;
  const baseUrl = stripTrailingSlash(appUrl || origin || "");

  return `${baseUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
