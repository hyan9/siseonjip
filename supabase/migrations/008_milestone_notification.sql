-- 마이그레이션 008: 개념글 등극 알림 (hype 5+ 달성)

-- notifications.kind enum 확장
alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications add constraint notifications_kind_check
  check (kind in ('comment', 'hype', 'follow', 'comment_reaction', 'comment_reply', 'mention', 'message', 'milestone'));

-- 기존 hype 트리거를 확장: 5번째 hype 도달 시 milestone 알림 추가
create or replace function public.notify_on_hype()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  art_owner uuid;
  total_hype integer;
  already_notified boolean;
begin
  select user_id into art_owner from artworks where id = new.artwork_id;

  -- 일반 hype 알림 (자기 자신 제외)
  if art_owner is not null and art_owner <> new.user_id then
    insert into notifications (user_id, source_user_id, artwork_id, kind)
    values (art_owner, new.user_id, new.artwork_id, 'hype');
  end if;

  -- milestone: 정확히 5번째 hype에서 작성자에게 한 번만
  if art_owner is not null then
    select count(*) into total_hype from hypes where artwork_id = new.artwork_id;
    if total_hype = 5 then
      select exists (
        select 1 from notifications
        where artwork_id = new.artwork_id and kind = 'milestone'
      ) into already_notified;
      if not already_notified then
        insert into notifications (user_id, source_user_id, artwork_id, kind)
        values (art_owner, new.user_id, new.artwork_id, 'milestone');
      end if;
    end if;
  end if;

  return new;
end;
$$;

-- 트리거 재바인딩 (이미 존재하면 그대로, 없으면 새로)
drop trigger if exists hypes_notify on hypes;
create trigger hypes_notify after insert on hypes
  for each row execute function notify_on_hype();
