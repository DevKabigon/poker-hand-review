# Plan Detail 08 - 재사용 가능한 코드와 개선 코드 분리

## 목표

- 기능 안정성이 높은 코드는 재사용 우선
- 유지보수 비용이 큰 파일은 개선 대상으로 분리
- 리뉴얼 범위를 명확히 하여 일정/리스크를 통제

## 분류 기준

- 재사용:
  - 도메인 규칙이 명확하고 테스트 가능한 순수 함수
  - UI와 강결합이 낮은 서비스/엔진 코드
- 개선:
  - 페이지에 로직 과밀
  - effect/setState/의존성 문제가 반복
  - UI+비즈니스 혼합도가 높은 파일
- 제거:
  - 현재 제품 범위(무료 플랜) 밖 기능

## 1차 분류 결과

### 재사용 우선

- `src/features/hand/domain/*`
- `src/features/hand/engine/*`
- `src/features/hand/editor/services/handStartService.ts`
- `src/features/hand/editor/services/eventAppendService.ts`
- `src/components/ui/*`

### 개선 우선

- `src/app/hands/[handId]/new/(action-recording)/page.tsx`
- `src/app/hands/[handId]/review/page.tsx`
- `src/components/poker/action-panel.tsx`
- `src/features/hand/editor/handEditorStore.ts`

### 제거 우선

- AI/유료 관련 파일 및 의존성

## 실행 프로세스

1. 파일별 분류 태그 부여 (`reuse`, `refactor`, `remove`)
2. `refactor` 대상부터 우선순위 정렬(사용자 영향도 기준)
3. 변경 후 `lint -> 핵심 플로우 QA -> 문서 업데이트` 반복

## 완료 기준

- 재사용 코드는 최소 수정으로 유지
- 개선 코드는 책임 분리 완료
- 제거 코드는 잔여 참조 0

## 간단 코드 스니펫

```ts
// docs 분류 예시(내부 체크용)
type WorkTag = "reuse" | "refactor" | "remove";

const planMap: Record<string, WorkTag> = {
  "src/features/hand/engine/reducer.ts": "reuse",
  "src/components/poker/action-panel.tsx": "refactor",
  "src/app/api/ai/route.ts": "remove",
};
```

```bash
# 분류 검증용 참조 검색 예시
rg -n "requestAIAnalysis|/api/ai|plan|credit|billing" src
```

