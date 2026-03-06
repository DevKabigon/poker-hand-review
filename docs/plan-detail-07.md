# Plan Detail 07 - 다국어 패치 (ko/en/ja)

## 목표

- Next.js App Router + `next-intl` 공식 방식으로 다국어 인프라 구축
- `proxy`에서 i18n 라우팅과 Supabase 세션 갱신/인증 리다이렉트를 안전하게 결합
- 핵심 사용자 플로우(랜딩/인증/대시보드)의 UI 텍스트를 3개 언어로 제공

## 구현 원칙

- 2026년 기준 공식 문서 방식 준수
  - Next.js: `middleware` -> `proxy` 전환
  - next-intl: `createNextIntlPlugin`, `i18n/request.ts`, `next-intl/middleware`
- 라우팅 안정성 우선
  - `localePrefix: "never"`로 기존 URL 구조 유지
  - 기존 라우터/링크 경로와 충돌 최소화

## 작업 범위

- `next.config.ts`
- `src/i18n/*`
- `src/proxy.ts`
- `src/app/[locale]/*` 라우트 구조
- 핵심 화면 번역 적용 파일

## 작업 순서

1. `next-intl` 설정 파일 추가
  - `src/i18n/routing.ts`
  - `src/i18n/navigation.ts`
  - `src/i18n/request.ts`
  - `src/i18n/messages/{ko,en,ja}.json`
2. Next 플러그인 연결
  - `next.config.ts`에서 `createNextIntlPlugin("./src/i18n/request.ts")`
3. App Router 로케일 구조 적용
  - UI 라우트를 `src/app/[locale]`로 이동
  - `src/app/[locale]/layout.tsx`에서 `NextIntlClientProvider` 구성
4. Proxy 결합
  - `handleI18nRouting(request)` 먼저 실행
  - 동일 response 객체로 Supabase 쿠키 갱신
  - 리라이트된 pathname 기준으로 인증 리다이렉트 판별
5. UI 번역 적용
  - 랜딩/인증/대시보드/공통 헤더/핸드 시작 버튼
  - 로케일 스위처 추가

## 완료 기준

- `ko/en/ja` 전환 가능
- 인증 라우트/보호 라우트 동작 유지
- i18n proxy + Supabase 세션 처리 간 쿠키 충돌 없음

## 간단 코드 스니펫

```ts
// src/proxy.ts (핵심 흐름)
const response = handleI18nRouting(request);
const supabase = createServerClient(url, key, {
  cookies: {
    getAll: () => request.cookies.getAll(),
    setAll: (cookies) => cookies.forEach((c) => response.cookies.set(c))
  }
});
await supabase.auth.getUser();
return response;
```
