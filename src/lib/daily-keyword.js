// 매일 카든냥이 추천하는 키워드 — 일일 사진전 / 시즌 챌린지
// 날짜 기반 deterministic — 같은 날엔 누구에게나 같은 키워드.
// 관념적이고 포괄적인 단어들로 — 누구든, 어디서든 자기 식으로 셔터를 누를 수 있도록.

export const DAILY_KEYWORDS = [
  // 빛과 그림자
  '빛',
  '그림자',
  '반사',
  '역광',
  '그늘',

  // 색과 톤
  '빨강',
  '초록',
  '파랑',
  '회색',
  '하양',
  '검정',

  // 시간
  '오늘',
  '아침',
  '오후',
  '저녁',
  '잠들기 전',
  '한참 전',
  '멈춘 시간',

  // 감각
  '온기',
  '서늘함',
  '조용함',
  '소란',
  '향',
  '소리',

  // 공간
  '여백',
  '거리',
  '사이',
  '모서리',
  '안과 밖',
  '집',
  '바깥',

  // 사물의 결
  '결',
  '주름',
  '곡선',
  '선',
  '점',
  '면',

  // 만남과 흔적
  '뒷모습',
  '발자국',
  '흔적',
  '기다림',
  '둘',
  '혼자',

  // 자연
  '하늘',
  '구름',
  '바람',
  '비',
  '잎',
  '돌',
  '꽃',

  // 추상
  '대비',
  '균형',
  '어긋남',
  '비어있음',
  '가득함',
  '천천히',
  '머무름',
];

// 오늘의 키워드 — 날짜 기반
export function getTodayKeyword() {
  const now = new Date();
  const dayKey =
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  return DAILY_KEYWORDS[dayKey % DAILY_KEYWORDS.length];
}

// 어제, 그제 등 (지난 일일 사진전 보기용)
export function getKeywordForOffset(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const k = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return DAILY_KEYWORDS[k % DAILY_KEYWORDS.length];
}
