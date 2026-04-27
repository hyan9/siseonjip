// 매일 카든냥이 추천하는 키워드 (일일 사진전 / 시즌 챌린지)
// 날짜 기반 deterministic — 같은 날엔 누구에게나 같은 키워드.
// 카든냥 톤 — 짧고 그림이 그려지는 단어.

export const DAILY_KEYWORDS = [
  // 빛
  '아침 빛', '오후 그림자', '역광', '반사', '실루엣', '창문 빛',
  // 색
  '빨강 한 점', '초록', '회색의 톤', '파랑이 도는 시간', '노랑',
  // 사물
  '컵', '의자', '책 모서리', '간판', '문 손잡이', '계단',
  // 자연
  '잎사귀', '돌담', '하늘 한 조각', '구름', '비', '바람의 흔적',
  // 동네
  '평일 골목', '주말 시장', '편의점 앞', '버스 정류장', '카페 창가',
  // 사람
  '뒷모습', '손', '발걸음', '둘',
  // 시간
  '새벽 두 시', '점심 후', '잠들기 전', '셔터 누르기 직전',
  // 추상
  '흔들림', '대비', '기다림', '비어있음', '살짝 어긋남',
];

// 오늘의 키워드 — UTC 날짜 기반 (timezone 영향 받지만 한국 기준 보통 같음)
export function getTodayKeyword() {
  const now = new Date();
  // YYYYMMDD 정수
  const dayKey =
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  return DAILY_KEYWORDS[dayKey % DAILY_KEYWORDS.length];
}

// 어제, 그제 키워드 (지난 일일 사진전 보기용)
export function getKeywordForOffset(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const k = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return DAILY_KEYWORDS[k % DAILY_KEYWORDS.length];
}
