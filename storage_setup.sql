-- 자료실 파일 업로드용 저장소 설정
-- Supabase 대시보드 → SQL Editor에 전체 붙여넣기 → Run

-- 1. 파일 저장소(버킷) 생성
insert into storage.buckets (id, name, public, file_size_limit)
values ('files', 'files', true, 52428800)
on conflict (id) do nothing;

-- 2. 업로드/열람 권한 부여
create policy "anon_upload_files" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'files');

create policy "anon_read_files" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'files');
