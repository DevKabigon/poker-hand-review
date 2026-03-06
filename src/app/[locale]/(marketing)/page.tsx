import type { Metadata } from "next";
import { TopFloatingNav } from "@/components/top-floating-nav";
import { getTranslations } from "next-intl/server";
import { OG_IMAGE_PATH, SITE_NAME } from "@/lib/site-config";
import {
  HREF_LANG_BY_LOCALE,
  localizedAbsoluteUrl,
  localizedAlternates,
  localizePathname,
} from "@/lib/seo";
import type { AppLocale } from "@/i18n/routing";
import { HomeGridHub } from "./_components/home-grid-hub";

type MarketingPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: MarketingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "startHub" });
  const title = `${t("titleLine1")} ${t("titleLine2")}`;
  const description = t("description");

  return {
    title,
    description,
    alternates: {
      canonical: localizePathname(currentLocale, "/"),
      ...localizedAlternates("/"),
    },
    openGraph: {
      title,
      description,
      url: localizedAbsoluteUrl(currentLocale, "/"),
      images: [OG_IMAGE_PATH],
    },
    twitter: {
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}

export default async function MarketingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentLocale = locale as AppLocale;

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: localizedAbsoluteUrl(currentLocale, "/"),
    inLanguage: HREF_LANG_BY_LOCALE[currentLocale],
    availableLanguage: Object.values(HREF_LANG_BY_LOCALE),
  };

  const appStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: localizedAbsoluteUrl(currentLocale, "/"),
  };

  return (
    <div className="relative h-dvh overflow-hidden bg-transparent">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appStructuredData) }}
      />
      <HomeGridHub />
      <div className="pointer-events-auto absolute inset-x-0 top-0 z-50">
        <TopFloatingNav />
      </div>
    </div>
  );
}
