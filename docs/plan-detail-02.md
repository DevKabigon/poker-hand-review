# Plan Detail 02 - 브랜드 컬러 기반 UI/UX 전면 개편

## 목표

- 브랜드 컬러 `#00bc7d`, `#8c52ff` 중심의 모던한 UI로 통일
- 최우선 항목: 랜딩 상단바를 플로팅 바로 변경하고 본문 폭과 정확히 정렬
- 랜딩 이후 인증/대시보드/핸드 작성 플로우까지 디자인 일관성 확보

## 범위

- `src/app/globals.css` 토큰
- `DefaultContainer` 폭 기준
- `src/app/(marketing)/page.tsx` 및 관련 섹션
- 공통 버튼/카드/배지 스타일

## 작업 순서

1. 디자인 토큰 재정의(`--primary`, `--accent`, `--ring`, `--muted`)
2. `DefaultContainer` 폭 기준 확정(`max-w-6xl` or `max-w-7xl`)
3. 랜딩 상단바를 `sticky + backdrop blur`로 개편
4. Hero/Features/Pricing 섹션의 간격/타이포 일괄 조정
5. 대시보드/핸드 작성 페이지에도 같은 UI 규칙 적용

## UX 개선 포인트

- 버튼 계층을 3단계만 유지: `primary`, `secondary`, `ghost`
- 카드 라운드/그림자/보더의 규격 통일
- 입력 폼의 에러/포커스 상태를 명확화
- 불필요한 시각 효과(중복 blur/중복 gradient) 제거

## 완료 기준

- 랜딩 상단바 폭이 본문과 정확히 일치
- 페이지 간 시각적 문법이 일관
- 색상/간격/타이포 규칙이 스타일 토큰으로 관리

## 간단 코드 스니펫

```css
/* src/app/globals.css */
:root {
  --brand-primary: #00bc7d;
  --brand-accent: #8c52ff;
  --primary: oklch(0.72 0.19 160); /* near #00bc7d */
  --accent: oklch(0.65 0.23 305);  /* near #8c52ff */
}
```

```tsx
// 랜딩 상단바 예시
<header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
  <DefaultContainer>
    <div className="flex h-16 items-center justify-between">{/* ... */}</div>
  </DefaultContainer>
</header>
```

