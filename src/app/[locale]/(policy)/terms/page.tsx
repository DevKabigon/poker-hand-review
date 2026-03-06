"use client";

import {
  Ban,
  Gavel,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  WalletCards,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { PolicyPageShell, PolicySectionCard } from "../_components/policy-shell";

export default function TermsPage() {
  const t = useTranslations("policyTerms");

  const prohibitedItems = [
    t("sections.rules.item1"),
    t("sections.rules.item2"),
    t("sections.rules.item3"),
    t("sections.rules.item4"),
  ];

  return (
    <PolicyPageShell
      backLabel={t("back")}
      badge={t("badge")}
      title={t("title")}
      summary={t("summary")}
      updatedLabel={t("updatedLabel")}
      updatedValue={t("updatedValue")}
      heroIcon={<Sparkles className="h-5 w-5" />}
      footerLinks={[
        { href: "/privacy", label: t("footerPrivacy") },
        { href: "/contact", label: t("footerContact") },
      ]}
      footerNote={t("footerNote")}
    >
      <PolicySectionCard
        icon={<Zap className="h-4 w-4" />}
        kicker={t("sections.overview.kicker")}
        title={t("sections.overview.title")}
        className="md:col-span-2"
      >
        <p>{t("sections.overview.body")}</p>
        <div className="mt-4 rounded-2xl border bg-background/50 p-3 text-xs font-semibold text-foreground">
          {t("quickSummaryTitle")}
          <ul className="mt-2 space-y-1.5 text-sm font-normal text-muted-foreground">
            <li>{t("quickSummary1")}</li>
            <li>{t("quickSummary2")}</li>
            <li>{t("quickSummary3")}</li>
          </ul>
        </div>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<UserCheck className="h-4 w-4" />}
        kicker={t("sections.eligibility.kicker")}
        title={t("sections.eligibility.title")}
      >
        <p>{t("sections.eligibility.body")}</p>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<WalletCards className="h-4 w-4" />}
        kicker={t("sections.scope.kicker")}
        title={t("sections.scope.title")}
      >
        <p>{t("sections.scope.body")}</p>
        <div className="mt-3 rounded-2xl border bg-background/50 p-3">
          <p className="text-xs font-semibold tracking-tight text-foreground">
            {t("sections.scope.noteTitle")}
          </p>
          <p className="mt-1.5">{t("sections.scope.noteBody")}</p>
        </div>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<ShieldAlert className="h-4 w-4" />}
        kicker={t("sections.disclaimer.kicker")}
        title={t("sections.disclaimer.title")}
      >
        <p>{t("sections.disclaimer.body")}</p>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<Ban className="h-4 w-4" />}
        kicker={t("sections.rules.kicker")}
        title={t("sections.rules.title")}
      >
        <ul className="list-disc space-y-2 pl-5">
          {prohibitedItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<Gavel className="h-4 w-4" />}
        kicker={t("sections.governingLaw.kicker")}
        title={t("sections.governingLaw.title")}
        className="md:col-span-2"
      >
        <p>{t("sections.governingLaw.body")}</p>
        <div className="mt-4 rounded-2xl border bg-background/55 p-3 text-sm">
          <p className="font-semibold text-foreground">{t("contactTitle")}</p>
          <p className="mt-1 text-muted-foreground">{t("contactBody")}</p>
          <p className="mt-1.5 font-semibold text-foreground">
            {t("contactEmail")}
          </p>
        </div>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<ShieldCheck className="h-4 w-4" />}
        kicker={t("sections.changes.kicker")}
        title={t("sections.changes.title")}
        className="md:col-span-2"
      >
        <p>{t("sections.changes.body")}</p>
      </PolicySectionCard>
    </PolicyPageShell>
  );
}

