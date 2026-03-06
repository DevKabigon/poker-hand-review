# Plan Detail 06 - DB 마이그레이션 재작성 (Supabase 초기화 기준)

## 목표

- 현재 코드 상태(무료 단일 플로우)와 DB 스키마 정합성 맞추기
- 현재 코드 기준으로 초기 스키마 SQL을 새로 작성
- 유료/AI 관련 컬럼 없이 `hands`/`profiles(username 포함)` 구성

## 배경

- 기존 Supabase를 삭제했기 때문에 과거 마이그레이션 호환성보다
  현재 제품 스키마를 단순하게 재구성하는 것이 우선

## 작업 범위

- `supabase/migrations/*.sql`

## 작업 순서

1. 기존 마이그레이션 파일 제거
2. 단일 초기 마이그레이션 작성
  - `hands` 테이블 + 인덱스 + RLS 정책 + `updated_at` 트리거
  - `profiles` 테이블(`id`, `username`, timestamps) + RLS 정책 + signup 트리거
  - `handle_new_user()`는 provider 메타데이터 또는 이메일 prefix로 `username` 자동 생성
3. 코드 참조(`from("hands")`, `from("profiles")`) 기준으로 컬럼 정합성 검증

## 완료 기준

- 신규 Supabase에 초기 SQL 적용만으로 앱 기본 DB 기능 동작
- `hands` 저장/조회/수정/삭제 경로에 필요한 컬럼/정책 존재
- 가입 시 `profiles` 행 자동 생성 + `username` 자동 채움
- 사용자 설정 화면에서 `username` 수정 후 프로필/헤더 UI에 즉시 반영

## 간단 코드 스니펫

```sql
CREATE TABLE IF NOT EXISTS public.hands (
  id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  hand_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  button_seat INTEGER NOT NULL
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'username'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
      NULLIF(TRIM(SPLIT_PART(NEW.email, '@', 1)), ''),
      NEW.id::text
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
