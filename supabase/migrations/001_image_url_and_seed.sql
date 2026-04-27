-- 마이그레이션: artworks에 image_url 추가 (외부 URL 지원, 시드 데이터용)
-- 기존 schema.sql을 이미 적용한 환경이라면 이 파일만 추가 실행하면 됨.

alter table artworks
  alter column storage_path drop not null;

alter table artworks
  add column if not exists image_url text;

-- 둘 중 하나는 반드시 있어야 함
alter table artworks
  drop constraint if exists artworks_has_image;
alter table artworks
  add constraint artworks_has_image
  check (storage_path is not null or image_url is not null);
