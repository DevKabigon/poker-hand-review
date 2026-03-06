# Work Log - Plan Detail 05 (유료 기능 및 AI API 제거)

## 작업 일시
- 2026-02-28

## 작업 목표
- 수요 조사 전까지 유료/AI 기능 코드를 제품에서 제거
- 무료 단일 플로우(핸드 기록/복기)에 맞춰 UI/정책/문서 정합성 확보
- 제거 후 타입 안정성 확인

## 주요 수행 내용
1. AI API/클라이언트/UI 제거
- 삭제: `src/app/api/ai/route.ts`
- 삭제: `src/features/hand/api/aiAnalysis.ts`
- 삭제: `src/components/ai-analysis-sheet.tsx`
- 삭제: `src/features/hand/engine/aiPromptConverter.ts`

2. Record/Review 화면에서 AI 흐름 제거
- 수정: `src/app/hands/[handId]/new/(action-recording)/page.tsx`
  - AI 상태/요청/시트 관련 로직 제거
  - 저장 다이얼로그 호출을 무료 단일 흐름으로 단순화
- 수정: `src/app/hands/[handId]/review/page.tsx`
  - AI 분석 실행/표시 경로 제거

3. 액션 기록 UI 컴포넌트 단순화
- 수정: `src/app/hands/[handId]/new/(action-recording)/_components/layout/action-area.tsx`
  - AI props 전달 제거
- 수정: `src/components/poker/action-panel.tsx`
  - AI 버튼/로딩/분기 제거
- 수정: `src/app/hands/[handId]/new/(action-recording)/_components/dialogs/save-hand-dialog.tsx`
  - 플랜/크레딧 제한 UI 제거

4. 인증/대시보드의 유료 정보 제거
- 수정: `src/features/auth/store/useAuthStore.ts`
  - `profile`, `plan`, `credits`, `fetchProfile` 제거
  - 인증 상태 중심 스토어로 축소
- 수정: `src/features/auth/ui/nav-user-area.tsx`
  - Billing 메뉴/플랜 배지 제거
- 수정: `src/app/dashboard/_components/header.tsx`
  - Billing 메뉴/플랜 표기 제거
- 수정: `src/app/dashboard/_components/main.tsx`
  - Plan & Credits 카드 제거

5. 유료 페이지 제거
- 삭제: `src/app/pricing/page.tsx`
- 삭제: `src/app/settings/billing/page.tsx`
- 삭제(미사용): `src/app/(marketing)/_components/pricing.tsx`

6. DB 타입/서비스 정리
- 수정: `src/features/hand/db/types.ts`
  - `HandRecord`의 `ai_analysis` 필드 제거
- 수정: `src/features/hand/db/handService.ts`
  - `upsertHandAiAnalysis`, `countHandsByUser` 제거
  - `mapDbRecordToHandRecord`에서 AI 필드 매핑 제거

7. 문서/정책/UI 문구 정합성 정리
- 수정: `README.md`
  - `OPENAI_API_KEY` 설명/예시 제거
- 수정: `src/app/(policy)/terms/page.tsx`
  - 결제/AI 전제 문구를 현재 무료 서비스 기준으로 수정
- 수정: `src/app/(policy)/privacy/page.tsx`
  - 구독 크레딧/AI 제공자/결제 처리 관련 문구 제거
- 수정: `src/app/(marketing)/_components/features.tsx`
  - AI 관련 카드 제거
- 수정: `src/app/(marketing)/_components/hero.tsx`
  - AI 배지/카피 제거
- 수정: `src/app/(policy)/contact/page.tsx`
  - subject placeholder의 billing 문구 제거
- 수정: `src/app/auth/login/page.tsx`
  - `fetchProfile` 관련 오래된 주석 정리

8. 의존성 정리
- 수정: `package.json`
  - 제거: `openai`, `stripe`, `@stripe/stripe-js`
- 갱신: `pnpm-lock.yaml` (lockfile-only install 실행)

## 검증
- 타입체크: `pnpm exec tsc --noEmit` 통과
- 잔여 참조 검색:
  - `OPENAI_API_KEY`, `openai`, `stripe`, `/settings/billing`, `/pricing` 기준 검색 결과 없음

## 비고
- lockfile 갱신 중 네트워크 접근 제한(`EACCES`) 경고가 있었으나, 최종적으로 lockfile 갱신은 완료됨
- 이번 단계는 유료/AI 제거에 집중했으며, 다국어(i18n)는 요청대로 보류 상태 유지
