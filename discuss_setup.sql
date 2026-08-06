-- 토론(자유게시판) 테이블 생성
-- Supabase 대시보드 → SQL Editor에 전체 붙여넣기 → Run

create table if not exists discuss (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  branch text not null,
  text text not null,
  created_at timestamptz default now()
);

alter table discuss enable row level security;

create policy "anon_all_discuss" on discuss
  for all using (true) with check (true);

-- 실시간 갱신 대상에도 추가
alter publication supabase_realtime add table discuss;
