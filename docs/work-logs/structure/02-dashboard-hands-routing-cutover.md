# Structure 02 - Dashboard Hands Routing Cutover

작성일: 2026-02-28  
범위: `/dashboard/hands/*` 실사용 전환, redirect 제거, 설정 경로 통일

## 변경 목표

- 기존 redirect 브릿지 없이 `dashboard/hands` 라우트를 실제 진입점으로 사용
- setup -> players -> record -> review 흐름을 `dashboard/hands` 기준으로 통일
- 설정 경로를 `/dashboard/settings`로 정렬

## 변경 파일

- `src/app/[locale]/dashboard/hands/[handId]/setup/page.tsx`
- `src/app/[locale]/dashboard/hands/[handId]/players/page.tsx`
- `src/app/[locale]/dashboard/hands/[handId]/record/page.tsx`
- `src/app/[locale]/dashboard/hands/[handId]/review/page.tsx`
- `src/components/start-new-hand-button.tsx`
- `src/features/hand/editor/hooks/useSetupLogic.ts`
- `src/app/[locale]/hands/[handId]/new/players/page.tsx`
- `src/app/[locale]/hands/[handId]/new/players/_components/player-list.tsx`
- `src/app/[locale]/dashboard/_components/main.tsx`
- `src/app/[locale]/dashboard/history/page.tsx`
- `src/app/[locale]/dashboard/_components/dashboard-shell.tsx`
- `src/app/[locale]/dashboard/_components/header.tsx`
- `src/components/main-header.tsx`
- `src/features/auth/ui/nav-user-area.tsx`
- `src/app/[locale]/dashboard/settings/page.tsx`
- `src/proxy.ts`

## 반영 내용

1. redirect 제거
- 기존 `dashboard/hands/[handId]/setup|record`의 redirect 페이지를 제거
- 해당 경로를 실제 화면 진입 라우트로 교체

2. hands 흐름 경로 정렬
- 새 핸드 시작:
  - `/dashboard/hands/[handId]/setup`
- setup 다음:
  - `/dashboard/hands/[handId]/players`
- record 진입:
  - `/dashboard/hands/[handId]/record`
- review 진입:
  - `/dashboard/hands/[handId]/review`

3. 대시보드 리스트/히스토리 링크 갱신
- 모든 review 링크를 `/dashboard/hands/[handId]/review`로 변경

4. 설정 경로 통일
- 드롭다운/헤더/유저메뉴의 설정 이동 경로를 `/dashboard/settings`로 통일
- 신규 페이지 `dashboard/settings/page.tsx` 추가 (dashboard shell 기반)

5. 보호 라우트 보정
- `proxy`의 보호 경로에 `/dashboard/hands` 포함
- `/dashboard` 루트는 계속 공개 게이트 유지

6. 사용자 피드백 반영: 게스트 새 핸드 시작 허용
- 비로그인 상태에서도 `새 핸드 시작` 흐름이 가능하도록
  - `proxy` 보호 경로에서 `/dashboard/hands` 제외
- 결과:
  - 게스트: 핸드 기록 가능
  - 저장 시점: 기존 로직대로 로그인 요구

7. 대시보드 상단 브랜딩 정렬 보정
- 랜딩과 동일한 브랜딩 정렬 기준을 dashboard shell에 적용
  - `BrandLogo` mark 크기 통일(`h-9 w-9`)
  - label에 `leading-none` 적용
- 결과:
  - 상단바에서 보이던 하단 여백 체감 완화

8. 모바일 상단바 브랜딩 보정(추가)
- 모바일에서 하단 여백 체감이 남아 있어 탑바 높이/브랜딩 스펙을 랜딩 기준으로 재정렬
  - 탑바 내부 높이: `h-11` -> `h-16`
  - 모바일 로고: `relative -translate-y-px` 미세 상향
  - 모바일 label: 랜딩과 동일 스케일 규칙으로 통일

9. 모바일 라인박스 여백 보정(추가)
- 모바일 탑바 브랜딩 래퍼를 `flex items-center leading-none`로 보정
- 목적:
  - 인라인 라인박스 기준으로 생길 수 있는 하단 여백 체감 제거

## 검증

- `pnpm exec tsc --noEmit` 통과

## 비고

- 이번 단계는 “사용자 동선 라우팅 정렬”에 집중
- 기존 `/hands/*`는 내부 구현 모듈 재사용 용도로 남아 있으며, 다음 단계에서 완전 이관/정리 가능
