# Work Log - Plan Detail 01

## 작업 일시
- 2026-02-28

## 작업 목표
- `public/Logo.png`, `public/og-image.png`를 서비스 전역에 반영
- 기존 `Spade + 텍스트` 브랜드 표기를 공용 브랜드 컴포넌트로 통일
- OG/Twitter 메타데이터를 신규 이미지로 설정

## 실제 수행 내용
1. 공용 브랜드 컴포넌트 추가
- `src/components/brand/brand-logo.tsx`
- `BrandLogo`(링크 포함 워드마크), `BrandMark`(아이콘 전용) 구성
- 색상 컨셉 반영: `#00bc7d`, `#8c52ff`

2. 루트 메타데이터 갱신
- `src/app/layout.tsx`
- `icons.icon/shortcut/apple`를 `/Logo.png`로 통일
- `openGraph.images`를 `/og-image.png`로 설정
- `twitter.card`를 `summary_large_image`로 설정하고 이미지 연결

3. 헤더/인증 화면 브랜드 치환
- `src/app/(marketing)/_components/header.tsx`
- `src/app/(marketing)/page.tsx`
- `src/app/pricing/page.tsx`
- `src/app/dashboard/_components/header.tsx`
- `src/app/settings/billing/page.tsx`
- `src/app/hands/[handId]/new/layout.tsx`
- `src/app/auth/login/page.tsx`
- `src/app/auth/signup/page.tsx`
- `src/components/main-header.tsx`

4. 정리 작업
- 치환 후 미사용 import 제거 (`Link`, `Spade`)

## 검증 결과
- `pnpm exec tsc --noEmit`: 통과
- `pnpm lint`: 실패 (기존 코드베이스 전반 이슈, 이번 변경 범위 외 다수)

## 확인한 기존 이슈(이번 작업 비범위)
- 다수 파일의 `no-explicit-any`, `react-hooks/*` 규칙 위반
- 일부 정책/핸드/AI 관련 모듈의 기존 lint 오류

## 결과 요약
- Plan Detail 01 범위(로고/OG/브랜드 통일)만 반영 완료
- 다음 단계에서 02번(다국어) 또는 01의 시각 QA(모바일/데스크톱 수동 확인)로 이어갈 수 있음
