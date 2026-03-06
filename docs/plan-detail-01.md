# Plan Detail 01 - 로고 및 OG 이미지 교체

## 목표

- `public/Logo.png`, `public/og-image.png`를 제품 전역에 일관 반영
- 기존 `Spade` 아이콘 기반 로고 표기를 제거하고 단일 브랜드 컴포넌트로 통합
- Open Graph/Twitter 카드 미리보기가 신규 브랜드 이미지로 노출되도록 설정

## 범위

- `src/app/layout.tsx` 메타데이터
- 공통 헤더들(마케팅/대시보드/설정/핸드 작성/인증)
- 신규 공용 브랜드 컴포넌트 생성

## 작업 순서

1. `src/components/brand/brand-logo.tsx` 추가
2. 각 헤더에서 `Spade + 텍스트` 블록을 `BrandLogo`로 교체
3. `src/app/layout.tsx`의 `metadata`에 `icons`, `openGraph`, `twitter` 설정 추가
4. `favicon.png` 참조 제거 또는 실파일 생성 후 연결

## 체크리스트

- 모든 헤더에서 같은 로고 비율/간격 사용
- OG 이미지 URL이 `/og-image.png`로 통일
- 모바일/데스크톱에서 로고 렌더 품질 확인

## 리스크

- 로고 크기 불일치로 헤더 높이가 페이지마다 달라질 수 있음
- 메타데이터 누락 시 공유 미리보기 카드 반영 실패

## 완료 기준

- 탭 아이콘, OG/Twitter 카드, 사이트 헤더 로고가 모두 신규 에셋으로 표시

## 간단 코드 스니펫

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  title: "PokerHandReview",
  description: "Poker hand recorder and replayer",
  icons: { icon: "/Logo.png" },
  openGraph: {
    title: "PokerHandReview",
    description: "Record and review poker hands precisely",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
};
```

```tsx
// src/components/brand/brand-logo.tsx
import Image from "next/image";
import Link from "next/link";

export function BrandLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2">
      <Image src="/Logo.png" alt="PokerHandReview" width={28} height={28} />
      <span className="font-bold tracking-tight">PokerHandReview</span>
    </Link>
  );
}
```

