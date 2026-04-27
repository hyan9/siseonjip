-- 마이그레이션 007: EXIF 카메라/렌즈 정보 + 조회수 트래킹

-- ============================================================
-- 1) artworks: camera / lens / view_count 컬럼
-- ============================================================

alter table artworks
  add column if not exists camera_make text,
  add column if not exists camera_model text,
  add column if not exists lens text,
  add column if not exists view_count integer not null default 0;

-- ============================================================
-- 2) increment_view RPC (조회수 +1)
-- ============================================================

create or replace function increment_artwork_view(art_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update artworks
  set view_count = view_count + 1
  where id = art_id;
$$;

grant execute on function increment_artwork_view(uuid) to anon, authenticated;
