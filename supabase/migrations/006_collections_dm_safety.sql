-- 마이그레이션 006: 컬렉션 / DM / 신고 / 차단

-- ============================================================
-- 1) Collections (사용자가 만드는 테마별 사진 모음)
-- ============================================================

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  cover_artwork_id uuid references artworks(id) on delete set null,
  is_public boolean default true,
  created_at timestamptz default now()
);

create index if not exists collections_user_id_idx on collections (user_id);

alter table collections enable row level security;

drop policy if exists collections_select on collections;
create policy collections_select on collections
  for select using (is_public = true or auth.uid() = user_id);

drop policy if exists collections_insert_own on collections;
create policy collections_insert_own on collections
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists collections_update_own on collections;
create policy collections_update_own on collections
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists collections_delete_own on collections;
create policy collections_delete_own on collections
  for delete using (auth.uid() = user_id);

create table if not exists collection_items (
  collection_id uuid not null references collections(id) on delete cascade,
  artwork_id uuid not null references artworks(id) on delete cascade,
  position int not null default 0,
  added_at timestamptz default now(),
  primary key (collection_id, artwork_id)
);

create index if not exists collection_items_pos_idx on collection_items (collection_id, position);

alter table collection_items enable row level security;

-- 컬렉션이 public이거나 본인 것이면 select 가능
drop policy if exists collection_items_select on collection_items;
create policy collection_items_select on collection_items
  for select using (
    exists (
      select 1 from collections c
      where c.id = collection_id
      and (c.is_public or c.user_id = auth.uid())
    )
  );

-- 본인 컬렉션에만 추가/삭제 가능
drop policy if exists collection_items_modify on collection_items;
create policy collection_items_modify on collection_items
  for all to authenticated using (
    exists (select 1 from collections c where c.id = collection_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from collections c where c.id = collection_id and c.user_id = auth.uid())
  );

-- ============================================================
-- 2) DM (1:1 메시지)
-- ============================================================

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  read_at timestamptz,
  created_at timestamptz default now(),
  check (sender_id <> recipient_id)
);

create index if not exists messages_thread_idx on messages (
  least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at desc
);
create index if not exists messages_recipient_idx on messages (recipient_id, created_at desc);

alter table messages enable row level security;

-- 발신자 또는 수신자만 읽을 수 있음
drop policy if exists messages_select on messages;
create policy messages_select on messages
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

drop policy if exists messages_insert_own on messages;
create policy messages_insert_own on messages
  for insert to authenticated with check (auth.uid() = sender_id);

-- 수신자가 자기 메시지의 read_at 업데이트 가능
drop policy if exists messages_update_recipient on messages;
create policy messages_update_recipient on messages
  for update using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- ============================================================
-- 3) Reports (신고)
-- ============================================================

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_user_id uuid references profiles(id) on delete cascade,
  target_artwork_id uuid references artworks(id) on delete cascade,
  target_comment_id uuid references comments(id) on delete cascade,
  reason text not null,
  detail text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz default now(),
  check (
    target_user_id is not null
    or target_artwork_id is not null
    or target_comment_id is not null
  )
);

create index if not exists reports_status_idx on reports (status, created_at desc);

alter table reports enable row level security;

-- 본인이 작성한 신고만 자기 자신이 조회 가능 (관리자는 service role 사용)
drop policy if exists reports_select_own on reports;
create policy reports_select_own on reports for select using (auth.uid() = reporter_id);

drop policy if exists reports_insert_own on reports;
create policy reports_insert_own on reports
  for insert to authenticated with check (auth.uid() = reporter_id);

-- ============================================================
-- 4) Blocks (차단)
-- ============================================================

create table if not exists blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table blocks enable row level security;

-- 본인이 한 차단만 조회/삭제
drop policy if exists blocks_select_own on blocks;
create policy blocks_select_own on blocks for select using (auth.uid() = blocker_id);

drop policy if exists blocks_insert_own on blocks;
create policy blocks_insert_own on blocks
  for insert to authenticated with check (auth.uid() = blocker_id);

drop policy if exists blocks_delete_own on blocks;
create policy blocks_delete_own on blocks
  for delete to authenticated using (auth.uid() = blocker_id);

-- ============================================================
-- 5) notifications.kind에 'message' 추가 + 메시지 도착 알림 트리거
-- ============================================================

alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications add constraint notifications_kind_check
  check (kind in ('comment', 'hype', 'follow', 'comment_reaction', 'comment_reply', 'mention', 'message'));

create or replace function public.notify_on_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, source_user_id, kind)
  values (new.recipient_id, new.sender_id, 'message');
  return new;
end;
$$;

drop trigger if exists messages_notify on messages;
create trigger messages_notify after insert on messages
  for each row execute function notify_on_message();

-- ============================================================
-- 6) Realtime publication
-- ============================================================

do $$ begin
  alter publication supabase_realtime add table messages;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table collections;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table collection_items;
exception when others then null; end $$;
