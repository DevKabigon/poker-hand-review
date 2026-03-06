"use client";

import { useState } from "react";
import {
  Clock3,
  Copy,
  Handshake,
  Mail,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PolicyPageShell, PolicySectionCard } from "../_components/policy-shell";

type ContactFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const INITIAL_FORM: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const t = useTranslations("policyContact");

  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const supportEmail = t("supportEmail");

  const handleChange = (key: keyof ContactFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  const handleCompose = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.email.trim() || !form.message.trim()) {
      setError(t("form.errorRequired"));
      return;
    }

    const subject = form.subject.trim() || t("form.defaultSubject");
    const bodyLines = [
      `${t("form.composeName")}: ${form.name.trim() || "-"}`,
      `${t("form.composeEmail")}: ${form.email.trim()}`,
      "",
      `${t("form.composeMessage")}:`,
      form.message.trim(),
    ];

    const href = `mailto:${supportEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = href;
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <PolicyPageShell
      backLabel={t("back")}
      badge={t("badge")}
      title={t("title")}
      summary={t("summary")}
      heroIcon={<Sparkles className="h-5 w-5" />}
      footerLinks={[
        { href: "/terms", label: t("footerTerms") },
        { href: "/privacy", label: t("footerPrivacy") },
      ]}
      footerNote={t("footerNote")}
    >
      <PolicySectionCard
        icon={<Mail className="h-4 w-4" />}
        kicker={t("sections.direct.kicker")}
        title={t("sections.direct.title")}
        className="md:col-span-2"
      >
        <p>{t("sections.direct.body")}</p>
        <p className="mt-2 text-base font-semibold text-foreground">{supportEmail}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="super" className="rounded-xl">
            <a href={`mailto:${supportEmail}`}>
              <Send className="mr-2 h-4 w-4" />
              {t("ctaEmail")}
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={handleCopyEmail}
          >
            <Copy className="mr-2 h-4 w-4" />
            {copied ? t("ctaCopied") : t("ctaCopyEmail")}
          </Button>
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/hand">{t("ctaHandReview")}</Link>
          </Button>
        </div>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<Clock3 className="h-4 w-4" />}
        kicker={t("sections.response.kicker")}
        title={t("sections.response.title")}
      >
        <p>{t("sections.response.body")}</p>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<ShieldCheck className="h-4 w-4" />}
        kicker={t("sections.privacy.kicker")}
        title={t("sections.privacy.title")}
      >
        <p>{t("sections.privacy.body")}</p>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<Handshake className="h-4 w-4" />}
        kicker={t("sections.reasons.kicker")}
        title={t("sections.reasons.title")}
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>{t("sections.reasons.item1")}</li>
          <li>{t("sections.reasons.item2")}</li>
          <li>{t("sections.reasons.item3")}</li>
          <li>{t("sections.reasons.item4")}</li>
        </ul>
      </PolicySectionCard>

      <PolicySectionCard
        icon={<MessageSquare className="h-4 w-4" />}
        kicker={t("form.kicker")}
        title={t("form.title")}
      >
        <form className="space-y-3" onSubmit={handleCompose}>
          <Input
            value={form.name}
            onChange={(event) => handleChange("name", event.target.value)}
            placeholder={t("form.namePlaceholder")}
            className="rounded-xl"
          />
          <Input
            type="email"
            value={form.email}
            onChange={(event) => handleChange("email", event.target.value)}
            placeholder={t("form.emailPlaceholder")}
            className="rounded-xl"
          />
          <Input
            value={form.subject}
            onChange={(event) => handleChange("subject", event.target.value)}
            placeholder={t("form.subjectPlaceholder")}
            className="rounded-xl"
          />
          <Textarea
            value={form.message}
            onChange={(event) => handleChange("message", event.target.value)}
            placeholder={t("form.messagePlaceholder")}
            className="min-h-32 rounded-xl"
          />
          {error ? (
            <p className="text-xs font-semibold text-destructive">{error}</p>
          ) : (
            <p className="text-xs text-muted-foreground">{t("form.helper")}</p>
          )}
          <Button type="submit" variant="primary" className="w-full rounded-xl">
            <Send className="mr-2 h-4 w-4" />
            {t("form.composeCta")}
          </Button>
        </form>
      </PolicySectionCard>
    </PolicyPageShell>
  );
}

