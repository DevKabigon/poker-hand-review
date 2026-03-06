# Design Fix 02 - Global Theme Reset

작성일: 2026-02-28  
범위: Phase 1 / Step 2 (글로벌 CSS 토큰 리셋)

## 수행 목표

- Soft Tactile Analyst 컨셉에 맞는 전역 디자인 토큰 재정의
- 순백/순흑 금지 원칙 적용 (soft white / soft black)
- 다크/라이트 모드 모두 동일한 브랜드 일관성 유지
- 타이포/배경/스크롤바의 기본 질감 정리

## 변경 파일

- `src/app/globals.css`

## 작업 내용

1. 컬러 토큰 전면 재정의
- `:root`, `.dark`의 `background`, `foreground`, `card`, `muted`, `border`, `input`, `ring` 재설정
- 브랜드 토큰 추가:
  - `--brand-primary`
  - `--brand-accent`
- 표면/깊이 토큰 추가:
  - `--surface-soft`
  - `--surface-elevated`
  - `--shadow-soft`
  - `--shadow-press`

2. 모드별 배경 질감 추가
- `body::before`에 브랜드 색 기반의 부드러운 radial gradient 적용
- `body::after`에 미세 텍스처(노이즈 느낌) 오버레이 적용
- 과한 장식 없이 깊이감만 남기도록 opacity를 낮게 설정

3. 타이포 기본값 개선
- 전역 폰트 스택을 현 프로젝트 폰트 중심으로 고정
- `h1~h4` `letter-spacing`/`text-wrap: balance` 적용
- 본문 텍스트 `text-wrap: pretty` 적용

4. 사용성 디테일
- `::selection` 색상 브랜드 톤으로 통일
- 스크롤바를 얇은 rounded 형태로 통일
- hover 시 브랜드색이 살짝 섞이도록 조정

## 검증

- `pnpm exec tsc --noEmit` 통과

## 비고

- 이번 단계는 토큰/전역 스타일만 변경했으며, 컴포넌트 구조/페이지 레이아웃은 변경하지 않음
- 다음 단계(03)에서 pressable 버튼/컴포넌트 스타일 시스템을 본격 적용 예정
