-- 공지사항 테이블 생성
-- Supabase 대시보드 → SQL Editor에 전체 붙여넣기 → Run

create table if not exists notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_at timestamptz default now()
);

alter table notices enable row level security;

create policy "anon_all_notices" on notices
  for all using (true) with check (true);

-- 실시간 갱신 대상에도 추가 (다른 지점 화면에 공지가 바로 반영됩니다)
alter publication supabase_realtime add table notices;
