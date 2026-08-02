-- 자료실에서 "첨부파일"과 "원문 링크"를 동시에 등록할 수 있도록 컬럼을 추가합니다.
-- Supabase 대시보드 → SQL Editor에 전체 붙여넣기 → Run

alter table resources add column if not exists file_link text;
