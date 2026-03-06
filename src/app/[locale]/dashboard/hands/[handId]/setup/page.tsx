import { Home } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Header } from "./_components/header";
import { SetupCard } from "./_components/setup-card";

export default async function SetupPage() {
  const tCommon = await getTranslations("common");

  return (
    <div className="relative flex h-[calc(100dvh-1.5rem)] flex-col overflow-hidden px-4 pt-4 pb-3 min-[900px]:h-auto min-[900px]:min-h-full min-[900px]:overflow-visible md:px-6 md:pt-10 md:pb-4 lg:pt-10 lg:pb-2">
      <div className="mx-auto flex w-full max-w-lg min-h-0 flex-1 flex-col lg:max-w-2xl">
        <Header />
        <div className="min-h-0 flex-1 pb-14 min-[900px]:pb-0">
          <SetupCard />
        </div>
      </div>

      <Button
        asChild
        type="button"
        variant="outline"
        className="fixed bottom-5 left-4 z-40 h-9 rounded-xl px-3 text-xs font-semibold shadow-lg shadow-black/15 min-[900px]:hidden"
      >
        <Link href="/">
          <Home className="mr-1 h-3.5 w-3.5" />
          {tCommon("home")}
        </Link>
      </Button>
    </div>
  );
}
