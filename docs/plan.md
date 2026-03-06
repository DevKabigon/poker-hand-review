# Poker Hand Review 리뉴얼 실행 계획서 (plan.md)

작성일: 2026-02-28  
기준 문서: `docs/research.md`  
목표: 디자인/구조/흐름을 전면 정비하면서, 기존 핵심 기능(핸드 기록/복기 엔진)은 안정적으로 재사용

---

## 1. 프로젝트 목표

요청하신 0~7 요구사항을 기준으로 다음을 달성합니다.

1. 브랜드(로고/OG) 반영
2. 전체 UI/UX를 모던하게 리디자인 (브랜드 컬러: `#00bc7d`, `#8c52ff`)
3. UI 다국어 지원(한국어/영어/일본어)
4. 폴더 구조 재정비(관심사 분리, 계층화)
5. 코드 흐름 정리(UI에서 비즈니스 로직 분리)
6. 유료/AI 기능 제거 (문서만 유지)
7. DB 마이그레이션 정리(유료/AI 제거 후속)
8. 재사용 가능 코드와 개선 대상 코드 분리

---

## 2. 핵심 원칙

- 엔진 우선 재사용: `src/features/hand/domain`, `src/features/hand/engine`는 최대한 유지
- UI/비즈니스 분리: 페이지 컴포넌트는 조립만, 규칙/검증/변환은 서비스/훅/유스케이스로 이동
- 단계적 이행: 디자인 변경과 구조 변경을 한 번에 뒤엎지 않고, 기능 유지 가능한 순서로 진행
- 린트/타입 안정성 복원: 리뉴얼 중 `pnpm lint` 에러를 함께 줄여 최종 품질 확보

---

## 3. 요구사항별 상세 계획

## 0) 로고 및 OG 이미지 변경

현황:

- `public/Logo.png`, `public/og-image.png` 존재
- 현재 `src/app/layout.tsx` 메타데이터는 `icons.icon = "/favicon.png"` (실제 파일 없음)

실행:

- `src/app/layout.tsx` `metadata` 갱신
  - `icons.icon` -> `"/Logo.png"` 또는 별도 생성 favicon 파일로 변경
  - `openGraph.images` -> `"/og-image.png"`
  - `twitter.images` -> `"/og-image.png"`
- 공통 헤더 로고(`Spade` 아이콘 사용 중)를 이미지 로고 컴포넌트로 통일
  - 대상: 마케팅/대시보드/설정/핸즈/인증 헤더

완료 기준:

- 탭 아이콘, OG 프리뷰 모두 새 에셋 반영
- 브랜드 로고가 모든 주요 헤더에서 일관 표출

---

## 1) UI/UX 전면 개편 (브랜드 색 기준)

디자인 방향:

- 톤: “클린 + 모던 + 테크니컬” (과한 장식 대신 명확한 정보 구조)
- 메인 컬러: `#00bc7d` (Primary), `#8c52ff` (Accent)
- 우선순위: 랜딩 상단바를 플로팅/고정 바 형태로 먼저 정비, 본문 폭과 정확히 정렬

실행 항목:

- 디자인 토큰 재정의 (`src/app/globals.css`)
  - `--primary`, `--ring`, `--accent` 및 상태 색 정리
  - 라이트/다크 양쪽 대비 규칙 통일
- 공통 레이아웃 폭 통일
  - `DefaultContainer` 단일 기준으로 모든 페이지 폭 일치
  - 상단바/본문 폭 mismatch 제거
- 랜딩 페이지 우선 리디자인
  - `src/app/(marketing)/page.tsx` 중심으로 섹션 재정렬
  - 상단바, Hero, CTA, 카드 그리드 가독성 개선
- 인증/대시보드/핸드 플로우 UI 일관화
  - 버튼 계층(Primary/Secondary/Ghost) 통일
  - 카드/테이블/모달 radius/shadow/spacing 통일

완료 기준:

- 랜딩 상단바와 본문 폭 완전 일치
- 주요 페이지에서 컴포넌트 스타일 규칙(간격/폰트/버튼)이 일관
- 브랜드 컬러 2종 중심의 시각 아이덴티티 확립

---

## 2) 다국어 패치 (ko/en/ja)

권장 구현:

- `next-intl` 기반(App Router 친화)
- 로케일: `ko`, `en`, `ja`
- 기본 로케일: `ko` (필요 시 변경 가능)

구조 제안:

- `src/shared/i18n/`
  - `config.ts` (지원 로케일, 기본 로케일)
  - `messages/ko.json`, `messages/en.json`, `messages/ja.json`
  - `getDictionary.ts` 또는 `next-intl` provider 래퍼
- UI 문자열 하드코딩 제거
  - 페이지/컴포넌트 텍스트를 메시지 키로 치환

우선 번역 범위:

- 상단 네비게이션, CTA, 버튼, 폼 라벨, 토스트, 다이얼로그
- 인증/대시보드/핸드 기록/복기 핵심 플로우

완료 기준:

- 로케일 변경 시 UI 텍스트 전체 반영
- 하드코딩 텍스트 최소화 (남아도 TODO 라벨링)

---

## 3) 폴더 스트럭처 개선

현재 문제:

- `src/app/hands/[handId]/new/(action-recording)` 내부 파일 밀집
- `features/hand` 내부도 일부 파일이 평평하게 많음
- 공용/도메인/프레젠테이션 경계가 약한 구간 존재

목표 구조(점진적 전환):

```text
src
  app
    (routes...)
  shared
    ui
    lib
    config
    i18n
  entities
    hand
      model
      lib
      ui
  features
    auth
      model
      api
      ui
    hand-record
      model
      api
      ui
    hand-review
      model
      api
      ui
  widgets
    header
    hand-table
    hand-log
```

실행 방식:

- Big-bang 금지, 영역별 점진 이동
- 1차: `action-recording` 하위를 `components/hooks/services`로 세분
- 2차: 공용 로직을 `shared`로 승격
- 3차: 페이지 조립단과 기능 모듈을 분리

완료 기준:

- 한 폴더에 과도한 파일 집중 해소
- 파일명만 보고 역할(UI/모델/API)이 드러남

---

## 4) 코드 진행 흐름 개선/리팩터링

목표 흐름:

- `UI -> useCase/service -> API client -> DB`
- UI 컴포넌트는 입력/이벤트 전달과 렌더만 담당

적용 규칙:

- 페이지 컴포넌트에서 직접 비즈니스 계산 금지
- `useMemo/useEffect` 내 복합 로직은 도메인 함수로 추출
- API 호출은 feature별 `api/` 모듈에서만 수행

우선 리팩터링 대상:

- `src/app/hands/[handId]/new/(action-recording)/page.tsx`
- `src/app/hands/[handId]/review/page.tsx`
- `src/components/poker/action-panel.tsx` (UI/계산 결합도 높음)
- `src/features/hand/editor/handEditorStore.ts` (`replaceStreetEvents` 분리 필요)

완료 기준:

- 페이지 파일의 책임이 “조립 + 이벤트 연결” 수준으로 축소
- 비즈니스 규칙 함수가 재사용 가능한 모듈로 분리

---

## 5) 유료 기능/AI API 제거

요구사항: 수요 조사 전까지 유료 기능과 AI 기능 제거, 문서만 유지

제거 대상(코드):

- `src/app/api/ai/route.ts`
- `src/features/hand/api/aiAnalysis.ts`
- `src/components/ai-analysis-sheet.tsx`
- Record/Review 페이지 내 AI 상태/버튼/저장 로직
- 플랜/크레딧 UI (`pricing`, `billing`, dashboard 크레딧 카드)
- `useAuthStore`의 `profile.plan/credits` 의존 UI

정리 대상(의존성/문서):

- `package.json`에서 `openai`, `stripe`, `@stripe/stripe-js` 제거 검토
- README에서 AI/결제 관련 문구 제거 또는 “향후 예정”으로 문서화
- `OPENAI_API_KEY` 환경변수 제거

주의:

- DB `profiles` 스키마는 즉시 삭제보다 “미사용 상태”로 두고 단계적으로 정리
- 향후 재도입 가능성을 위해 `docs/ai-roadmap.md` 형태 문서만 남김

완료 기준:

- 앱 내 AI 실행 경로 완전 제거
- 결제/플랜 화면 진입 경로 제거
- 빌드/린트 시 AI/결제 관련 참조 에러 0

---

## 6) DB 마이그레이션 정리

목표:

- 무료 단일 플로우 기준으로 DB 스키마 정합성 맞추기
- `profiles`의 유료/AI 잔재 컬럼 정리

실행:

- Supabase 초기화 기준으로 마이그레이션 파일을 단일 초기 SQL로 재작성
- 초기 SQL에 아래 포함
  - `hands` 테이블/인덱스/RLS/트리거
  - `profiles.username` 포함 테이블/RLS/가입 트리거
  - 가입 트리거에서 provider 메타데이터(`username/full_name/name`) 또는 이메일 prefix로 username 자동 생성
  - 유료/AI 관련 컬럼(`plan`, `ai_credits_*`) 미포함

완료 기준:

- 신규 DB reset 기준으로 유료/AI 컬럼이 생성되지 않음
- 회원가입 시 `profiles.id` 행은 정상 생성
- 이메일+비밀번호/구글 로그인 모두 `profiles.username`이 자동 생성됨
- 사용자 설정 페이지에서 username 변경 후 즉시 UI에 반영됨
- 코드/스키마 간 불필요한 유료/AI 결합 제거

---

## 7) 재사용 코드 vs 개선 코드 분리

## 7.1 재사용 우선 (핵심 자산)

- `src/features/hand/domain/*`
- `src/features/hand/engine/*`
- `src/features/hand/editor/services/handStartService.ts`
- `src/features/hand/editor/services/eventAppendService.ts` (정리 후 재사용)
- `src/features/hand/db/handService.ts` (타입 정리 후 재사용)
- `src/components/ui/*` (shadcn 기반 공용)

## 7.2 개선 필요 (분리/정리 우선)

- `src/app/hands/[handId]/new/(action-recording)/page.tsx`
- `src/app/hands/[handId]/review/page.tsx`
- `src/components/poker/action-panel.tsx`
- `src/features/hand/editor/handEditorStore.ts` (`replaceStreetEvents` 중복 처리)
- 하드코딩 텍스트가 많은 페이지(마케팅/정책/인증)

## 7.3 제거 예정

- AI/유료 기능 관련 파일 일체
- 사용되지 않는 유틸/엔진 파일(실사용 검증 후 삭제)

---

## 4. 단계별 실행 로드맵

## Phase 1: 브랜딩/기반 정리 (1~2일)

- 로고/OG 메타데이터 반영
- 글로벌 토큰/레이아웃 폭 기준 확정
- Supabase 마이그레이션 정합성 점검/정리

산출물:

- 브랜드 반영된 공통 헤더/메타
- 환경 변수 가이드

## Phase 2: AI/유료 기능 제거 (1~2일)

- AI API 및 UI 제거
- 결제/플랜 UI 제거 또는 임시 비활성
- 의존성 정리

산출물:

- 무료 단일 플랜 제품으로 단순화된 코드베이스

## Phase 3: i18n 도입 (2~3일)

- i18n 인프라 구축
- 핵심 플로우 문자열 전환
- 로케일 스위처 추가

산출물:

- `ko/en/ja` 전환 가능한 UI

## Phase 4: UI/UX 리디자인 (3~5일)

- 랜딩 상단바/히어로 우선 개편
- 인증/대시보드/핸드 플로우 디자인 통일
- 모바일/데스크톱 반응형 정돈

산출물:

- 브랜드 일관성 있는 전체 화면

## Phase 5: 구조 개편 + 흐름 리팩터링 (3~5일)

- 폴더 계층 분리
- 페이지 비즈니스 로직 추출
- 린트 에러 대량 정리

산출물:

- 유지보수 가능한 구조 + 책임 분리된 코드

## Phase 6: QA/문서화 (1~2일)

- 린트/타입/핵심 플로우 점검
- README/개발 가이드 업데이트
- 향후 AI 재도입 문서(옵션)

---

## 5. 파일 단위 변경 예정 맵

브랜드/메타:

- `src/app/layout.tsx`
- `public/Logo.png`, `public/og-image.png` 사용 반영

디자인 시스템:

- `src/app/globals.css`
- `src/components/default-container.tsx`
- 공통 헤더 계열 파일

i18n:

- `src/shared/i18n/*` (신규)
- `src/app/**/*` 주요 페이지 텍스트 치환

AI/유료 제거:

- 삭제: `src/app/api/ai/route.ts`, `src/features/hand/api/aiAnalysis.ts`, `src/components/ai-analysis-sheet.tsx`
- 수정: `src/app/hands/[handId]/new/(action-recording)/page.tsx`, `src/app/hands/[handId]/review/page.tsx`
- 수정/정리: `src/app/pricing/page.tsx`, `src/app/settings/billing/page.tsx`, `src/features/auth/store/useAuthStore.ts`

구조/흐름 리팩터링:

- `src/app/hands/[handId]/new/(action-recording)/*`
- `src/features/hand/editor/*`
- `src/components/poker/action-panel.tsx`

마이그레이션/문서:

- `supabase/migrations/*`
- `README.md`
- `docs/*` (리뉴얼/AI 재도입 메모)

---

## 6. 품질 게이트 (완료 조건)

- `pnpm lint` 에러 0
- 주요 사용자 플로우 수동 테스트 통과
  - 새 핸드 설정 -> 액션 기록 -> 저장 -> 히스토리 -> 리뷰
- 다국어 3종 동작 확인
- AI/유료 코드 경로 제거 확인
- 디자인 일관성 체크(헤더/본문 폭, 버튼 계층, 색상 토큰)

---

## 7. 리스크 및 대응

리스크:

- 구조 개편 중 import 경로 파손
- i18n 도입 시 App Router/인증 게이트 충돌
- AI/유료 제거 시 연쇄 참조 에러

대응:

- 단계별 커밋(Phase 단위)
- 기능 단위 리그레션 체크리스트 운영
- “제거” 작업은 먼저 참조 정리 후 파일 삭제

---

## 8. 즉시 착수 권장 순서

1. 브랜드 메타/헤더 통일  
2. AI/유료 코드 제거  
3. i18n 인프라 도입  
4. 랜딩 상단바 포함 UI 전면 개편  
5. 구조/흐름 리팩터링 + 린트 정리
