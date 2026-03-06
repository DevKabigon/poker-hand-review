import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { localizedAbsoluteUrl, localizedAlternates } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const publicPaths = [
    { path: "/", changeFrequency: "daily" as const, priority: 1 },
    { path: "/tools/outs", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/tools/odds", changeFrequency: "weekly" as const, priority: 0.75 },
    { path: "/tools/insurance", changeFrequency: "weekly" as const, priority: 0.7 },
    { path: "/terms", changeFrequency: "monthly" as const, priority: 0.4 },
    { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.4 },
    { path: "/contact", changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  return publicPaths.flatMap((entry) =>
    routing.locales.map((locale) => ({
      url: localizedAbsoluteUrl(locale, entry.path),
      lastModified: now,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      alternates: localizedAlternates(entry.path),
    })),
  );
}
