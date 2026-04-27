-- 마이그레이션 005: 사진 저장(북마크) 테이블
-- SQL Editor에 통째로 붙여넣기.

create table if not exists saves (
  user_id uuid not null references profiles(id) on delete cascade,
  artwork_id uuid not null references artworks(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, artwork_id)
);

create index if not exists saves_user_id_idx on saves (user_id, created_at desc);

alter table saves enable row level security;

drop policy if exists saves_select_own on saves;
create policy saves_select_own on saves for select using (auth.uid() = user_id);

drop policy if exists saves_insert_own on saves;
create policy saves_insert_own on saves
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists saves_delete_own on saves;
create policy saves_delete_own on saves for delete to authenticated using (auth.uid() = user_id);
