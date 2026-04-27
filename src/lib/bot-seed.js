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

// 메모리 봇 장소 — 같은 동네에 여러 봇 작품이 모이도록
export const BOT_PLACES = [
  { id: 'bot-place:mangwon', name: '망원동', neighborhood: '망원동', lat: 37.556, lng: 126.902 },
  { id: 'bot-place:hapjeong', name: '합정동', neighborhood: '합정동', lat: 37.549, lng: 126.914 },
  { id: 'bot-place:euljiro',  name: '을지로', neighborhood: '을지로', lat: 37.566, lng: 126.991 },
  { id: 'bot-place:yeonnam',  name: '연남동', neighborhood: '연남동', lat: 37.562, lng: 126.923 },
  { id: 'bot-place:itaewon',  name: '이태원', neighborhood: '이태원', lat: 37.534, lng: 126.994 },
];

// 봇별 동네 매핑 — 같은 동네끼리 묶이게
const BOT_PLACE_BY_USER = {
  'bot:moss':   'bot-place:mangwon',  // 이끼: 망원
  'bot:salt':   'bot-place:hapjeong', // 소금: 합정
  'bot:linen':  'bot-place:yeonnam',  // 리넨: 연남
  'bot:noir':   'bot-place:euljiro',  // 느와르: 을지로
  'bot:kettle': 'bot-place:itaewon',  // 주전자: 이태원
};

// Unsplash 이미지로 작품 구성. 각 봇이 8~12장. 다양한 카테고리.
const BOT_ARTWORK_BLUEPRINTS = [
  // ── 이끼 (bot:moss) — 비, 골목, 돌담, 식물 ──────
  { user_id: 'bot:moss',  title: '간판 옆에 자란 이끼',     daily_vision: '장마',  url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80', d: 0 },
  { user_id: 'bot:moss',  title: '돌담의 검은 자국',        daily_vision: '돌담',  url: 'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=900&q=80', d: 1 },
  { user_id: 'bot:moss',  title: '비 오기 5분 전',           daily_vision: '장마',  url: 'https://images.unsplash.com/photo-1428592953211-077101b2021b?auto=format&fit=crop&w=900&q=80', d: 3 },
  { user_id: 'bot:moss',  title: '오래된 간판은 둥글다',     daily_vision: '간판',  url: 'https://images.unsplash.com/photo-1493514789931-586cb221d7a7?auto=format&fit=crop&w=900&q=80', d: 6 },
  { user_id: 'bot:moss',  title: '골목 모서리의 흰 줄',      daily_vision: '간판',  url: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=900&q=80', d: 9 },
  { user_id: 'bot:moss',  title: '잎사귀가 꽉 찬 창문',      daily_vision: '잎사귀', url: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=900&q=80', d: 11 },
  { user_id: 'bot:moss',  title: '습기 많은 벽',             daily_vision: '돌담',  url: 'https://images.unsplash.com/photo-1604147706283-d7119b5b822c?auto=format&fit=crop&w=900&q=80', d: 13 },
  { user_id: 'bot:moss',  title: '비 그치고 남은 물웅덩이',   daily_vision: '비',    url: 'https://images.unsplash.com/photo-1493244040629-496f6d136e80?auto=format&fit=crop&w=900&q=80', d: 16 },
  { user_id: 'bot:moss',  title: '풀 사이로 떨어진 빛',      daily_vision: '잎사귀', url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80', d: 19 },

  // ── 소금 (bot:salt) — 부엌, 주방, 그림자, 음식 ──
  { user_id: 'bot:salt',  title: '도마 위에 떨어진 빛',     daily_vision: '오후',  url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80', d: 0 },
  { user_id: 'bot:salt',  title: '컵의 그림자가 더 길다',    daily_vision: '그림자', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80', d: 2 },
  { user_id: 'bot:salt',  title: '냄비가 만든 일식',         daily_vision: '주방',  url: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=900&q=80', d: 4 },
  { user_id: 'bot:salt',  title: '식탁 끝에 잠시 머문 빵',   daily_vision: '오후',  url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80', d: 8 },
  { user_id: 'bot:salt',  title: '레몬 두 알의 무게',        daily_vision: '주방',  url: 'https://images.unsplash.com/photo-1556909172-bd5315ff2354?auto=format&fit=crop&w=900&q=80', d: 10 },
  { user_id: 'bot:salt',  title: '나이프와 그릇',            daily_vision: '주방',  url: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=900&q=80', d: 12 },
  { user_id: 'bot:salt',  title: '오후 다섯 시의 잼',        daily_vision: '오후',  url: 'https://images.unsplash.com/photo-1559054663-e8d23213f55c?auto=format&fit=crop&w=900&q=80', d: 14 },
  { user_id: 'bot:salt',  title: '파스타가 식기 직전',       daily_vision: '주방',  url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80', d: 17 },

  // ── 리넨 (bot:linen) — 동네, 산책, 사람 뒷모습 ──
  { user_id: 'bot:linen', title: '평일 오전의 골목',        daily_vision: '동네',  url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80', d: 0 },
  { user_id: 'bot:linen', title: '버스가 지나가고 남은 자리', daily_vision: '천천히', url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80', d: 1 },
  { user_id: 'bot:linen', title: '어떤 집의 창문',           daily_vision: '동네',  url: 'https://images.unsplash.com/photo-1496317899792-9d7dbcd928a1?auto=format&fit=crop&w=900&q=80', d: 5 },
  { user_id: 'bot:linen', title: '필름이 한 칸 비었던 날',    daily_vision: '필름',  url: 'https://images.unsplash.com/photo-1444212477490-ca407925329e?auto=format&fit=crop&w=900&q=80', d: 12 },
  { user_id: 'bot:linen', title: '아빠와 딸의 뒷모습',        daily_vision: '뒷모습', url: 'https://images.unsplash.com/photo-1517022812141-23620dba5c23?auto=format&fit=crop&w=900&q=80', d: 14 },
  { user_id: 'bot:linen', title: '주말 시장 한가운데',        daily_vision: '주말 시장', url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=80', d: 16 },
  { user_id: 'bot:linen', title: '버스 정류장의 둘',          daily_vision: '둘',    url: 'https://images.unsplash.com/photo-1517959105821-eaf2591984ca?auto=format&fit=crop&w=900&q=80', d: 18 },
  { user_id: 'bot:linen', title: '동네 책방의 노란 창',       daily_vision: '동네',  url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80', d: 21 },

  // ── 느와르 (bot:noir) — 야경, 비, 도시, 네온 ──
  { user_id: 'bot:noir',  title: '가로등 셋',                daily_vision: '야경',  url: 'https://images.unsplash.com/photo-1513415564515-763d91423bdd?auto=format&fit=crop&w=900&q=80', d: 0 },
  { user_id: 'bot:noir',  title: '비 오는 새벽 두 시',       daily_vision: '비',    url: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&w=900&q=80', d: 2 },
  { user_id: 'bot:noir',  title: '간판이 깜빡이던 골목',     daily_vision: '도시',  url: 'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=900&q=80', d: 4 },
  { user_id: 'bot:noir',  title: '편의점 앞의 검은 자국',    daily_vision: '도시',  url: 'https://images.unsplash.com/photo-1490217751470-db269bb56b8c?auto=format&fit=crop&w=900&q=80', d: 7 },
  { user_id: 'bot:noir',  title: '네온이 다 켜지기 전',      daily_vision: '야경',  url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=900&q=80', d: 9 },
  { user_id: 'bot:noir',  title: '지하철 마지막 칸',          daily_vision: '도시',  url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=900&q=80', d: 11 },
  { user_id: 'bot:noir',  title: '비에 젖은 차도',            daily_vision: '비',    url: 'https://images.unsplash.com/photo-1519074031893-e72a85f1ad2d?auto=format&fit=crop&w=900&q=80', d: 14 },
  { user_id: 'bot:noir',  title: '길 끝에 남은 빨간 신호',    daily_vision: '빨강 한 점', url: 'https://images.unsplash.com/photo-1496564203457-11bb12075d90?auto=format&fit=crop&w=900&q=80', d: 17 },

  // ── 주전자 (bot:kettle) — 카페, 빛, 손, 책 ──
  { user_id: 'bot:kettle', title: '컵 위에 떠 있는 빛',       daily_vision: '반사',  url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80', d: 0 },
  { user_id: 'bot:kettle', title: '에스프레소 표면',          daily_vision: '커피',  url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=900&q=80', d: 1 },
  { user_id: 'bot:kettle', title: '카페 조명은 늘 따뜻하다',  daily_vision: '카페',  url: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=900&q=80', d: 3 },
  { user_id: 'bot:kettle', title: '잠시 멈춘 손',             daily_vision: '카페',  url: 'https://images.unsplash.com/photo-1442975631115-c4f7b05b8a2c?auto=format&fit=crop&w=900&q=80', d: 6 },
  { user_id: 'bot:kettle', title: '책 모서리에 닿은 빛',      daily_vision: '책 모서리', url: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=900&q=80', d: 8 },
  { user_id: 'bot:kettle', title: '드립이 떨어지는 0.5초',    daily_vision: '커피',  url: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=900&q=80', d: 10 },
  { user_id: 'bot:kettle', title: '창가 자리 — 평일 11시',    daily_vision: '카페 창가', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=80', d: 13 },
  { user_id: 'bot:kettle', title: '의자 위에 두고 간 책',     daily_vision: '의자',  url: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80', d: 16 },
  { user_id: 'bot:kettle', title: '하늘 한 조각',             daily_vision: '하늘 한 조각', url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80', d: 20 },
];

// 각 봇의 첫 작품을 그 봇의 25번째 사진(=대표작 / 가장 아름다운 한 장)으로 표시.
// "25번째"는 영화 월터의 상상은 현실이 된다 메타포 — 세상에서 가장 아름다운 사진.
const BOT_TWENTY_FIVE_BY_USER = new Map();
BOT_ARTWORK_BLUEPRINTS.forEach((a, i) => {
  if (!BOT_TWENTY_FIVE_BY_USER.has(a.user_id)) {
    BOT_TWENTY_FIVE_BY_USER.set(a.user_id, i);
  }
});

export const BOT_ARTWORKS = BOT_ARTWORK_BLUEPRINTS.map((a, i) => ({
  id: `bot-art:${i}`,
  user_id: a.user_id,
  title: a.title,
  note: null,
  daily_vision: a.daily_vision,
  location_mode: '동네',
  storage_path: null,
  image_url: a.url,
  place_id: BOT_PLACE_BY_USER[a.user_id] ?? null,
  lat: null,
  lng: null,
  is_twenty_five: BOT_TWENTY_FIVE_BY_USER.get(a.user_id) === i,
  view_count: 0,
  created_at: dayAgo(a.d),
}));

// 봇 댓글 풀 — 어디 작품에든 어울리도록 보편적인 카든냥 톤 한 줄들
const COMMENT_POOL = [
  '톤 너무 좋아요.',
  '이 한 장에 오늘 하루가 다 있네요.',
  '제가 보고 싶었던 그 색.',
  '셔터 누르는 순간이 들리는 듯.',
  '제목이 사진보다 길게 남아요.',
  '저는 이런 빛을 못 잡아요. 부럽다.',
  '이게 그 25번째 후보 아닌가요?',
  '컵 옆 그림자만 봐도 알겠다.',
  '이런 톤은 시간이 만든 거 같아요.',
  '오늘 새벽이 떠올라요.',
  '카메라가 좋아하는 풍경이네요.',
  '잠깐 멈춰 세우는 사진.',
  '냥이도 이 색은 좋아할 듯.',
  '이건 제 카메라로는 절대 안 나와요.',
  '평일에 본 풍경이 주말 같아요.',
  '이 칸에 오래 머물게 돼요.',
  '저는 야경에서 늘 길을 잃어요.',
  '제목 한 글자가 무게가 다르네요.',
];

// 결정론적 hash — artwork_id 기반으로 같은 입력은 같은 댓글 생성
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const minutesAgo = (n) => new Date(Date.now() - n * 3600000).toISOString();

// 모든 봇 작품에 1~2개 댓글을 결정론적으로 생성. 봇끼리만 다는 댓글이라 자기 작품엔 안 달림.
function generateBotComments() {
  const out = [];
  BOT_ARTWORKS.forEach((art) => {
    const seed = hashStr(art.id);
    const count = 1 + (seed % 2); // 1 or 2
    const used = new Set();
    for (let k = 0; k < count; k++) {
      // 댓글 단 봇 — 자기 작품 댓글은 피함
      let attempts = 0;
      let commenter = BOT_PROFILES[(seed + k * 7) % BOT_PROFILES.length];
      while ((commenter.id === art.user_id || used.has(commenter.id)) && attempts < 10) {
        commenter = BOT_PROFILES[(seed + k * 7 + ++attempts) % BOT_PROFILES.length];
      }
      used.add(commenter.id);
      const text = COMMENT_POOL[(seed + k * 13) % COMMENT_POOL.length];
      out.push({
        id: `bot-comment:${art.id}:${k}`,
        artwork_id: art.id,
        user_id: commenter.id,
        text,
        parent_id: null,
        created_at: minutesAgo((seed % 24) + k * 6 + 0.3),
      });
    }
  });
  return out;
}

export const BOT_COMMENTS = generateBotComments();

// 사용자 ↔ 봇 follow / hype를 메모리로 합칠 때 사용.
// — 모든 봇이 사용자를 follow (followee_id = userId)
// — 사용자가 일부 봇을 follow (이끼, 소금)
// — 봇들끼리도 약간의 follow가 있어서 stats가 0이 아니게
export function buildBotMemoryGraph(userId) {
  if (!userId) {
    return { profiles: BOT_PROFILES, artworks: BOT_ARTWORKS, follows: [], hypes: [], comments: BOT_COMMENTS, places: BOT_PLACES };
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
    places: BOT_PLACES,
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
// 'comment'는 더 이상 막지 않음 — 봇 작품에도 사용자가 댓글 달 수 있고, 메모리에만 저장.
export function blockIfBotAction({ artworkId, userId, kind }) {
  if (kind === 'comment') return false; // 댓글은 봇 작품에도 허용 (메모리 저장)
  if (isBotArtworkId(artworkId) || isBotId(userId)) {
    const msg = {
      hype: '데모 봇 작품이라 hype는 저장되지 않아요. 직접 사진을 올려보세요.',
      message: '데모 봇과는 메시지를 주고받을 수 없어요.',
      save: '데모 봇 작품은 저장되지 않아요.',
      follow: '데모 봇이라 실제 팔로우는 작동하지 않아요. 봇 프로필은 둘러볼 수 있어요.',
    }[kind] || '데모 봇은 일부 기능이 제한돼요.';
    alert(msg);
    return true;
  }
  return false;
}
