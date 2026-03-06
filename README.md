# Poker Hand Review

텍사스 홀덤 핸드를 정확하게 기록하고 자유롭게 복기할 수 있는 사이트입니다.

## 핵심 가치

- **기록의 정확성** - 모든 액션/카드 공개는 시간 순서 이벤트로 기록됩니다
- **자유로운 탐색** - Undo/Redo/Jump를 통해 긴 핸드에서도 원하는 지점으로 즉시 이동할 수 있습니다
- **일관된 UI** - 기록과 복기는 동일한 UI를 사용하며, 입력 가능 여부만 다릅니다. 상태 계산 로직은 완전히 동일합니다

## 주요 기능

- ✅ 정확한 핸드 기록 - Event Sourcing 패턴 기반의 이벤트 로그 시스템
- ✅ Undo/Redo/Jump - Cursor 기반의 자유로운 타임라인 탐색
- ✅ Record/Review 모드 - 동일한 UI로 기록과 복기 모두 지원
- ✅ 실시간 상태 계산 - 이벤트를 재생하여 항상 정확한 상태 유지
- ✅ 포커 테이블 시각화 - 직관적인 UI로 핸드 진행 상황 확인

## 기술 스택

### Core

- **Next.js** 16.1.1 - React 프레임워크
- **React** 19.2.3 - UI 라이브러리
- **TypeScript** 5 - 타입 안정성

### State & Data

- **Zustand** 5.0.9 - 클라이언트 상태 관리
- **Supabase** - 인증 및 데이터베이스
- **SWR** 2.3.8 - 데이터 페칭

### UI

- **Tailwind CSS** 4 - 스타일링
- **Radix UI** - 접근성 있는 컴포넌트
- **Lucide React** - 아이콘
- **next-themes** - 다크 모드 지원

### Development

- **ESLint** - 코드 품질
- **React Compiler** - 자동 최적화

## 아키텍처

이 프로젝트는 **Event Sourcing 패턴**을 기반으로 합니다.

### 핵심 개념

#### 1. 이벤트 로그가 유일한 진실 (Single Source of Truth)

핸드의 모든 변화는 이벤트로 기록됩니다. 데이터베이스에 저장된 이벤트 시퀀스가 유일한 진실이며, 상태는 언제나 이벤트를 재생해서 계산합니다.

```typescript
// 상태 계산 규칙
baseState = apply(HandConfig + POST_BLINDS);
stateAtCursor = reduce(baseState, timelineEvents.slice(0, cursor));
```

#### 2. Cursor 기반 Replay 시스템

`cursor`는 현재 적용된 마지막 타임라인 이벤트 인덱스를 의미합니다. 모든 탐색(Undo/Redo/Jump)은 cursor 이동으로만 처리합니다.

- `cursor = 0` → POST_BLINDS까지 적용된 기본 상태
- `cursor = N` → N번째 이벤트까지 적용된 상태

#### 3. Timeline Events

게임 상태에 영향을 주는 모든 변경은 타임라인 이벤트로 취급합니다:

| 타입              | 설명                                       |
| ----------------- | ------------------------------------------ |
| `POST_BLINDS`     | 블라인드/안티 포스팅                       |
| `ACTION`          | Fold / Call / Bet / Raise / Check / All-in |
| `REVEAL_FLOP`     | 플랍 카드 공개                             |
| `REVEAL_TURN`     | 턴 카드 공개                               |
| `REVEAL_RIVER`    | 리버 카드 공개                             |
| `SHOWDOWN`        | 쇼다운 진입                                |
| `SHOWDOWN_REVEAL` | 쇼다운 카드 공개                           |

### 아키텍처 레이어

```
src/features/hand/
├── domain/          # 도메인 모델 (이벤트, 설정, 카드)
├── engine/          # 순수 상태 계산 로직 (reducer, validation)
└── editor/          # 편집 상태 관리 (store, services)
```

## 시작하기

### 필수 요구사항

- Node.js 20 이상
- pnpm (권장) 또는 npm/yarn
- Supabase 프로젝트

### 설치

```bash
# 의존성 설치
pnpm install

# 또는
npm install
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabase 프로젝트 설정:

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 설정에서 URL과 Anon Key 복사
3. `.env.local`에 추가

### 개발 서버 실행

```bash
pnpm dev
```

개발 서버가 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

### 빌드

```bash
pnpm build
```

### 프로덕션 실행

```bash
pnpm start
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/       # 마케팅 페이지
│   ├── auth/              # 인증 페이지
│   ├── dashboard/         # 대시보드
│   └── hands/             # 핸드 기록/복기
│
├── components/            # 공통 컴포넌트
│   ├── poker/            # 포커 관련 컴포넌트
│   └── ui/               # UI 컴포넌트 (Radix UI 기반)
│
├── features/             # 기능별 모듈
│   ├── auth/             # 인증 기능
│   └── hand/             # 핸드 관리
│       ├── domain/       # 도메인 모델
│       ├── engine/       # 상태 계산 엔진
│       └── editor/       # 편집 상태 관리
│
└── lib/                  # 유틸리티
    └── supabase/         # Supabase 클라이언트
```

### 핵심 파일

- `src/features/hand/domain/events.ts` - 이벤트 타입 정의
- `src/features/hand/engine/reducer.ts` - 상태 계산 로직
- `src/features/hand/editor/handEditorStore.ts` - 편집 상태 관리
- `src/features/hand/engine/validateAction.ts` - 액션 검증 로직

## 개발 가이드

### 코딩 컨벤션

이 프로젝트는 엄격한 아키텍처 원칙을 따릅니다. 자세한 내용은 [`poker_constitution.md`](./poker_constitution.md)를 참조하세요.

### 주요 규칙

1. **이벤트 로그가 유일한 진실**

   - 상태를 직접 수정하지 않습니다
   - 항상 이벤트를 재생하여 상태를 계산합니다

2. **Cursor 기반 탐색**

   - Undo/Redo/Jump는 모두 cursor 이동으로 처리합니다
   - 이벤트를 삭제하지 않습니다

3. **순수 함수 원칙**

   - `engine/` 레이어는 순수 함수로만 구성됩니다
   - 사이드 이펙트는 `editor/` 레이어에서만 발생합니다

4. **Record/Review 모드 통합**
   - 동일한 UI와 로직을 사용합니다
   - 입력 가능 여부만 다릅니다

### 금지 사항 (Anti-patterns)

- ❌ 상태를 직접 저장
- ❌ 타임라인 인덱스를 UI 임의 기준으로 계산
- ❌ 이벤트 순서를 클라이언트가 결정
- ❌ 스냅샷을 원본처럼 사용
- ❌ Record/Review 로직 분기 복사

## 배포

### Vercel 배포

1. GitHub 저장소에 코드 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 환경 변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 배포 완료

### 환경 변수 설정

Vercel 대시보드의 Settings > Environment Variables에서 다음 변수를 추가하세요:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key

## 스크립트

```bash
# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린트 실행
pnpm lint
```

## 라이선스

Private

## 참고 자료

- [프로젝트 철학 및 규칙](./poker_constitution.md) - 아키텍처 원칙 상세 설명
- [Next.js 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
