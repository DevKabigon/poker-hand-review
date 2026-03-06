import { redirect } from "next/navigation";

export default async function DashboardSessionRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/hand`);
}
