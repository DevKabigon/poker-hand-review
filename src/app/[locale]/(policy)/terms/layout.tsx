import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OG_IMAGE_PATH } from "@/lib/site-config";
import {
  localizedAbsoluteUrl,
  localizedAlternates,
  localizePathname,
} from "@/lib/seo";
import type { AppLocale } from "@/i18n/routing";

type TermsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: TermsLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "policyTerms" });
  const title = t("title");
  const description = t("summary");

  return {
    title,
    description,
    alternates: {
      canonical: localizePathname(currentLocale, "/terms"),
      ...localizedAlternates("/terms"),
    },
    openGraph: {
      title,
      description,
      url: localizedAbsoluteUrl(currentLocale, "/terms"),
      images: [OG_IMAGE_PATH],
      type: "article",
    },
    twitter: {
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}

export default function TermsLayout({ children }: TermsLayoutProps) {
  return children;
}
