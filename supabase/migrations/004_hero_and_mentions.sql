-- 마이그레이션 004: 프로필 hero 이미지 + 댓글 @멘션 알림
-- 003 이후에 실행. SQL Editor에 통째로 붙여넣기.

-- ============================================================
-- 1) profiles.hero_artwork_id
-- ============================================================

alter table profiles
  add column if not exists hero_artwork_id uuid references artworks(id) on delete set null;

-- ============================================================
-- 2) notifications: 'mention' kind 허용
-- ============================================================

alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications add constraint notifications_kind_check
  check (kind in ('comment', 'hype', 'follow', 'comment_reaction', 'comment_reply', 'mention'));

-- ============================================================
-- 3) comment 트리거: @닉네임 자동 멘션 알림
-- ============================================================

create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  art_owner uuid;
  parent_owner uuid;
  rec record;
  mentioned_id uuid;
begin
  select user_id into art_owner from artworks where id = new.artwork_id;

  -- 1) 작품 주인에게 알림
  if art_owner is not null and art_owner <> new.user_id then
    insert into notifications (user_id, source_user_id, artwork_id, comment_id, kind)
    values (art_owner, new.user_id, new.artwork_id, new.id, 'comment');
  end if;

  -- 2) 답글이면 부모 댓글 주인에게 알림
  if new.parent_id is not null then
    select user_id into parent_owner from comments where id = new.parent_id;
    if parent_owner is not null
       and parent_owner <> new.user_id
       and (art_owner is null or parent_owner <> art_owner) then
      insert into notifications (user_id, source_user_id, artwork_id, comment_id, kind)
      values (parent_owner, new.user_id, new.artwork_id, new.id, 'comment_reply');
    end if;
  end if;

  -- 3) @멘션 처리: 텍스트에서 @닉네임 추출 → 닉네임으로 프로필 찾기 → 알림
  --    (작품 주인/부모댓글 주인에게는 이미 알림 갔으니 중복 제외)
  for rec in
    select distinct (regexp_matches(coalesce(new.text, ''), '@([^\s@,.!?:;]{2,30})', 'g'))[1] as nickname
  loop
    if rec.nickname is null then continue; end if;
    select id into mentioned_id from profiles where nickname = rec.nickname limit 1;
    if mentioned_id is null then continue; end if;
    if mentioned_id = new.user_id then continue; end if;
    if art_owner is not null and mentioned_id = art_owner then continue; end if;
    if parent_owner is not null and mentioned_id = parent_owner then continue; end if;

    insert into notifications (user_id, source_user_id, artwork_id, comment_id, kind)
    values (mentioned_id, new.user_id, new.artwork_id, new.id, 'mention');
  end loop;

  return new;
end;
$$;
