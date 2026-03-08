import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ko", "en", "ja"],
  defaultLocale: "ko",
  localeDetection: true,
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
