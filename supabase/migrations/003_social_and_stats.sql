-- 마이그레이션 003: 팔로우 / 댓글 좋아요+답글 / 알림 영구 저장 / 닉네임 포맷 개선
-- Supabase SQL Editor에 통째로 붙여넣고 Run.
-- 일부 줄이 이미 적용됐으면 그 줄에서 NOTICE/ERROR — 그 줄만 건너뛰면 됨.

-- ============================================================
-- 1) Follows
-- ============================================================

create table if not exists follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  followee_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

alter table follows enable row level security;

drop policy if exists follows_select_all on follows;
create policy follows_select_all on follows for select using (true);

drop policy if exists follows_insert_self on follows;
create policy follows_insert_self on follows for insert to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists follows_delete_self on follows;
create policy follows_delete_self on follows for delete to authenticated
  using (auth.uid() = follower_id);

-- ============================================================
-- 2) Comments: parent_id (답글)
-- ============================================================

alter table comments
  add column if not exists parent_id uuid references comments(id) on delete cascade;

create index if not exists comments_parent_id_idx on comments (parent_id);

-- ============================================================
-- 3) Comment reactions
-- ============================================================

create table if not exists comment_reactions (
  comment_id uuid not null references comments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (comment_id, user_id)
);

alter table comment_reactions enable row level security;

drop policy if exists cr_select_all on comment_reactions;
create policy cr_select_all on comment_reactions for select using (true);

drop policy if exists cr_insert_self on comment_reactions;
create policy cr_insert_self on comment_reactions for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists cr_delete_self on comment_reactions;
create policy cr_delete_self on comment_reactions for delete to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 4) Notifications (영구 저장)
-- ============================================================

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  source_user_id uuid references profiles(id) on delete cascade,
  artwork_id uuid references artworks(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  kind text not null check (kind in ('comment', 'hype', 'follow', 'comment_reaction', 'comment_reply')),
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists notifications_user_id_created_at_idx
  on notifications (user_id, created_at desc);

alter table notifications enable row level security;

drop policy if exists notif_select_own on notifications;
create policy notif_select_own on notifications for select using (auth.uid() = user_id);

drop policy if exists notif_update_own on notifications;
create policy notif_update_own on notifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notif_delete_own on notifications;
create policy notif_delete_own on notifications for delete using (auth.uid() = user_id);

-- inserts는 트리거 (security definer)로만 발생

-- ============================================================
-- 5) 트리거: 액션 → 알림 자동 생성
-- ============================================================

create or replace function public.notify_on_hype()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  art_owner uuid;
begin
  select user_id into art_owner from artworks where id = new.artwork_id;
  if art_owner is not null and art_owner <> new.user_id then
    insert into notifications (user_id, source_user_id, artwork_id, kind)
    values (art_owner, new.user_id, new.artwork_id, 'hype');
  end if;
  return new;
end;
$$;

drop trigger if exists hypes_notify on hypes;
create trigger hypes_notify after insert on hypes
  for each row execute function notify_on_hype();

create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  art_owner uuid;
  parent_owner uuid;
begin
  select user_id into art_owner from artworks where id = new.artwork_id;

  if art_owner is not null and art_owner <> new.user_id then
    insert into notifications (user_id, source_user_id, artwork_id, comment_id, kind)
    values (art_owner, new.user_id, new.artwork_id, new.id, 'comment');
  end if;

  if new.parent_id is not null then
    select user_id into parent_owner from comments where id = new.parent_id;
    if parent_owner is not null
       and parent_owner <> new.user_id
       and (art_owner is null or parent_owner <> art_owner) then
      insert into notifications (user_id, source_user_id, artwork_id, comment_id, kind)
      values (parent_owner, new.user_id, new.artwork_id, new.id, 'comment_reply');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists comments_notify on comments;
create trigger comments_notify after insert on comments
  for each row execute function notify_on_comment();

create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, source_user_id, kind)
  values (new.followee_id, new.follower_id, 'follow');
  return new;
end;
$$;

drop trigger if exists follows_notify on follows;
create trigger follows_notify after insert on follows
  for each row execute function notify_on_follow();

create or replace function public.notify_on_comment_reaction()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c_owner uuid;
  c_artwork uuid;
begin
  select user_id, artwork_id into c_owner, c_artwork
  from comments where id = new.comment_id;
  if c_owner is not null and c_owner <> new.user_id then
    insert into notifications (user_id, source_user_id, artwork_id, comment_id, kind)
    values (c_owner, new.user_id, c_artwork, new.comment_id, 'comment_reaction');
  end if;
  return new;
end;
$$;

drop trigger if exists comment_reactions_notify on comment_reactions;
create trigger comment_reactions_notify after insert on comment_reactions
  for each row execute function notify_on_comment_reaction();

-- ============================================================
-- 6) Realtime publication
-- ============================================================

-- 이미 추가됐으면 에러 — 무시하고 다음 줄 실행
do $$ begin
  alter publication supabase_realtime add table notifications;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table follows;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table comment_reactions;
exception when others then null; end $$;

-- ============================================================
-- 7) Profile auto-create trigger: 닉네임 포맷 개선
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text;
  candidate text;
  attempt int := 0;
begin
  -- 우선순위: 메타데이터의 nickname > full_name(OAuth) > 이메일 앞부분 > 기본
  base := coalesce(
    new.raw_user_meta_data->>'nickname',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, ''), '@', 1),
    ''
  );

  -- 비어있거나 너무 짧으면 익명_xxxx
  if length(trim(base)) < 2 then
    base := '익명_' || substr(replace(new.id::text, '-', ''), 1, 4);
  end if;

  candidate := base;

  -- 중복이면 _2, _3 ... 붙임
  while exists (select 1 from profiles where nickname = candidate) and attempt < 50 loop
    attempt := attempt + 1;
    candidate := base || '_' || attempt;
  end loop;

  insert into profiles (id, nickname)
  values (new.id, candidate)
  on conflict (id) do nothing;

  return new;
end;
$$;
