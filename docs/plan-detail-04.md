# Plan Detail 04 - 폴더 스트럭처 개선

## 목표

- 파일 집중도를 낮추고 관심사를 분리
- "페이지 조립"과 "비즈니스 로직"의 물리적 경계를 명확히 구성
- 기능 확장 시 파일 탐색 비용 감소

## 현재 핵심 문제

- `src/app/hands/[handId]/new/(action-recording)` 하위 파일 밀집
- `features/hand` 내부 일부 로직이 평평하게 배치
- 공통 로직과 기능 로직이 섞여 있는 구간 존재

## 권장 구조 (점진 전환)

```text
src/
  app/
  shared/
    ui/
    lib/
    i18n/
  entities/
    hand/
      model/
      lib/
  features/
    hand-record/
      model/
      ui/
      api/
    hand-review/
      model/
      ui/
      api/
```

## 작업 순서

1. `action-recording` 하위부터 `components/hooks/services`로 재정렬
2. 순수 유틸은 `shared/lib`로 승격
3. hand record/review 관련 UI를 기능 폴더로 이동
4. import alias 정리(`@/shared`, `@/entities`, `@/features`)
5. barrel export를 최소한으로 도입

## 마이그레이션 원칙

- 한 번에 대이동 금지
- 폴더 이동 후 즉시 타입체크/린트 확인
- 미사용 파일은 임시 `legacy/`로 옮긴 뒤 삭제 여부 확정

## 완료 기준

- 한 디렉터리에 과도한 파일 집중 없음
- 경로만 보고 코드 책임이 드러남(UI/model/api 구분)

## 간단 코드 스니펫

```ts
// src/features/hand-record/model/index.ts
export * from "./use-record-actions";
export * from "./record-hand.service";
```

```json
// tsconfig.json paths 예시
{
  "compilerOptions": {
    "paths": {
      "@/shared/*": ["./src/shared/*"],
      "@/entities/*": ["./src/entities/*"],
      "@/features/*": ["./src/features/*"]
    }
  }
}
```

