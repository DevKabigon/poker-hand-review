# Work Log - Plan Detail 03 (Folder Structure)

## 작업 일시
- 2026-02-28

## 작업 목표
- 파일 밀집도가 높은 `action-recording` 영역의 계층을 세분화
- 페이지 조립 레이어와 훅/다이얼로그/로그 UI의 물리적 경계 명확화
- 구조 변경 후 import 경로를 안정적으로 유지

## 적용 범위
- `src/app/hands/[handId]/new/(action-recording)`
- 구조 의존 import가 있는 인접 페이지 2곳
  - `src/app/hands/[handId]/review/page.tsx`
  - `src/app/hands/[handId]/new/players/_components/player-list.tsx`

## 변경 내용
1. 컴포넌트 계층 분리
- 기존: `_components/*` 평면 구조
- 변경:
  - `_components/layout/*`
  - `_components/dialogs/*`
  - `_components/logs/*`
  - `_components/index.ts` (배럴 export)

2. 훅 계층 분리
- 기존: `_hooks/*` 평면 구조
- 변경:
  - `_hooks/flow/*`
  - `_hooks/dialogs/*`
  - `_hooks/events/*`
  - `_hooks/index.ts` (배럴 export)

3. import 경로 단순화
- `page.tsx`에서 세부 파일 경로 import를 배럴 import로 교체
- `review/page.tsx`, `player-list.tsx`의 참조 경로를 새 구조로 갱신

## 결과 구조 (요약)
```text
src/app/hands/[handId]/new/(action-recording)
  _components
    dialogs
    layout
    logs
    index.ts
  _hooks
    dialogs
    events
    flow
    index.ts
  page.tsx
```

## 검증
- `pnpm exec tsc --noEmit`: 통과

## 비고
- 이번 단계는 "구조 정리"만 수행했으며 기능 동작/비즈니스 로직은 변경하지 않음
- 다국어(i18n)는 사용자 요청에 따라 계속 보류 상태
