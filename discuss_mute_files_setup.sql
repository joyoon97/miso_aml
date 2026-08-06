-- 1. 토론방 알림 끄기 기능용 컬럼 (push_subscriptions)
alter table push_subscriptions add column if not exists discuss_muted boolean default false;

-- 2. 토론 글에 사진/파일 첨부 기능용 컬럼 (discuss)
alter table discuss add column if not exists files jsonb;
