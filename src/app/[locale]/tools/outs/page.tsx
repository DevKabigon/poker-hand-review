import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { TopFloatingNav } from "@/components/top-floating-nav";
import { DefaultContainer } from "@/components/default-container";
import { Button } from "@/components/ui/button";
import { OutsCalculator } from "@/features/tools/outs/ui/outs-calculator";
import { OG_IMAGE_PATH } from "@/lib/site-config";
import {
  localizedAbsoluteUrl,
  localizedAlternates,
  localizePathname,
} from "@/lib/seo";
import type { AppLocale } from "@/i18n/routing";

type OutsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: OutsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const currentLocale = locale as AppLocale;
  const t = await getTranslations({ locale, namespace: "toolsHub" });
  const title = t("outsTitle");
  const description = t("outsDescription");

  return {
    title,
    description,
    alternates: {
      canonical: localizePathname(currentLocale, "/tools/outs"),
      ...localizedAlternates("/tools/outs"),
    },
    openGraph: {
      title,
      description,
      url: localizedAbsoluteUrl(currentLocale, "/tools/outs"),
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

export default async function OutsToolPage() {
  const tTools = await getTranslations("toolsHub");

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <TopFloatingNav />

      <main className="pb-10 pt-5 sm:pt-6">
        <DefaultContainer>
          <section className="mx-auto w-full max-w-5xl">
            <h1 className="mb-4 text-2xl font-black tracking-tight sm:text-3xl">
              {tTools("outsTitle")}
            </h1>

            <OutsCalculator />

            <div className="mt-6">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {tTools("backHome")}
                </Link>
              </Button>
            </div>
          </section>
        </DefaultContainer>
      </main>
    </div>
  );
}
