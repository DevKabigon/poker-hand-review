"use client";

import {
  Database,
  GlobeLock,
  Lock,
  Mail,
  Server,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRoundCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { PolicyPageShell, PolicySectionCard } from "../_components/policy-shell";

export default function PrivacyPolicyPage() {
  const t = useTranslations("policyPrivacy");

  const useItems = [
    t("sections.use.item1"),
    t("sections.use.item2"),
    t("sections.use.item3"),
  ];

  const rightsItems = [
    t("sections.rights.item1"),
    t("sections.rights.item2"),
    t("sections.rights.item3"),
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
        { href: "/terms", label: t("footerTerms") },
        { href: "/contact", label: t("footerContact") },
      ]}
      footerNote={t("footerNote")}
    >
      <PolicySectionCard
        icon={<Database className="h-4 w-4" />}
        kicker={t("sections.collect.kicker")}
        title={t("sections.collect.title")}
        className="md:col-span-2"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border bg-background/55 p-3">
            <p className="text-xs font-semibold tracking-tight text-foreground">
              {t("sections.collect.accountTitle")}
            </p>
            <p className="mt-1.5">{t("sections.collect.accountBody")}</p>
          </div>
          <div className="rounded-2xl border bg-background/55 p-3">
            <p className="text-xs font-semibold tracking-tight text-foreground">
              {t("sections.collect.handTitle")}
            </p>
            <p className="mt-1.5">{t("sections.collect.handBody")}</p>
          </div>
          <div className="rounded-2xl border bg-background/55 p-3">
            <p className="text-xs font-semibold tracking-tight text-foreground">
              {t("sections.collect.deviceTitle")}
            </p>
            <p className="mt-1.5">{t("sections.collect.deviceBody")}</p>
          </div>
        </div>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<GlobeLock className="h-4 w-4" />}
        kicker={t("sections.use.kicker")}
        title={t("sections.use.title")}
      >
        <ul className="list-disc space-y-2 pl-5">
          {useItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<Server className="h-4 w-4" />}
        kicker={t("sections.vendor.kicker")}
        title={t("sections.vendor.title")}
      >
        <p>{t("sections.vendor.body")}</p>
        <div className="mt-3 rounded-2xl border bg-background/55 p-3">
          <p className="text-sm font-semibold text-foreground">
            {t("sections.vendor.supabaseName")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("sections.vendor.supabaseBody")}
          </p>
        </div>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<Lock className="h-4 w-4" />}
        kicker={t("sections.retention.kicker")}
        title={t("sections.retention.title")}
      >
        <p>{t("sections.retention.body")}</p>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<UserRoundCheck className="h-4 w-4" />}
        kicker={t("sections.rights.kicker")}
        title={t("sections.rights.title")}
      >
        <ul className="list-disc space-y-2 pl-5">
          {rightsItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<Trash2 className="h-4 w-4" />}
        kicker={t("sections.accountDelete.kicker")}
        title={t("sections.accountDelete.title")}
      >
        <p>{t("sections.accountDelete.body")}</p>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<ShieldCheck className="h-4 w-4" />}
        kicker={t("sections.security.kicker")}
        title={t("sections.security.title")}
      >
        <p>{t("sections.security.body")}</p>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<Mail className="h-4 w-4" />}
        kicker={t("sections.contact.kicker")}
        title={t("sections.contact.title")}
        className="md:col-span-2"
      >
        <p>{t("sections.contact.body")}</p>
        <p className="mt-2 font-semibold text-foreground">{t("contactEmail")}</p>
      </PolicySectionCard>
    </PolicyPageShell>
  );
}

