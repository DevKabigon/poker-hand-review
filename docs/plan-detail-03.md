# Plan Detail 03 - UI 다국어 패치 (한국어/영어/일본어)

## 목표

- UI 텍스트를 `ko`, `en`, `ja` 3개 언어로 제공
- 문자열 하드코딩 제거
- 언어 전환 시 전체 플로우(랜딩/인증/대시보드/핸드 작성/복기)가 정상 동작

## 권장 라이브러리

- `next-intl` (App Router 친화, 서버/클라이언트 모두 지원)

## 범위

- 네비게이션/버튼/다이얼로그/토스트/폼 라벨/페이지 제목
- 정책 페이지 포함 전체 UI 텍스트

## 작업 순서

1. 라이브러리 설치 및 i18n 설정 파일 추가
2. 메시지 파일 생성
  - `src/shared/i18n/messages/ko.json`
  - `src/shared/i18n/messages/en.json`
  - `src/shared/i18n/messages/ja.json`
3. 루트 레이아웃에 i18n provider 연결
4. 페이지별 하드코딩 텍스트를 `t("key")`로 치환
5. 언어 전환 UI 추가(헤더 dropdown 또는 버튼)

## 번역 키 네이밍 규칙

- `nav.*`, `auth.*`, `dashboard.*`, `hand.*`, `common.*` 도메인별 prefix 사용
- 동작형 텍스트는 명사보다 문장형 키로 관리

## 완료 기준

- 로케일 변경 시 전체 UI 텍스트가 즉시 반영
- 신규 UI 텍스트는 하드코딩 없이 메시지 파일에만 추가

## 간단 코드 스니펫

```ts
// src/shared/i18n/config.ts
export const locales = ["ko", "en", "ja"] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = "ko";
```

```json
// src/shared/i18n/messages/ko.json
{
  "nav.dashboard": "대시보드",
  "nav.startNewHand": "새 핸드 시작",
  "common.save": "저장"
}
```

```tsx
// 컴포넌트 사용 예시
import { useTranslations } from "next-intl";
const t = useTranslations();
<button>{t("nav.startNewHand")}</button>;
```

