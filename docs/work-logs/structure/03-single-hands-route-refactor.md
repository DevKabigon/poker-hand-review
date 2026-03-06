# Structure 03 - Single Hands Route Refactor

작성일: 2026-02-28  
범위: `hands` 라우트 중복 제거 및 `dashboard/hands` 단일화

## 배경

- 이전 단계에서 `dashboard/hands` 전환 중 임시 이행 레이어가 남아
  - `src/app/[locale]/hands`
  - `src/app/[locale]/dashboard/hands`
  두 라우트 트리가 동시에 존재
- 사용자 피드백: 중복 구조 제거 필요

## 변경 목표

- `hands` 라우트를 하나만 남긴다
- 기준 라우트는 `src/app/[locale]/dashboard/hands`로 통일한다

## 반영 내용

1. 실제 핸드 플로우 코드 이관
- 임시 wrapper 페이지(import-export only) 대신
  - `setup`, `players`, `record`, `review` 페이지/컴포넌트/훅을
  - `dashboard/hands/[handId]/*`에 직접 배치

2. import 경로 정리
- `players/_components/player-list.tsx`
  - `ResumeHandDialog` import를 `../../record/_components`로 변경
- `review/page.tsx`
  - `EventLog` import를 `dashboard/hands/[handId]/record/_components` 기준으로 변경

3. 기존 중복 라우트 제거
- `src/app/[locale]/hands` 디렉터리 전체 삭제

4. 동선 일관성 점검
- 새 핸드 시작 / setup->players->record / dashboard list->review 경로가
  모두 `/dashboard/hands/...`를 사용하도록 확인

## 검증

- `pnpm exec tsc --noEmit` 통과
- 코드 검색 기준:
  - 라우팅 경로에서 `/hands/...` 단독 경로 사용 제거
  - `dashboard/hands` 단일 경로 사용 확인

## 결과

- 프로젝트 내 `hands` 라우트는 `dashboard/hands` 단일 체계로 정리됨
- 중간 이행 구조(중복 폴더) 제거 완료
