import type { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/site-config";
import { routing } from "@/i18n/routing";

export default function robots(): MetadataRoute.Robots {
  const privatePrefixes = ["/auth/", "/dashboard", "/history", "/settings", "/hand", "/hands/"];
  const localeDisallow = routing.locales.flatMap((locale) =>
    privatePrefixes.map((prefix) => `/${locale}${prefix}`),
  );

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          ...privatePrefixes,
          ...localeDisallow,
        ],
      },
    ],
    sitemap: [absoluteUrl("/sitemap.xml")],
    host: SITE_URL,
  };
}
