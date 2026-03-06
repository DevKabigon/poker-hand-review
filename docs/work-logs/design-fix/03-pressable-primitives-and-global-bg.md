# Design Fix 03 - Pressable Primitives + Global Background

작성일: 2026-02-28  
범위: Phase 1 / Step 3 (shadcn 커스텀 + 전역 배경 통일 보정)

## 반영 요청

- 듀오링고 느낌의 눌리는 버튼(press-down effect) 적용
- 배경 질감이 랜딩뿐 아니라 모든 페이지에서 일관되게 보이도록 수정

## 변경 파일

- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/badge.tsx`
- `src/components/start-new-hand-button.tsx`
- `src/app/[locale]/(marketing)/page.tsx`
- `src/app/[locale]/auth/login/page.tsx`
- `src/app/[locale]/auth/signup/page.tsx`
- `src/app/[locale]/settings/page.tsx`
- `src/app/[locale]/dashboard/layout.tsx`
- `src/app/[locale]/dashboard/history/page.tsx`
- `src/app/[locale]/dashboard/_components/header.tsx`
- `src/app/[locale]/dashboard/_components/footer.tsx`
- `src/features/auth/ui/nav-user-area.tsx`
- `src/app/[locale]/hands/[handId]/new/layout.tsx`
- `src/app/[locale]/hands/[handId]/review/page.tsx`
- `src/app/[locale]/hands/[handId]/new/(action-recording)/page.tsx`
- `src/app/[locale]/(policy)/privacy/page.tsx`
- `src/app/[locale]/(policy)/terms/page.tsx`
- `src/app/[locale]/(policy)/contact/page.tsx`
- `src/app/[locale]/(marketing)/_components/footer.tsx`

## 작업 내용

1. Pressable 버튼 시스템 적용
- `Button` variant별로 깊이 그림자 + `hover lift` + `active press` 추가
- `default/outline/secondary/destructive/ghost/link` 모두 tactile 피드백 통일
- 기존 `StartNewHandButton`의 `active:scale` 제거해 중복 인터랙션 충돌 해소

2. shadcn 표면 컴포넌트 톤 조정
- `Card`를 `bg-card + backdrop blur + soft shadow`로 재정의
- `Input/Textarea`를 카드 표면형 입력 스타일로 재정의
- `Badge`를 기존 평면형에서 입체감 있는 pill 스타일로 조정

3. 전역 배경 통일(요청 반영)
- 페이지 최상위 래퍼의 `bg-slate-*`, `bg-background` 덮어쓰기 제거/완화
- `bg-transparent` 또는 `bg-background/투명` 계열로 교체
- 결과적으로 `body` 글로벌 배경 질감(gradient + texture)이 모든 페이지에 노출

## 검증

- `pnpm exec tsc --noEmit` 통과

## 비고

- 이번 단계는 “기본 디자인 시스템 + 전역 배경 통일”에 집중
- 다음 단계에서 랜딩 플로팅 네브/본문 폭 정렬 및 대대적 섹션 재구성 진행

## 사용자 피드백 반영 (추가)

1. 버튼 variant 재정렬
- 사용자 제안안 기반으로 `Button` variant를 아래로 확장/재정렬
  - `default`, `primary`, `primaryOutline`
  - `secondary`, `secondaryOutline`
  - `danger`, `dangerOutline`
  - `super`, `superOutline`
  - `ghost`, `sidebar`, `sidebarOutline`
- 기존 코드 호환을 위해 `outline`, `destructive`, `link` alias 유지

2. 컨셉 톤 재잠금
- 기존 “soft tactile” 방향은 유지하되
- 제품 톤을 더 명확히 `Professional + Pressable Utility`로 조정
- 의미:
  - 게임 UI처럼 과장하지 않음
  - 버튼 피드백은 강하게
  - 정보 구조는 분석 도구답게 정제

3. 버튼 컬러 역할 재매핑 + 다크모드 hover 일관성
- 사용자 요구에 맞게 색상 역할 재배치
  - `primary` -> Green
  - `secondary` -> Purple
  - `super` -> Blue
- outline 계열도 동일 매핑으로 변경
- 다크모드 hover 시 눌림 그림자(깊이감)가 사라지지 않도록
  - 각 variant에 `shadow`, `hover:shadow`, `active:shadow`를 명시적으로 부여
  - 라이트/다크에서 동일한 press-down 체감 유지

4. 재요청 반영: 사용자 제공 cva 구조 기준으로 재작성
- `src/components/ui/button.tsx`를 사용자 제공 스니펫 형태로 다시 맞춤
- 적용 내용:
  - variant/size 구조 및 클래스 스타일을 스니펫 기준으로 정렬
  - 색상 규칙만 요구사항대로 변경
    - `primary` 초록
    - `secondary` 보라
    - `super` 파랑
  - 다크모드에서 라이트와 동일 hover 동작을 유지하도록 별도 `dark:hover:*` 규칙 제거
- 호환성:
  - 기존 코드의 `outline/destructive/link` 사용 경로를 위한 alias 유지
  - `icon-sm/icon-lg` 사이즈 호환 유지

5. 마지막 조정: 다크모드 hover 색상 뒤집힘 제거
- 사용자 피드백 기준으로 `Button` variant의 다크 전용 hover 색 변경을 완전히 제거
- 현재는 라이트/다크 모두 동일한 hover 규칙을 사용하고, 모드 차이는 base 색상만 반영
