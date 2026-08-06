-- 토론(자유게시판) 새 글 등록 시 푸시 알림 발송 트리거
-- Supabase 대시보드 → SQL Editor에 전체 붙여넣기 → Run
-- (질문/공지에 이미 만들어둔 notify_push_trigger() 함수를 그대로 재사용합니다)

drop trigger if exists notify_on_discuss on public.discuss;

create trigger notify_on_discuss
after insert on public.discuss
for each row execute function public.notify_push_trigger();
