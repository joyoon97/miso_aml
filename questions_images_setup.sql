-- 질문 게시판에 사진 첨부 기능을 위한 컬럼 추가
-- Supabase 대시보드 → SQL Editor에 전체 붙여넣기 → Run

alter table questions add column if not exists images jsonb;
