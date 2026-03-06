# Plan Detail 05 - 코드 진행 흐름 개선 및 리팩터링

## 목표

- 흐름 표준화: `UI -> 비즈니스 로직(useCase/service) -> API -> DB`
- UI 컴포넌트에서 직접 비즈니스 규칙 계산 금지
- 테스트 가능한 단위(service/usecase)로 로직 분리

## 현재 문제 패턴

- 페이지 컴포넌트(`page.tsx`)에 상태/검증/데이터 호출이 과도하게 집중
- UI 파일에서 도메인 규칙을 직접 계산
- effect 내부 동기 setState, 의존성 누락 등 린트 리스크 존재

## 리팩터링 전략

1. 페이지의 이벤트 핸들러를 useCase 훅으로 추출
2. 도메인 검증/변환 로직을 service 함수로 이동
3. API 호출은 `features/*/api`로 단일화
4. UI 컴포넌트는 props 기반 dumb component로 단순화

## 우선 대상

- `src/app/hands/[handId]/new/(action-recording)/page.tsx`
- `src/app/hands/[handId]/review/page.tsx`
- `src/components/poker/action-panel.tsx`
- `src/features/hand/editor/handEditorStore.ts`

## 코드 규칙

- page/component 파일 내 비즈니스 계산은 최대 1단계까지 허용
- 복잡 분기는 service/usecase로 이동
- 에러 메시지/토스트 문구도 메시지 매퍼로 관리

## 완료 기준

- 페이지 파일은 "조립 + 이벤트 연결" 역할만 수행
- 핵심 규칙 로직은 독립 함수 단위로 테스트 가능

## 간단 코드 스니펫

```tsx
// UI
export function SaveButton({ onSave, disabled }: { onSave: () => void; disabled: boolean }) {
  return <button onClick={onSave} disabled={disabled}>Save</button>;
}
```

```ts
// usecase
export async function executeSaveHand(input: SaveHandInput, deps: { saveHand: (v: SaveHandInput) => Promise<void> }) {
  if (!input.config) throw new Error("config is required");
  if (!input.events.length) throw new Error("events are empty");
  await deps.saveHand(input);
}
```

```tsx
// page
const onSave = async () => {
  await executeSaveHand(payload, { saveHand });
  toast.success(t("common.saved"));
};
```

