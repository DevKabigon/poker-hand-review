"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize(); // 앱이 로드될 때 세션 확인 및 구독 시작
  }, [initialize]);

  return <>{children}</>;
}
