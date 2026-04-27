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

export async function fetchFollows() {
  const { data, error } = await supabase.from('follows').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function fetchCommentReactions() {
  const { data, error } = await supabase.from('comment_reactions').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function fetchNotifications(userId, limit = 50) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(notificationId, userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  if (error) throw error;
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
  imageUrl,
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
      storage_path: storagePath || null,
      image_url: imageUrl || null,
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
// 데모 시딩
// ============================================================

const SEED_SAMPLES = [
  {
    title: '오후가 긁고 간 벽',
    note: '카페에 앉아 있었는데 계속 저 선만 보였다.',
    dailyVision: '벽의 금',
    locationMode: '동네',
    imageUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80',
    neighborhood: '망원동', lat: 37.556, lng: 126.902,
  },
  {
    title: '커피보다 먼저 도착한 빛',
    note: '창가 자리에 앉았는데 컵보다 빛이 먼저 보였다.',
    dailyVision: '반사',
    locationMode: '정확한 위치',
    imageUrl: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=80',
    neighborhood: '망원동', lat: 37.5562, lng: 126.9024,
  },
  {
    title: '행복은 꼬리 끝에서 흐려졌다',
    note: '너무 좋아해서 사진이 따라가지 못했다.',
    dailyVision: '흔들림',
    locationMode: '동네',
    imageUrl: 'https://images.unsplash.com/photo-1507149833265-60c372daea22?auto=format&fit=crop&w=900&q=80',
    neighborhood: '합정동', lat: 37.549, lng: 126.914,
  },
  {
    title: '유리에 남은 노란 소리',
    note: '밖은 시끄러웠는데 안쪽에는 노란빛만 남았다.',
    dailyVision: '반사',
    locationMode: '정확한 위치',
    imageUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80',
    neighborhood: '을지로', lat: 37.566, lng: 126.991,
  },
  {
    title: '골목 끝의 초록 점',
    note: '길 끝에 초록색 하나가 찍혀 있어서 계속 보게 됐다.',
    dailyVision: '초록',
    locationMode: '동네',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
    neighborhood: '연남동', lat: 37.562, lng: 126.923,
  },
];

export async function seedDemoArtworks(userId) {
  const created = [];
  for (const sample of SEED_SAMPLES) {
    let placeId = null;
    if (sample.lat != null) {
      const { data: place, error: placeError } = await supabase
        .from('places')
        .insert({
          lat: sample.lat,
          lng: sample.lng,
          neighborhood: sample.neighborhood,
          name: sample.neighborhood,
        })
        .select()
        .single();
      if (!placeError) placeId = place?.id;
    }

    const { data, error } = await supabase
      .from('artworks')
      .insert({
        user_id: userId,
        image_url: sample.imageUrl,
        title: sample.title,
        note: sample.note,
        daily_vision: sample.dailyVision,
        location_mode: sample.locationMode,
        place_id: placeId,
        lat: sample.locationMode === '정확한 위치' ? sample.lat : null,
        lng: sample.locationMode === '정확한 위치' ? sample.lng : null,
      })
      .select()
      .single();
    if (!error) created.push(data);
  }
  return created;
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

export async function postComment(artworkId, userId, text, parentId = null) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      artwork_id: artworkId,
      user_id: userId,
      text,
      parent_id: parentId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComment(commentId, userId) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function toggleCommentReaction(commentId, userId, currentlyLiked) {
  if (currentlyLiked) {
    const { error } = await supabase
      .from('comment_reactions')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase
    .from('comment_reactions')
    .insert({ comment_id: commentId, user_id: userId });
  if (error) throw error;
  return true;
}

export async function toggleFollow(targetUserId, currentUserId, currentlyFollowing) {
  if (targetUserId === currentUserId) throw new Error('자기 자신을 팔로우할 수 없어요');
  if (currentlyFollowing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUserId)
      .eq('followee_id', targetUserId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: currentUserId, followee_id: targetUserId });
  if (error) throw error;
  return true;
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

export async function updateArtwork(artworkId, userId, fields) {
  const allowed = ['title', 'note', 'daily_vision', 'location_mode', 'lat', 'lng', 'place_id'];
  const sanitized = {};
  for (const key of allowed) {
    if (key in fields) sanitized[key] = fields[key];
  }
  const { data, error } = await supabase
    .from('artworks')
    .update(sanitized)
    .eq('id', artworkId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteArtwork(artworkId, userId, storagePath) {
  // RLS가 본인 것만 삭제 가능하도록 막아주지만 명시적으로 user_id도 매칭
  const { error } = await supabase
    .from('artworks')
    .delete()
    .eq('id', artworkId)
    .eq('user_id', userId);
  if (error) throw error;

  // Storage 객체도 삭제 (외부 image_url이면 storagePath가 비어있을 수 있음)
  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .remove([storagePath]);
    if (storageError) {
      console.warn('[db] storage 삭제 실패 (권한 또는 미존재):', storageError);
    }
  }
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
