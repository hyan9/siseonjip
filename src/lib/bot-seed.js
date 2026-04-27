// 봇 프로필 + 작품 + 팔로우/하입 — 클라이언트 메모리 시드 (DB 미터치).
// 팔로우/하입 기능을 처음 써보는 사용자에게 "사람들이 있는 상태"를 보여주기 위함.
// 봇 user_id는 'bot:' prefix로 식별. toggleFollow 등 DB 쓰기는 PersonExhibition에서 막음.

export const BOT_PROFILES = [
  {
    id: 'bot:moss',
    nickname: '이끼',
    bio: '습기 많은 골목과 오래된 간판을 모읍니다.',
    exhibition_title: '비 오기 직전의 색',
    note: '맑은 날보다 눅눅한 날에 더 많이 셔터를 누른다.',
    words: ['장마', '돌담', '간판'],
    is_bot: true,
  },
  {
    id: 'bot:salt',
    nickname: '소금',
    bio: '부엌 창가, 햇볕 자국, 그릇의 그림자.',
    exhibition_title: '오후 세 시의 식탁',
    note: '집 안에서만 25번을 채우는 게 목표.',
    words: ['주방', '오후', '그림자'],
    is_bot: true,
  },
  {
    id: 'bot:linen',
    nickname: '리넨',
    bio: '필름 카메라 두 대로 천천히.',
    exhibition_title: '느린 산책',
    note: '하루 한 장이면 충분하다고 믿는 편.',
    words: ['필름', '동네', '천천히'],
    is_bot: true,
  },
  {
    id: 'bot:noir',
    nickname: '느와르',
    bio: '밤. 가로등. 그리고 비.',
    exhibition_title: '검은 빛',
    note: '낮에 찍은 사진은 거의 없다.',
    words: ['야경', '도시', '비'],
    is_bot: true,
  },
  {
    id: 'bot:kettle',
    nickname: '주전자',
    bio: '카페에서 컵 위로 떨어지는 빛만 본다.',
    exhibition_title: '하루의 윗면',
    note: '커피 잔이 등장하는 사진이 80%.',
    words: ['카페', '반사', '커피'],
    is_bot: true,
  },
];

// 일자별 분산 — 오늘 ~ 30일 전
const dayAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

// Unsplash 이미지로 작품 구성. 각 봇이 4~6장.
const BOT_ARTWORK_BLUEPRINTS = [
  // 이끼 — 비/거리
  { user_id: 'bot:moss',  title: '간판 옆에 자란 이끼',     daily_vision: '장마',  url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80', d: 0 },
  { user_id: 'bot:moss',  title: '돌담의 검은 자국',        daily_vision: '돌담',  url: 'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=900&q=80', d: 1 },
  { user_id: 'bot:moss',  title: '비 오기 5분 전',           daily_vision: '장마',  url: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?auto=format&fit=crop&w=900&q=80', d: 3 },
  { user_id: 'bot:moss',  title: '오래된 간판은 둥글다',     daily_vision: '간판',  url: 'https://images.unsplash.com/photo-1493514789931-586cb221d7a7?auto=format&fit=crop&w=900&q=80', d: 6 },
  { user_id: 'bot:moss',  title: '골목 모서리의 흰 줄',      daily_vision: '간판',  url: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=900&q=80', d: 9 },
  // 소금 — 집/주방
  { user_id: 'bot:salt',  title: '도마 위에 떨어진 빛',     daily_vision: '오후',  url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80', d: 0 },
  { user_id: 'bot:salt',  title: '컵의 그림자가 더 길다',    daily_vision: '그림자', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80', d: 2 },
  { user_id: 'bot:salt',  title: '냄비가 만든 일식',         daily_vision: '주방',  url: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=900&q=80', d: 4 },
  { user_id: 'bot:salt',  title: '식탁 끝에 잠시 머문 빵',   daily_vision: '오후',  url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80', d: 8 },
  // 리넨 — 동네/산책
  { user_id: 'bot:linen', title: '평일 오전의 골목',        daily_vision: '동네',  url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80', d: 0 },
  { user_id: 'bot:linen', title: '버스가 지나가고 남은 자리', daily_vision: '천천히', url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80', d: 1 },
  { user_id: 'bot:linen', title: '어떤 집의 창문',           daily_vision: '동네',  url: 'https://images.unsplash.com/photo-1496317899792-9d7dbcd928a1?auto=format&fit=crop&w=900&q=80', d: 5 },
  { user_id: 'bot:linen', title: '필름이 한 칸 비었던 날',    daily_vision: '필름',  url: 'https://images.unsplash.com/photo-1444212477490-ca407925329e?auto=format&fit=crop&w=900&q=80', d: 12 },
  // 느와르 — 야경
  { user_id: 'bot:noir',  title: '가로등 셋',                daily_vision: '야경',  url: 'https://images.unsplash.com/photo-1513415564515-763d91423bdd?auto=format&fit=crop&w=900&q=80', d: 0 },
  { user_id: 'bot:noir',  title: '비 오는 새벽 두 시',       daily_vision: '비',    url: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&w=900&q=80', d: 2 },
  { user_id: 'bot:noir',  title: '간판이 깜빡이던 골목',     daily_vision: '도시',  url: 'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=900&q=80', d: 4 },
  { user_id: 'bot:noir',  title: '편의점 앞의 검은 자국',    daily_vision: '도시',  url: 'https://images.unsplash.com/photo-1490217751470-db269bb56b8c?auto=format&fit=crop&w=900&q=80', d: 7 },
  // 주전자 — 카페
  { user_id: 'bot:kettle', title: '컵 위에 떠 있는 빛',       daily_vision: '반사',  url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80', d: 0 },
  { user_id: 'bot:kettle', title: '에스프레소 표면',          daily_vision: '커피',  url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=900&q=80', d: 1 },
  { user_id: 'bot:kettle', title: '카페 조명은 늘 따뜻하다',  daily_vision: '카페',  url: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=900&q=80', d: 3 },
  { user_id: 'bot:kettle', title: '잠시 멈춘 손',             daily_vision: '카페',  url: 'https://images.unsplash.com/photo-1442975631115-c4f7b05b8a2c?auto=format&fit=crop&w=900&q=80', d: 6 },
];

export const BOT_ARTWORKS = BOT_ARTWORK_BLUEPRINTS.map((a, i) => ({
  id: `bot-art:${i}`,
  user_id: a.user_id,
  title: a.title,
  note: null,
  daily_vision: a.daily_vision,
  location_mode: '동네',
  storage_path: null,
  image_url: a.url, // enrichedArtworks가 image_url || publicPhotoUrl(...) 사용
  place_id: null,
  lat: null,
  lng: null,
  is_twenty_five: false,
  view_count: 0,
  created_at: dayAgo(a.d),
}));

// 봇끼리 다는 댓글 — 시선집 톤 (짧고 일기처럼)
const BOT_COMMENT_BLUEPRINTS = [
  { artwork_id: 'bot-art:0', user_id: 'bot:salt',   text: '간판 옆 이끼만 보였다는 말, 너무 알 것 같아요.', d: 0.5 },
  { artwork_id: 'bot-art:0', user_id: 'bot:linen',  text: '비 오기 전 색이 정말 이런 톤이죠.', d: 1 },
  { artwork_id: 'bot-art:0', user_id: 'bot:noir',   text: '낮 사진인데 새벽 두 시 같아요.', d: 1.2 },

  { artwork_id: 'bot-art:5', user_id: 'bot:moss',   text: '도마 위 빛은 도마가 만든 게 아니라 시간이 만든 거 같아요.', d: 0.3 },
  { artwork_id: 'bot-art:5', user_id: 'bot:kettle', text: '컵 옆에 그릇이 그림자 두 번 만들어요.', d: 0.8 },

  { artwork_id: 'bot-art:8', user_id: 'bot:moss',   text: '평일 오전 골목 이 톤 너무 좋아요.', d: 0.4 },
  { artwork_id: 'bot-art:8', user_id: 'bot:salt',   text: '버스가 지나가고 남은 자리 — 제목이 사진보다 길게 남아요.', d: 1 },
  { artwork_id: 'bot-art:8', user_id: 'bot:noir',   text: '이게 그 25번째 후보 아닌가요.', d: 2 },

  { artwork_id: 'bot-art:13', user_id: 'bot:linen', text: '가로등 셋이 다 다른 색이라 좋네요.', d: 0.5 },
  { artwork_id: 'bot-art:13', user_id: 'bot:kettle', text: '저는 야경에서 늘 길을 잃어요.', d: 1.4 },

  { artwork_id: 'bot-art:17', user_id: 'bot:moss',   text: '컵 위에 떠 있는 빛 — 그 시간이 가장 짧다는 게 아쉬워요.', d: 0.2 },
  { artwork_id: 'bot-art:17', user_id: 'bot:noir',   text: '이런 사진은 제 카메라로는 절대 안 나와요.', d: 1.1 },

  { artwork_id: 'bot-art:1', user_id: 'bot:linen', text: '돌담 자국 너무 좋다.', d: 0.7 },
  { artwork_id: 'bot-art:6', user_id: 'bot:moss',  text: '컵 그림자가 진짜로 길어 보여요.', d: 0.9 },
  { artwork_id: 'bot-art:9', user_id: 'bot:kettle',  text: '버스 지나가고 남은 자리는 늘 비어있는데 비어있지 않아요.', d: 0.6 },
  { artwork_id: 'bot-art:11', user_id: 'bot:salt', text: '비 오는 새벽 두 시 — 이 시간만 살아있는 사람이 있죠.', d: 0.8 },
];

const minutesAgo = (n) => new Date(Date.now() - n * 3600000).toISOString();

export const BOT_COMMENTS = BOT_COMMENT_BLUEPRINTS.map((c, i) => ({
  id: `bot-comment:${i}`,
  artwork_id: c.artwork_id,
  user_id: c.user_id,
  text: c.text,
  parent_id: null,
  created_at: minutesAgo(c.d * 24), // d일 전 시점
}));

// 사용자 ↔ 봇 follow / hype를 메모리로 합칠 때 사용.
// — 모든 봇이 사용자를 follow (followee_id = userId)
// — 사용자가 일부 봇을 follow (이끼, 소금)
// — 봇들끼리도 약간의 follow가 있어서 stats가 0이 아니게
export function buildBotMemoryGraph(userId) {
  if (!userId) {
    return { profiles: BOT_PROFILES, artworks: BOT_ARTWORKS, follows: [], hypes: [], comments: BOT_COMMENTS };
  }
  const follows = [
    // 모든 봇 → 사용자
    ...BOT_PROFILES.map((b) => ({
      id: `bot-follow:${b.id}->${userId}`,
      follower_id: b.id,
      followee_id: userId,
    })),
    // 사용자 → 일부 봇
    { id: `bot-follow:user->moss`,  follower_id: userId, followee_id: 'bot:moss' },
    { id: `bot-follow:user->salt`,  follower_id: userId, followee_id: 'bot:salt' },
    // 봇 ↔ 봇 (개인전 stats가 0이 안 되도록)
    { id: `bot-follow:moss->linen`, follower_id: 'bot:moss',  followee_id: 'bot:linen' },
    { id: `bot-follow:linen->moss`, follower_id: 'bot:linen', followee_id: 'bot:moss' },
    { id: `bot-follow:salt->noir`,  follower_id: 'bot:salt',  followee_id: 'bot:noir' },
    { id: `bot-follow:noir->kettle`, follower_id: 'bot:noir', followee_id: 'bot:kettle' },
    { id: `bot-follow:kettle->salt`, follower_id: 'bot:kettle', followee_id: 'bot:salt' },
  ];

  // 봇이 사용자 작품에 hype를 누른 것처럼 보이게 (사용자 작품이 있으면 추후 합쳐짐)
  // 또 봇 작품끼리 hype 교환 — 가장 인기 있는 사진처럼 보이도록 일부에 누적.
  const hypes = [];
  const hot = ['bot-art:0', 'bot-art:5', 'bot-art:9', 'bot-art:13', 'bot-art:17'];
  hot.forEach((aid, i) => {
    BOT_PROFILES.forEach((b, j) => {
      hypes.push({ id: `bot-hype:${aid}:${j}`, artwork_id: aid, user_id: b.id });
    });
    hypes.push({ id: `bot-hype:${aid}:user-${i}`, artwork_id: aid, user_id: userId });
  });

  return {
    profiles: BOT_PROFILES,
    artworks: BOT_ARTWORKS,
    follows,
    hypes,
    comments: BOT_COMMENTS,
  };
}

// 알림 화면을 풍성하게 — 봇이 사용자를 follow / 사용자 작품에 hype·comment.
// 사용자 작품이 0개여도 follow 알림은 항상 보임.
export function buildBotNotifications({ userId, userArtworks = [] }) {
  if (!userId) return [];
  const items = [];
  // 1) 모든 봇이 사용자를 follow (각각 시점 살짝 다르게)
  BOT_PROFILES.forEach((b, i) => {
    items.push({
      id: `bot-noti:follow:${b.id}`,
      user_id: userId,
      kind: 'follow',
      source_user_id: b.id,
      artwork_id: null,
      comment_id: null,
      read_at: null,
      created_at: new Date(Date.now() - (i + 1) * 1.7 * 3600000).toISOString(),
    });
  });
  // 2) 사용자 작품이 있으면 봇들이 hype + 댓글
  const recent = [...userArtworks]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);
  recent.forEach((art, idx) => {
    BOT_PROFILES.slice(0, 3).forEach((b, i) => {
      items.push({
        id: `bot-noti:hype:${art.id}:${b.id}`,
        user_id: userId,
        kind: 'hype',
        source_user_id: b.id,
        artwork_id: art.id,
        comment_id: null,
        read_at: null,
        created_at: new Date(Date.now() - (idx * 4 + i + 1) * 1800000).toISOString(),
      });
    });
    // 댓글 한 개
    const commenter = BOT_PROFILES[idx % BOT_PROFILES.length];
    items.push({
      id: `bot-noti:comment:${art.id}:${commenter.id}`,
      user_id: userId,
      kind: 'comment',
      source_user_id: commenter.id,
      artwork_id: art.id,
      comment_id: null,
      read_at: null,
      created_at: new Date(Date.now() - (idx * 4 + 6) * 1800000).toISOString(),
    });
  });
  return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function isBotId(id) {
  return typeof id === 'string' && id.startsWith('bot:');
}

export function isBotArtworkId(id) {
  return typeof id === 'string' && id.startsWith('bot-art:');
}

// 봇 관련 액션이면 alert로 안내. true 리턴 시 호출 측은 더 진행하지 말 것.
export function blockIfBotAction({ artworkId, userId, kind }) {
  if (isBotArtworkId(artworkId) || isBotId(userId)) {
    const msg = {
      hype: '데모 봇 작품이라 hype는 저장되지 않아요. 직접 사진을 올려보세요.',
      comment: '데모 봇 작품엔 댓글을 남길 수 없어요. 직접 사진을 올려보세요.',
      message: '데모 봇과는 메시지를 주고받을 수 없어요.',
      save: '데모 봇 작품은 저장되지 않아요.',
      follow: '데모 봇이라 실제 팔로우는 작동하지 않아요. 봇 프로필은 둘러볼 수 있어요.',
    }[kind] || '데모 봇은 일부 기능이 제한돼요.';
    alert(msg);
    return true;
  }
  return false;
}
