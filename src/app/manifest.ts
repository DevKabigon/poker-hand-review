import type { MetadataRoute } from "next";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SHORT_NAME,
} from "@/lib/site-config";
import { routing } from "@/i18n/routing";

export default function manifest(): MetadataRoute.Manifest {
  const defaultLocalePrefix = `/${routing.defaultLocale}`;

  return {
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: SITE_DESCRIPTION,
    start_url: defaultLocalePrefix,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0f1a",
    theme_color: "#0a0f1a",
    lang: "ko-KR",
    categories: ["poker", "utilities", "productivity"],
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Outs Calculator",
        short_name: "Outs",
        description: "Calculate winning outs, villain outs, and chop cards.",
        url: `${defaultLocalePrefix}/tools/outs`,
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
        ],
      },
      {
        name: "Hand Review",
        short_name: "Review",
        description: "Open poker hand review workflow quickly.",
        url: `${defaultLocalePrefix}/hand`,
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
        ],
      },
    ],
  };
}
