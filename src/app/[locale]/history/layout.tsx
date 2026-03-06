import type { Metadata } from "next";
import { TopFloatingNav } from "@/components/top-floating-nav";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-transparent">
      <TopFloatingNav />
      <main className="pb-4 pt-3">{children}</main>
    </div>
  );
}
