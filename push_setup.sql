-- 푸시 알림 구독 정보 저장 테이블
-- Supabase 대시보드 → SQL Editor에 전체 붙여넣기 → Run

create table if not exists push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  branch text,
  role text,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "anon_all_push" on push_subscriptions
  for all using (true) with check (true);
