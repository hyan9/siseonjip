-- 마이그레이션: 실시간 알림용 publication 등록
-- 새 댓글/Hype/사진이 들어올 때 클라이언트가 구독해서 받아볼 수 있게 함.
-- (이미 등록되어 있으면 에러 — 그땐 그 줄만 건너뛰고 다음 줄 실행하면 됨)

alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table hypes;
alter publication supabase_realtime add table artworks;
