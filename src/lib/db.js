import { supabase, PHOTO_BUCKET } from './supabase';
import { distanceMeters } from './geocoding';

// ============================================================
// 조회 (RLS가 가시성 자동 처리)
// ============================================================

export async function fetchProfiles() {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function fetchPlaces() {
  const { data, error } = await supabase.from('places').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function fetchArtworks() {
  const { data, error } = await supabase
    .from('artworks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchComments() {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchHypes() {
  const { data, error } = await supabase.from('hypes').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function fetchCurateSlots() {
  const { data, error } = await supabase
    .from('curate_slots')
    .select('*')
    .order('position', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ============================================================
// 사진 업로드 + 작품 등록
// ============================================================

export function publicPhotoUrl(storagePath) {
  if (!storagePath) return null;
  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath);
  return data?.publicUrl ?? null;
}

export async function uploadPhoto(userId, file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

const PLACE_MATCH_RADIUS_M = 80;

// 같은 좌표 근처에 이미 등록된 place가 있으면 재사용, 없으면 새로 만듦.
export async function upsertPlace({ lat, lng, neighborhood, name, places }) {
  if (lat == null || lng == null) return null;

  const nearby = (places || []).find(
    (place) =>
      place.lat != null &&
      place.lng != null &&
      distanceMeters(lat, lng, place.lat, place.lng) < PLACE_MATCH_RADIUS_M
  );
  if (nearby) return nearby;

  const { data, error } = await supabase
    .from('places')
    .insert({
      lat,
      lng,
      neighborhood: neighborhood ?? null,
      name: name ?? neighborhood ?? '이름 없는 공간',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function insertArtwork({
  userId,
  storagePath,
  title,
  note,
  dailyVision,
  locationMode,
  takenAt,
  lat,
  lng,
  placeId,
}) {
  const { data, error } = await supabase
    .from('artworks')
    .insert({
      user_id: userId,
      storage_path: storagePath,
      title: title || null,
      note: note || null,
      daily_vision: dailyVision || null,
      location_mode: locationMode || '동네',
      taken_at: takenAt ? new Date(takenAt).toISOString() : null,
      lat: lat ?? null,
      lng: lng ?? null,
      place_id: placeId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// 인터랙션
// ============================================================

export async function toggleHype(artworkId, userId, currentlyHyped) {
  if (currentlyHyped) {
    const { error } = await supabase
      .from('hypes')
      .delete()
      .eq('artwork_id', artworkId)
      .eq('user_id', userId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase
    .from('hypes')
    .insert({ artwork_id: artworkId, user_id: userId });
  if (error) throw error;
  return true;
}

export async function postComment(artworkId, userId, text) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ artwork_id: artworkId, user_id: userId, text })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setCurateOrder(userId, artworkIds) {
  const { error: deleteError } = await supabase
    .from('curate_slots')
    .delete()
    .eq('user_id', userId);
  if (deleteError) throw deleteError;

  const rows = artworkIds.slice(0, 4).map((artworkId, index) => ({
    user_id: userId,
    position: index + 1,
    artwork_id: artworkId,
  }));
  if (rows.length === 0) return [];
  const { data, error } = await supabase.from('curate_slots').insert(rows).select();
  if (error) throw error;
  return data;
}

export async function setTwentyFive(userId, artworkId) {
  const { error: clearError } = await supabase
    .from('artworks')
    .update({ is_twenty_five: false })
    .eq('user_id', userId);
  if (clearError) throw clearError;

  const { data, error } = await supabase
    .from('artworks')
    .update({ is_twenty_five: true })
    .eq('id', artworkId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, fields) {
  const { data, error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
