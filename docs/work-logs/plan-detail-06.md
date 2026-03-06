# Work Log - Plan Detail 06 (DB 마이그레이션 재작성)

## 작업 일시
- 2026-02-28

## 요청 반영
- 기존 06단계(`env 예시`)는 이미 적용 완료 상태로 간주
- 06단계를 `필요한 마이그레이션 정리` 단계로 재정의
- 추가 요청: 기존 Supabase 삭제 상태 기준으로 SQL을 새로 작성

## 분석 결과
- 앱 코드의 실제 DB 접근은 `hands` 테이블 중심이며, `profiles`는 직접 조회하지 않음
- 신규 Supabase 기준에서는 과거 히스토리를 유지할 필요가 없으므로
  기존 마이그레이션 체인을 단일 초기 SQL로 단순화하는 편이 안전

## 수행 내용
1. 기존 마이그레이션 파일 제거
- `supabase/migrations/20250101000000_create_hands_table.sql`
- `supabase/migrations/20250102000000_create_profiles_table.sql`
- `supabase/migrations/20260228213000_cleanup_profiles_for_free_tier.sql`

2. 단일 초기 마이그레이션 신규 작성
- 파일: `supabase/migrations/20260228230000_init_schema.sql`
- 포함:
  - `hands` 테이블 생성(핵심 컬럼/인덱스/최종 street check)
  - `hands` RLS 정책(본인 데이터만 CRUD)
  - `profiles` 최소 테이블 생성(id + timestamps)
  - `profiles` RLS 정책(본인 데이터만 조회/수정)
  - 공용 `set_updated_at` 함수 + 각 테이블 트리거
  - `handle_new_user` + `on_auth_user_created` 트리거
  - `authenticated` 권한 grant

3. 계획 문서 06 업데이트
- 파일: `docs/plan-detail-06.md`
- 내용: "정리"에서 "초기 SQL 재작성" 기준으로 갱신

4. 추가 반영 (username 정책 보강)
- `supabase/migrations/20260228230000_init_schema.sql`
  - `profiles.username` 컬럼 추가
  - `handle_new_user()`에서
    - `raw_user_meta_data.username`
    - `raw_user_meta_data.full_name`
    - `raw_user_meta_data.name`
    - 이메일 prefix
    순으로 fallback 하여 username 자동 생성
- `src/types/database.types.ts`
  - `profiles.Row/Insert/Update`에 `username` 타입 반영
- `src/app/[locale]/settings/page.tsx` 신규
  - 사용자 설정에서 username 변경 저장 버튼 추가
- 사용자 메뉴에 settings 진입 추가
  - `src/components/main-header.tsx`
  - `src/features/auth/ui/nav-user-area.tsx`
  - `src/app/[locale]/dashboard/_components/header.tsx`

## 비고
- 이번 작업은 "기존 Supabase 삭제" 전제를 반영해 히스토리 보존보다 단순한 초기화 가능성을 우선함
- 신규 프로젝트에서 마이그레이션 적용 경로가 명확해짐

## 다음 단계
- 다국어 패치(ko/en/ja) 단계 진행 가능
