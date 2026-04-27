-- 시선집 DB 스키마 (Supabase SQL Editor에 통째로 붙여넣기)

-- ============================================================
-- Tables
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text unique not null,
  bio text,
  exhibition_title text,
  note text,
  words text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  name text,
  neighborhood text,
  lat double precision,
  lng double precision,
  note text,
  words text[] default '{}',
  created_at timestamptz default now()
);

create index if not exists places_lat_lng_idx on places (lat, lng);

create table if not exists artworks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  place_id uuid references places(id) on delete set null,
  storage_path text not null,
  title text,
  note text,
  daily_vision text,
  is_twenty_five boolean default false,
  location_mode text not null default '동네'
    check (location_mode in ('정확한 위치', '동네', '개인전만', '숨김')),
  taken_at timestamptz,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

create index if not exists artworks_user_id_idx on artworks (user_id);
create index if not exists artworks_place_id_idx on artworks (place_id);
create index if not exists artworks_taken_at_idx on artworks (taken_at desc);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  artwork_id uuid not null references artworks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

create index if not exists comments_artwork_id_idx on comments (artwork_id);

create table if not exists hypes (
  artwork_id uuid not null references artworks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (artwork_id, user_id)
);

create table if not exists curate_slots (
  user_id uuid not null references profiles(id) on delete cascade,
  position int not null check (position between 1 and 4),
  artwork_id uuid not null references artworks(id) on delete cascade,
  primary key (user_id, position)
);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'nickname',
      'user_' || substr(new.id::text, 1, 6)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table places enable row level security;
alter table artworks enable row level security;
alter table comments enable row level security;
alter table hypes enable row level security;
alter table curate_slots enable row level security;

-- profiles: everyone can read, owner can update
drop policy if exists profiles_select_all on profiles;
create policy profiles_select_all on profiles
  for select using (true);

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- places: everyone can read, any authenticated user can insert
drop policy if exists places_select_all on places;
create policy places_select_all on places
  for select using (true);

drop policy if exists places_insert_auth on places;
create policy places_insert_auth on places
  for insert to authenticated with check (true);

-- artworks: 숨김은 본인만, 그 외는 누구나 read; 쓰기는 본인만
drop policy if exists artworks_select_visible on artworks;
create policy artworks_select_visible on artworks
  for select using (
    location_mode <> '숨김'
    or auth.uid() = user_id
  );

drop policy if exists artworks_insert_own on artworks;
create policy artworks_insert_own on artworks
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists artworks_update_own on artworks;
create policy artworks_update_own on artworks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists artworks_delete_own on artworks;
create policy artworks_delete_own on artworks
  for delete using (auth.uid() = user_id);

-- comments: read all, write own
drop policy if exists comments_select_all on comments;
create policy comments_select_all on comments
  for select using (true);

drop policy if exists comments_insert_own on comments;
create policy comments_insert_own on comments
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists comments_delete_own on comments;
create policy comments_delete_own on comments
  for delete using (auth.uid() = user_id);

-- hypes: read all, toggle own
drop policy if exists hypes_select_all on hypes;
create policy hypes_select_all on hypes
  for select using (true);

drop policy if exists hypes_insert_own on hypes;
create policy hypes_insert_own on hypes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists hypes_delete_own on hypes;
create policy hypes_delete_own on hypes
  for delete using (auth.uid() = user_id);

-- curate_slots: read all (so others can see your wall), write own
drop policy if exists curate_select_all on curate_slots;
create policy curate_select_all on curate_slots
  for select using (true);

drop policy if exists curate_write_own on curate_slots;
create policy curate_write_own on curate_slots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Storage bucket policies
-- (먼저 Supabase 대시보드에서 'photos' 버킷을 public으로 만든 뒤 실행)
-- ============================================================

-- 누구나 사진을 볼 수 있음 (public bucket이라 사실 자동이지만 명시)
drop policy if exists photos_public_read on storage.objects;
create policy photos_public_read on storage.objects
  for select using (bucket_id = 'photos');

-- 인증된 사용자는 자기 user_id 폴더에만 업로드 가능
drop policy if exists photos_insert_own on storage.objects;
create policy photos_insert_own on storage.objects
  for insert to authenticated with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 자기 사진만 삭제 가능
drop policy if exists photos_delete_own on storage.objects;
create policy photos_delete_own on storage.objects
  for delete to authenticated using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
