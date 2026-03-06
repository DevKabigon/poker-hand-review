# Structure 01 - Dashboard Shell + Route Gate

작성일: 2026-02-28  
범위: 대시보드 구조 1차 정리 (shell 도입, 게이트 라우트, 새 핸드 경로 브릿지)

## 변경 목표

- `/dashboard`를 게이트 페이지로 운영 (비로그인 시 로그인 유도)
- 대시보드 공통 UI를 `layout` 수준 shell로 통일
- 새 핸드 시작 경로를 `dashboard/hands` 기준으로 정렬

## 변경 파일

- `src/app/[locale]/dashboard/_components/dashboard-shell.tsx`
- `src/app/[locale]/dashboard/layout.tsx`
- `src/app/[locale]/dashboard/page.tsx`
- `src/app/[locale]/dashboard/history/page.tsx`
- `src/components/start-new-hand-button.tsx`
- `src/app/[locale]/dashboard/hands/[handId]/setup/page.tsx`
- `src/app/[locale]/dashboard/hands/[handId]/record/page.tsx`
- `src/proxy.ts`
- `src/i18n/messages/ko.json`
- `src/i18n/messages/en.json`
- `src/i18n/messages/ja.json`

## 반영 내용

1. Dashboard Shell 도입
- 대시보드 공통 `layout`에 shell을 연결
- shell 구성:
  - 좌측 사이드바(데스크톱): 대시보드/히스토리/설정 네비 + 새 핸드 시작
  - 상단 탑바: 브랜드, 새 핸드 시작, 언어/테마, 유저 아바타 드롭다운

2. `/dashboard` 게이트 페이지
- 로그인 전:
  - 로그인/회원가입 CTA 카드 노출
- 로그인 후:
  - 기존 `Main` 렌더

3. 보호 라우트 정책 조정 (`proxy`)
- 비로그인 리다이렉트 대상:
  - `/dashboard/history`
  - `/dashboard/settings`
  - `/settings`
- `/dashboard` 루트는 공개 게이트로 유지

4. 새 핸드 시작 경로 정렬
- `StartNewHandButton` 기본 이동을
  - `/dashboard/hands/[handId]/setup`
  - 재개 시 `/dashboard/hands/[handId]/record`
  로 변경
- 현재 기존 구현과의 호환을 위해 브릿지 라우트 추가:
  - `/dashboard/hands/[handId]/setup` -> `/hands/[handId]/new/setup` 리다이렉트
  - `/dashboard/hands/[handId]/record` -> `/hands/[handId]/new` 리다이렉트

5. i18n 추가
- dashboard 게이트 문구 키 추가 (ko/en/ja)

## 검증

- `pnpm exec tsc --noEmit` 통과

## 다음 단계 제안

- 실제 hand flow를 `/dashboard/hands/[handId]/*`로 완전히 이관
- 기존 `/hands/*`는 최종적으로 redirect-only 경로로 축소
- settings 경로도 `/dashboard/settings`로 통일해 네비 구조 일원화
