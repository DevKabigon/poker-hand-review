# Poker Hand Review 프로젝트 리서치 보고서

작성일: 2026-02-28  
대상 경로: `C:\Users\waou1\workspace\poker-hand-review`

## 1) 요약

이 프로젝트는 Next.js App Router 기반의 포커 핸드 기록/복기 SaaS이며, 핵심 철학은 **Event Sourcing + Cursor Replay**입니다.

- 상태의 원본은 `events` 배열이며, 화면 상태는 매번 재계산합니다.
- Undo/Redo/Jump는 이벤트 삭제가 아니라 `cursor` 이동으로 처리합니다.
- Record/Review 모드를 동일 UI 위에 얹고, 입력 가능 여부만 분기합니다.
- 인증/저장은 Supabase를 사용하고, AI 분석은 `/api/ai`를 통해 OpenAI에 요청합니다.

## 2) 기술 스택

- 프레임워크: Next.js `16.1.1`, React `19.2.3`, TypeScript `5`
- 상태관리: Zustand `5.0.9` (`persist` 포함)
- 스타일: Tailwind CSS `v4`, shadcn/ui, Radix UI, lucide-react
- 백엔드/BaaS: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- AI: OpenAI SDK (`openai`)
- 기타: SWR, nanoid, react-markdown, sonner

## 3) 런타임/설정 구조

### 3.1 최상위 설정

- `next.config.ts`: `reactCompiler: true`
- `tsconfig.json`: strict 모드, `@/*` alias
- `eslint.config.mjs`: Next + TS 규칙 사용
- `globals.css`: Tailwind v4 토큰 기반 테마 변수 구성

### 3.2 루트 레이아웃

`src/app/layout.tsx`에서 공통 구성:

- 로컬 폰트(`PretendardJPVariable.woff2`) 로딩
- `ThemeProvider`
- `AuthProvider` (앱 로드시 세션 초기화)
- `Toaster`
- Vercel Analytics

### 3.3 인증 게이트

`src/proxy.ts`:

- `/dashboard` 하위 경로는 로그인 필수
- 로그인 상태에서 `/auth/login`, `/auth/signup` 접근 시 `/dashboard` 리다이렉트
- 정적 에셋 경로 제외 matcher 적용

## 4) 디렉터리/레이어 구조

핵심 도메인은 `src/features/hand` 아래 3계층으로 분리되어 있습니다.

- `domain`: 타입/도메인 규칙/이벤트 팩토리
- `engine`: 순수 계산 로직(액션 유효성, 액터 선택, 팟/스택 계산)
- `editor`: Zustand 스토어, 서비스 계층, 페이지 훅

라우팅은 App Router 기반:

- 마케팅: `src/app/(marketing)`
- 인증: `src/app/auth/*`
- 대시보드/히스토리: `src/app/dashboard/*`
- 핸드 생성/기록/복기: `src/app/hands/[handId]/*`
- 정책/문의: `src/app/(policy)/*`

## 5) 데이터 모델

### 5.1 HandConfig

`src/features/hand/domain/handConfig.ts`

- `gameType`: `CASH | TOURNAMENT`
- `maxPlayers`: 2~10
- `players[]`: seat, name, stack, isHero, holdCards
- `blinds`: sb, bb, anteMode, anteAmount

`validateHandConfig`에서 주요 검증:

- maxPlayers 범위
- players 길이 일치
- hero 정확히 1명
- 스택 양수
- `sb < bb`, ante 모드 시 anteAmount 필수

### 5.2 이벤트 모델

`src/features/hand/domain/events.ts`

- `POST_BLINDS`
- `ACTION` (`FOLD/CHECK/CALL/BET/RAISE/ALL_IN`)
- `REVEAL_FLOP`, `REVEAL_TURN`, `REVEAL_RIVER`
- `SHOWDOWN`, `SHOWDOWN_REVEAL`

중요: `ACTION.amount`는 누적이 아니라 **delta(추가 투입 칩)** 입니다.

### 5.3 DB 스키마

`supabase/migrations/20250101000000_create_hands_table.sql`

- `hands` 테이블:
  - `hand_id`(unique), `user_id`, `config(jsonb)`, `events(jsonb)`, 메타데이터
  - `final_street`, `total_pot_chips`, `button_seat`
- RLS 정책: 사용자는 본인 핸드만 조회/삽입/수정/삭제 가능

`supabase/migrations/20250102000000_create_profiles_table.sql`

- `profiles` 테이블:
  - `plan`, `ai_credits_total`, `ai_credits_used`
- 회원가입 시 프로필 자동 생성 트리거

## 6) 핵심 동작 흐름

### 6.1 새 핸드 생성

1. `StartNewHandButton` 클릭
2. 새 `handId` 생성(`nanoid(10)`)
3. `reset({ keepSetup: false })`
4. `/hands/[handId]/new/setup` 이동

### 6.2 Setup 단계

`useSetupLogic`:

- 게임 타입, 플레이어 수, 블라인드, 평균 스택, 안티 설정 입력
- `setConfig`로 store 저장 후 players 단계 이동

### 6.3 Players 단계

- 플레이어 이름/스택/히어로 지정/홀카드 선택
- `startHand()` 호출 시 `POST_BLINDS` 이벤트 자동 생성
- 액션 기록 단계(`/hands/[handId]/new`) 이동

### 6.4 Action Recording 단계

핵심 파일:

- 페이지: `src/app/hands/[handId]/new/(action-recording)/page.tsx`
- 파생상태: `useHandEngineState`
- 액션 검증: `validateActionOrThrow`
- 스트리트 자동 진행: `shouldAdvanceStreet`, `useStreetAdvance`

흐름:

1. store의 `events/cursor/config/buttonSeat` 기반으로 파생 상태 계산
2. 액션 버튼 입력 시 `appendEvent(eventFactory.action(...))`
3. 엔진에서 현재 액터/합법 액션/콜 금액/레이즈 최소치 계산
4. 스트리트 완료 시 다음 스트리트 이벤트 또는 보드 카드 모달
5. 저장 시 `saveHand` 호출, DB에 insert

### 6.5 Review 단계

- `loadHand(handId)`로 DB에서 로드
- store를 `mode: "review"`로 전환
- Prev/Next 및 로그 점프는 `cursor` 조작으로만 처리
- AI 분석 결과가 있으면 재사용, 없으면 생성 가능

### 6.6 Dashboard/History

- `listHands()`로 목록 조회
- `HandRecord -> HandItem` 변환 후 카드 목록 UI 표시
- 삭제 시 `deleteHand()`

## 7) 엔진 상세 분석

### 7.1 블라인드/안티 계산

`computePostBlindsPosts(config, buttonSeat)`:

- active seat 필터(stack > 0)
- 헤즈업: 버튼=SB, 상대=BB
- 멀티웨이: 버튼 다음=SB, 다음=BB
- ANTE, BB_ANTE 누적 계산

### 7.2 액션 순서와 현재 액터

`getActionOrderForStreet` + `getNextActor`:

- preflop: BB 다음(UTG)부터
- postflop: 멀티웨이는 SB부터, 헤즈업은 BB부터
- fold/all-in seat 제외
- call 필요 seat 우선
- last aggression 이후 미응답 seat 우선

### 7.3 베팅 파생값

`computeBettingDerived`가 사실상 핵심 허브:

- 투자액 분리:
  - `investedBySeat`(총 투자: blind+ante+action)
  - `investedForBetBySeat`(베팅 레벨용: ante 제외)
- `callAmountBySeat`, `hasBetToCallBySeat`
- `currentTo`, `minRaiseTo`, `lastRaiseSize`
- short all-in에 따른 `canReopenBetting`

### 7.4 액션 유효성 검증

`validateActionOrThrow`:

- SHOWDOWN 액션 금지
- 현재 액터 seat 강제
- fold/all-in 이후 재행동 금지
- legal action 집합 기반 체크
- CHECK/FOLD/CALL/BET/RAISE/ALL_IN 각각 amount 규칙 검증
- short raise 상황에서 reopen 불가 seat의 RAISE/raise-like ALL_IN 제한

### 7.5 스트리트 완료/쇼다운

`shouldAdvanceStreet`:

- `getNextActor === null`이면 스트리트 완료
- fold로 1명 남으면 SHOWDOWN
- 모든 활성 플레이어가 올인이고 pending call 없으면 SHOWDOWN

### 7.6 팟/환불/스택

- `computePots`: 전체 투자액에서 메인/사이드팟 산출
- `applyUncalledRefund`: 라운드 종료 시 단독 eligible 팟 환불
- `computeStackBySeat`: 초기 스택 - (POST_BLINDS + ACTION delta)

## 8) 인증/저장/AI 연동

### 8.1 인증 상태

`useAuthStore`:

- 초기 세션 조회 + onAuthStateChange 구독
- 로그인 시 profile(plan/credits) 로드

### 8.2 핸드 저장 서비스

`handService.ts`:

- `saveHand`, `loadHand`, `listHands`, `updateHand`, `deleteHand`
- 저장 시 `replayToCursor`로 `final_street` 계산
- `computePots + applyUncalledRefund(roundClosed=true)`로 `total_pot_chips` 계산

### 8.3 AI 분석

- 프론트: `requestAIAnalysis()` -> `/api/ai` POST
- 서버: OpenAI `chat.completions.create` (`gpt-4o`)
- Record/Review 페이지에서 분석 결과를 hands 테이블의 `ai_analysis`에 저장/업데이트 시도

## 9) UI 컴포넌트 관찰

- `src/components/poker/*`: 테이블, 좌석, 액션패널, 카드선택, 플레이어 편집
- `src/components/ui/*`: shadcn/radix 기반 프리미티브 래퍼
- `poker-table`은 Hero 기준 좌석 회전, 보드/팟/칩/액션배지 렌더를 담당
- `action-panel`은 입력 BB 단위, 내부적으로 TO(chips) 변환 후 엔진 액션 전송

## 10) 정적 검사 결과 (현 상태)

`pnpm lint` 기준:

- 총 `66`건 (`41 error`, `25 warning`)
- 주요 카테고리:
  - `@typescript-eslint/no-explicit-any`
  - `react-hooks/exhaustive-deps`
  - `react-hooks/set-state-in-effect`
  - `react-hooks/preserve-manual-memoization`
  - `react/no-unescaped-entities`
  - `@next/next/no-img-element`

## 11) 리스크/불일치 포인트

### 11.1 DB 마이그레이션과 코드 불일치

- 코드/타입은 `hands.ai_analysis` 컬럼을 사용
- 현재 마이그레이션 파일에는 `ai_analysis` 컬럼 정의가 없음
- 결과: AI 저장/조회 로직에서 런타임 오류 가능

### 11.2 스트리트 이벤트 중복 방지 조건 버그 가능성

`useStreetAdvance.ts`의 `alreadyHasEvent` 체크:

- `e.type`(예: `REVEAL_FLOP`)를 `nextStreet`(예: `FLOP`)와 직접 비교
- 타입 문자열이 달라 항상 false가 될 수 있음

### 11.3 `replaceStreetEvents`의 RIVER 처리 중복

`handEditorStore.ts`의 `replaceStreetEvents` 내부에서:

- `street === "RIVER"` 분기 안에서 한 번 처리
- 함수 하단에서 다시 `if (street === "RIVER")` 처리
- 중복 교체/삽입 리스크

### 11.4 문서와 구현의 이벤트 타입 불일치

- 문서에는 `SET_HOLECARDS` 이벤트가 등장
- 실제 `TimelineEvent`에는 해당 타입 없음 (홀카드는 config에서 관리)

### 11.5 Free 저장 한도 UX와 실제 제약 불일치

- Save dialog에서 한도 초과 안내는 있으나 저장 버튼 자체는 코드상 차단되지 않음
- 서버/DB 레벨 강제 제한 로직도 확인되지 않음

### 11.6 사용되지 않는 코드/중복 코드 존재

- `validateAppendEvent.ts`, `computeMinRaise.ts`, `getMinRaiseInfo.ts`, `main-header.tsx`, `mockHands` 등 참조 없음
- 유지보수 비용 상승 요인

### 11.7 보안/운영 측면

- `/api/ai`에 인증/레이트리밋 방어 로직 없음
- 악의적 호출 시 비용/남용 리스크

## 12) 현재 아키텍처의 강점

- 이벤트 소싱 원칙을 코드 전반에 강하게 반영
- 도메인/엔진/에디터 분리가 비교적 명확
- UI 복잡도 대비 상태 계산을 파생 중심으로 유지
- RLS 정책 포함으로 사용자 데이터 접근 경계가 분명

## 13) 결론

이 프로젝트는 **핸드 기록/복기 문제를 이벤트 로그 중심으로 풀기 위한 구조적 기반이 이미 탄탄**합니다.  
특히 `computeBettingDerived` + `getNextActor` + `validateAction` 축이 핵심 게임 로직을 일관되게 통제하고 있습니다.

다만 린트 에러가 다수 남아 있고, 일부 코드/스키마 불일치(특히 `ai_analysis` 컬럼)와 중복 로직이 존재해, 운영 안정성을 높이려면 정리 작업이 필요합니다.
