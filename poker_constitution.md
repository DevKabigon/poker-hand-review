# Poker Hand Review - Project Constitution v1.0

## 1. 프로젝트 목적

텍사스 홀덤 핸드를 정확하게 기록하고 자유롭게 복기할 수 있는 마이크로 SaaS

### 핵심 가치

**기록의 정확성** - 모든 액션/카드 공개는 시간 순서 이벤트로 기록됩니다.

**자유로운 탐색** - Undo/Redo/Jump를 통해 긴 핸드에서도 원하는 지점으로 즉시 이동할 수 있습니다.

**일관된 UI** - 기록과 복기는 동일한 UI를 사용하며, 입력 가능 여부만 다릅니다. 상태 계산 로직은 완전히 동일합니다.

---

## 2. 핵심 개념

### 2.1 이벤트 로그가 유일한 진실

핸드의 모든 변화는 이벤트로 기록됩니다. DB에 저장된 이벤트 시퀀스가 유일한 진실(Single Source of Truth)이며, 상태는 언제나 이벤트를 재생해서 계산합니다.

**금지 사항:**
- 상태를 직접 수정
- 스냅샷을 진실처럼 취급
- UI 상태를 DB 상태처럼 사용

### 2.2 스냅샷은 캐시

스냅샷은 성능 최적화를 위한 가속 캐시일 뿐입니다. 스냅샷이 없어도 이벤트만으로 상태를 재현할 수 있어야 하며, seq <= cursor 기준으로만 사용됩니다.

---

## 3. Timeline & Cursor 규약

### 3.1 Cursor 정의

cursor는 현재 적용된 마지막 타임라인 이벤트 인덱스를 의미합니다. 모든 탐색은 cursor 이동으로만 처리합니다.

- `cursor = 0` → POST_BLINDS까지 적용된 기본 상태
- `cursor = 1` → 첫 타임라인 이벤트 적용
- `cursor = N` → 마지막 이벤트까지 적용

**UI 표기 예시:** `0 / 18` (총 18개의 타임라인 이벤트 중 현재 0번째 상태)

### 3.2 Timeline Events

게임 상태에 영향을 주는 모든 변경은 타임라인 이벤트로 취급합니다.

| 타입 | 설명 |
|------|------|
| ACTION | Fold / Call / Bet / Raise / Check / All-in |
| REVEAL_FLOP | 플랍 카드 공개 |
| REVEAL_TURN | 턴 카드 공개 |
| REVEAL_RIVER | 리버 카드 공개 |
| SET_HOLECARDS | 히어로/빌런 홀카드 설정 (선택) |
| SHOWDOWN | 쇼다운 진입 |
| SHOWDOWN_REVEAL | 쇼다운 카드 공개 (선택) |

**참고:** POST_BLINDS는 baseState에 포함되며 cursor=0 기준 상태로 취급합니다.

---

## 4. Undo / Redo 규약

### 4.1 동작 방식

- **Undo:** `cursor -= 1`
- **Redo:** `cursor += 1`
- 이벤트 자체는 삭제하지 않습니다.

### 4.2 Undo 후 새 이벤트 기록

cursor < maxCursor 상태에서 새 이벤트가 기록되면:
- cursor 이후의 이벤트는 inactive 처리
- redo 경로는 소멸

이는 일반 편집기 규칙을 따르는 의도적인 설계입니다.

---

## 5. 로그 클릭 규약

오른쪽 로그는 타임라인 이벤트 목록이며, 각 로그 항목은 하나의 이벤트와 1:1 대응합니다.

**로그 클릭 시:**
```javascript
setCursor(eventIndex)
```

- ❌ Undo를 여러 번 누르는 방식은 사용하지 않습니다.
- ✅ Jump는 항상 cursor 이동입니다.

---

## 6. Record Mode vs Review Mode

### 공통점

동일한 엔진, 동일한 상태 계산 로직, 동일한 UI 구조를 사용합니다.

### 차이점

| 구분 | Record Mode | Review Mode |
|------|-------------|-------------|
| 액션 입력 | 가능 | 불가 |
| Undo / Redo | 가능 | 불가 |
| Prev / Next | 선택 | 가능 |
| 로그 점프 | 가능 | 가능 |
| 상태 변경 | 이벤트 append | cursor 이동만 |

---

## 7. Hand 데이터 구조

### 7.1 HandConfig (고정 설정)

- 게임 타입 (캐시 / 토너)
- 블라인드/안티 모드
- 디폴트 스택
- 플레이어 수, 좌석, 이름
- 히어로 좌석
- (선택) 초기 홀카드

→ `hands.config`로 저장  
→ 이벤트가 아닙니다.

### 7.2 HandEvents (기록)

- 순서(seq)는 서버에서만 발급
- 절대 감소하지 않습니다
- 이벤트는 append-only

---

## 8. 상태 계산 규칙

```javascript
baseState = apply(HandConfig + POST_BLINDS)

stateAtCursor = reduce(
  baseState,
  timelineEvents.slice(0, cursor)
)
```

**원칙:**
- UI는 절대 직접 상태를 수정하지 않습니다.
- 항상 계산 결과만 렌더링합니다.

---

## 9. 단계별 개발 원칙

1. DB + 이벤트 append
2. cursor 기반 replay
3. Undo / Redo
4. 로그 점프
5. 카드 이벤트
6. Record / Review 분리
7. Snapshot 최적화

👉 이 순서는 변경하지 않습니다.

---

## 10. 금지 규칙 (Anti-patterns)

- ❌ 상태를 직접 저장
- ❌ 타임라인 인덱스를 UI 임의 기준으로 계산
- ❌ 이벤트 순서를 클라이언트가 결정
- ❌ 스냅샷을 원본처럼 사용
- ❌ Record / Review 로직 분기 복사

---

## 11. 최종 원칙

**이 프로젝트는 "이벤트 + cursor + 순수 엔진"으로만 움직입니다.**