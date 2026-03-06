import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Shield } from "lucide-react";
import { TopFloatingNav } from "@/components/top-floating-nav";
import { DefaultContainer } from "@/components/default-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OG_IMAGE_PATH } from "@/lib/site-config";
import {
  localizedAbsoluteUrl,
  localizedAlternates,
  localizePathname,
} from "@/lib/seo";
import type { AppLocale } from "@/i18n/routing";

type InsurancePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: InsurancePageProps): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "toolsHub" });
  const title = t("insuranceTitle");
  const description = t("insuranceDescription");

  return {
    title,
    description,
    alternates: {
      canonical: localizePathname(currentLocale, "/tools/insurance"),
      ...localizedAlternates("/tools/insurance"),
    },
    openGraph: {
      title,
      description,
      url: localizedAbsoluteUrl(currentLocale, "/tools/insurance"),
      images: [OG_IMAGE_PATH],
      type: "website",
    },
    twitter: {
      title,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}

export default async function InsuranceToolPage() {
  const tTools = await getTranslations("toolsHub");

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <TopFloatingNav />

      <main className="pb-10 pt-5 sm:pt-6">
        <DefaultContainer>
          <section className="mx-auto w-full max-w-4xl">
            <Card className="rounded-4xl border border-border/75 bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {tTools("badge")}
                  </p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight">
                    {tTools("insuranceTitle")}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                    {tTools("insuranceDescription")}
                  </p>
                </div>
                <Shield className="mt-1 h-6 w-6 text-primary" />
              </div>

              <div className="mt-6">
                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {tTools("backHome")}
                  </Link>
                </Button>
              </div>
            </Card>
          </section>
        </DefaultContainer>
      </main>
    </div>
  );
}
