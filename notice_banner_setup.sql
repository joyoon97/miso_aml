-- 공지사항 배너 표시 기능용 컬럼 추가
-- Supabase 대시보드 → SQL Editor에 전체 붙여넣기 → Run

alter table notices add column if not exists banner_enabled boolean default false;
alter table notices add column if not exists banner_until date;
