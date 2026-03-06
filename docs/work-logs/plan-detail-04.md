# Work Log - Plan Detail 04 (Code Flow Refactor)

## 작업 일시
- 2026-02-28

## 목표
- `UI -> 비즈니스(usecase/hook) -> API -> DB` 흐름으로 정리
- `action-recording/page.tsx`에서 직접 수행하던 비즈니스/DB/API 로직 분리
- 페이지는 조립과 이벤트 연결에 집중하도록 책임 축소

## 주요 변경
1. usecase 계층 추가
- `src/features/hand/usecases/analyze-hand-with-ai.ts`
  - AI 분석 호출 + DB upsert를 단일 유스케이스로 통합
- `src/features/hand/usecases/count-user-saved-hands.ts`
  - 사용자 저장 핸드 개수 조회 유스케이스 추가

2. DB 서비스 확장
- `src/features/hand/db/handService.ts`
  - `upsertHandAiAnalysis(...)` 추가
  - `countHandsByUser(...)` 추가

3. action-recording 전용 훅 분리
- `src/app/hands/[handId]/new/(action-recording)/_hooks/flow/use-ai-analysis-flow.ts`
- `src/app/hands/[handId]/new/(action-recording)/_hooks/flow/use-saved-hands-count.ts`
- `src/app/hands/[handId]/new/(action-recording)/_hooks/flow/use-hand-bootstrap.ts`
- `src/app/hands/[handId]/new/(action-recording)/_hooks/flow/use-street-advance-on-new-event.ts`
- `src/app/hands/[handId]/new/(action-recording)/_hooks/events/use-action-submit.ts`
- `src/app/hands/[handId]/new/(action-recording)/_hooks/index.ts` export 갱신

4. 페이지 조립화
- `src/app/hands/[handId]/new/(action-recording)/page.tsx`
  - 직접 API/DB 호출 제거
  - AI 실행/저장 카운트 조회/초기 부트스트랩/액션 append 로직을 훅으로 위임
  - 페이지는 상태 조합 + 컴포넌트 연결 역할로 축소

5. review 페이지 AI 경로 정리
- `src/app/hands/[handId]/review/page.tsx`
  - 직접 `requestAIAnalysis + supabase` 호출 제거
  - `analyzeHandWithAi` usecase 호출로 통일

6. 타입 정합성 개선
- `src/app/hands/[handId]/new/(action-recording)/_components/layout/action-area.tsx`
  - `onAction` 타입을 `ActionType` 기반으로 명확화

## 검증
- `pnpm exec tsc --noEmit`: 통과

## 비고
- 이번 단계는 코드 흐름/책임 분리 중심 리팩터링이며, UI 외형 변경은 의도적으로 제외
- 전역 lint 이슈는 기존 코드베이스 잔존 문제로 별도 단계에서 정리 필요
