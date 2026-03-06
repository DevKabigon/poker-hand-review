# Structure 04 - Single Settings Route Refactor

작성일: 2026-02-28  
범위: `settings` 라우트 중복 제거 및 `dashboard/settings` 단일화

## 변경 목표

- `settings` 라우트를 하나만 남긴다
- 기준 라우트는 `src/app/[locale]/dashboard/settings`로 통일한다

## 반영 내용

1. 기존 라우트 제거
- `src/app/[locale]/settings/page.tsx` 삭제
- `src/app/[locale]/settings` 디렉터리 삭제

2. 보호 경로 정리
- `proxy`의 보호 경로에서 `/settings` 제거
- `/dashboard/settings`만 보호 라우트로 유지

3. 동선 확인
- 메뉴/드롭다운/네비 경로가 모두 `/dashboard/settings`를 사용함을 확인

## 검증

- 경로 존재 확인:
  - `src/app/[locale]/settings` -> 없음
  - `src/app/[locale]/dashboard/settings` -> 있음
- `pnpm exec tsc --noEmit` 통과

## 결과

- 프로젝트 내 `settings` 라우트는 `dashboard/settings` 단일 체계로 정리됨
