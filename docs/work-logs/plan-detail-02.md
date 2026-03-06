# Work Log - Plan Detail 02 (Adjusted Scope)

## 작업 일시
- 2026-02-28

## 요청 반영 범위
- 다국어(i18n)는 보류
- 현재 상태 기준으로 아래만 우선 구현
  - 랜딩 페이지 가로 스크롤 제거
  - 랜딩 페이지 프라이싱 카드 섹션 제거
  - 랜딩 페이지 정보 구조 간략화

## 적용 내용
1. 랜딩 루트 overflow 제어
- 파일: `src/app/(marketing)/page.tsx`
- 루트 래퍼에 `overflow-x-hidden` 추가
- 배경 글로우 레이어를 `absolute + overflow-hidden` 컨테이너로 분리해 가로 넘침 방지

2. 랜딩 섹션 단순화
- 파일: `src/app/(marketing)/page.tsx`
- 제거:
  - Problem/Solution 장문 섹션
  - Pricing 카드 섹션(Free/Standard 카드)
- 축소/정리:
  - Hero 카피와 CTA 단순화
  - How it works 유지 (3-step)
  - Core features를 3개 핵심 카드로 축약
  - 마지막 CTA 섹션을 컴팩트 형태로 유지

3. 상단 내비게이션 정리
- 파일: `src/app/(marketing)/page.tsx`
- `Pricing` 앵커 제거
- 파일: `src/app/(marketing)/_components/header.tsx`
- `Pricing` 앵커 제거
- `#how` -> `#how-it-works`로 수정

## 검증
- `pnpm exec tsc --noEmit`: 통과

## 비고
- 이번 작업은 사용자 요청에 따라 02의 원래 항목(다국어)을 의도적으로 미적용함
- i18n은 이후 별도 단계에서 적용 예정
