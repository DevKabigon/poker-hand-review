# Work Log - Plan Detail 07 (다국어 패치)

## 작업 일시
- 2026-02-28

## 작업 목표
- `next-intl` 공식 구조로 ko/en/ja 다국어 기반 구축
- Supabase proxy와 i18n proxy를 충돌 없이 결합
- 핵심 UI 텍스트 다국어 적용

## 수행 내용
1. next-intl 인프라 추가
- `src/i18n/routing.ts`
  - locales: `ko`, `en`, `ja`
  - defaultLocale: `ko`
  - localePrefix: `never`
- `src/i18n/navigation.ts`
  - locale-aware `Link`, `useRouter`, `usePathname` 제공
- `src/i18n/request.ts`
  - request locale 검증 + 메시지 로딩
- `src/i18n/messages/{ko,en,ja}.json`
  - 공통/랜딩/인증/대시보드 번역 키 구성

2. Next.js 플러그인 연결
- `next.config.ts`
  - `createNextIntlPlugin("./src/i18n/request.ts")` 적용

3. App Router 로케일 구조 반영
- UI 라우트를 `src/app/[locale]` 하위로 이동
- `src/app/[locale]/layout.tsx` 추가
  - `generateStaticParams`
  - `setRequestLocale`
  - `NextIntlClientProvider`

4. Proxy 결합(핵심)
- `src/proxy.ts`를 next-intl + Supabase 합성 구조로 변경
  - `handleI18nRouting(request)`로 i18n rewrite 처리
  - 동일 response 객체에 Supabase 세션 쿠키 반영
  - `x-middleware-rewrite` 기반 실제 pathname 파싱 후 인증 리다이렉트 처리
  - 리다이렉트 시 i18n/Supabase 쿠키를 redirect response에 복사
  - matcher를 next-intl 권장 패턴으로 정리

5. UI 번역/로케일 전환 적용
- 로케일 스위처 추가: `src/components/locale-switcher.tsx`
- 번역 적용:
  - `src/components/main-header.tsx`
  - `src/components/start-new-hand-button.tsx`
  - `src/features/auth/ui/nav-user-area.tsx`
  - `src/app/[locale]/(marketing)/page.tsx`
  - `src/app/[locale]/auth/login/page.tsx`
  - `src/app/[locale]/auth/signup/page.tsx`
  - `src/app/[locale]/dashboard/_components/header.tsx`
  - `src/app/[locale]/dashboard/_components/main.tsx`
  - `src/app/[locale]/dashboard/history/page.tsx`

6. 경로 이동 후 import 정리
- `@/app/...` 절대경로 참조를 `[locale]` 구조에 맞게 수정
  - `src/app/[locale]/hands/[handId]/review/page.tsx`

## 검증 메모
- 사용자 요청에 따라 `pnpm` 명령(install/typecheck/build)은 실행하지 않음
- 의존성 설치 및 최종 타입/빌드 검증은 사용자 환경에서 수행 필요

## 다음 단계
- 사용자 측 `pnpm install` 후 타입/빌드 검증
- 미번역 잔여 화면(정책/일부 상세 UI) 추가 번역 라운드 진행
