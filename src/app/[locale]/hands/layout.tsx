import type { Metadata } from "next";
import { HandsLayoutClient } from "./hands-layout-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function HandsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HandsLayoutClient>{children}</HandsLayoutClient>;
}
