import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../lib/data-context';
import { useNotifications } from '../lib/notifications-context';
import {
  ImageBox,
  EmptyState,
} from '../components/ui';
import { PhotoTile, PostListRow } from '../components/Cards';
import { CatPhotographer } from '../components/Mascot';
import { IconHype } from '../components/icons/AppIcons';
import { getTodayKeyword } from '../lib/daily-keyword';


import {
  profileLabel,
} from '../lib/utils';







export default function HomeScreen({ setScreen, openArtwork, openPlace, openPerson, openKeyword }) {
  const {
    userId,
    artworks,
    places,
    getPlaceArtworks,
    getProfile,
    getUserArtworks,
    getHypeCount,
    getFollowing,
    getRecommendedArtworks,
    getRecommendedCreators,
  } = useData();
  const { unreadCount } = useNotifications();
  const [feedFilter, setFeedFilter] = useState('전체');
  const [feedMode, setFeedMode] = useState(() => {
    try { return sessionStorage.getItem('kadennyang:home:mode') || '추천'; } catch { return '추천'; }
  });
  // 탭 상태 저장
  useEffect(() => {
    try { sessionStorage.setItem('kadennyang:home:mode', feedMode); } catch {
      // sessionStorage 사용 불가 (Safari private mode 등) — 무시
    }
  }, [feedMode]);

  const followingIds = useMemo(
    () => new Set(getFollowing(userId).map((f) => f.followee_id)),
    [getFollowing, userId]
  );
  const hasFollowing = followingIds.size > 0;

  const visibleArtworks = useMemo(
    () => (feedFilter === '팔로잉' ? artworks.filter((a) => followingIds.has(a.user_id)) : artworks),
    [artworks, feedFilter, followingIds]
  );

  // 추천 알고리즘 (최신성 + 인기 + 팔로잉 + 키워드 친화도)
  const recommended = useMemo(
    () => getRecommendedArtworks(12),
    [getRecommendedArtworks]
  );
  const featuredPool = feedFilter === '팔로잉'
    ? recommended.filter((a) => followingIds.has(a.user_id))
    : recommended;
  // 오늘의 한 컷 캐러셀 — 후보 5장을 5초마다 우측 슬라이드
  const heroSlides = useMemo(() => featuredPool.slice(0, 5), [featuredPool]);
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    setHeroIndex(0);
  }, [heroSlides.length]);
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const t = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [heroSlides.length]);
  const featured = heroSlides[heroIndex] || featuredPool[0] || null;

  const topCreators = useMemo(() => getRecommendedCreators(6), [getRecommendedCreators]);

  const placesWithArt = useMemo(
    () =>
      places
        .map((place) => ({
          place,
          photos: getPlaceArtworks(place.id)
            .filter((a) => visibleArtworks.some((va) => va.id === a.id))
            .slice(0, 4),
        }))
        .filter((entry) => entry.photos.length > 0),
    [places, getPlaceArtworks, visibleArtworks]
  );

  // 추천 = 알고리즘 정렬 (인기/관심사 우대) / 실시간 = 최신순
  const fullFeed = useMemo(() => {
    const candidates = visibleArtworks.filter((a) => a.location_mode !== '숨김');
    if (feedMode === '실시간') {
      return [...candidates].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    const now = Date.now();
    const scored = candidates.map((art) => {
      const ageHours = (now - new Date(art.created_at).getTime()) / 3600000;
      const recencyScore = 1 / (1 + ageHours / 24);
      const hype = getHypeCount(art.id);
      const hypeScore = Math.log1p(hype) * 0.6;
      const followBonus = followingIds.has(art.user_id) ? 0.4 : 0;
      return { art, score: recencyScore + hypeScore + followBonus };
    });
    return scored.sort((a, b) => b.score - a.score).map((s) => s.art);
  }, [visibleArtworks, getHypeCount, followingIds, feedMode]);

  const PAGE = 20;
  const [displayCount, setDisplayCount] = useState(PAGE);
  // 피드 변경(필터 등) 시 페이지 리셋
  useEffect(() => { setDisplayCount(PAGE); }, [feedFilter, feedMode]);

  // 하루 1번 toast — 오늘 셔터 안 눌렀으면 부드럽게 찔러주기
  const { pushToast } = useNotifications();
  useEffect(() => {
    if (!userId) return;
    const todayKey = new Date().toLocaleDateString('ko-KR');
    const lastNudgeKey = `kadennyang:nudge:${todayKey}`;
    if (sessionStorage.getItem(lastNudgeKey)) return;
    const myToday = getUserArtworks(userId).filter(
      (a) => new Date(a.created_at).toLocaleDateString('ko-KR') === todayKey
    ).length;
    if (myToday === 0) {
      sessionStorage.setItem(lastNudgeKey, '1');
      pushToast?.({
        title: '오늘은 어떤 네 장이 남을까요?',
        body: `오늘의 주제 #${getTodayKeyword()} — 함께 셔터 눌러봐요.`,
      });
    }
  }, [userId, getUserArtworks, pushToast]);
  const feedList = fullFeed.slice(0, displayCount);
  const sentinelRef = useRef(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return undefined;
    if (displayCount >= fullFeed.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((c) => Math.min(c + PAGE, fullFeed.length));
        }
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [displayCount, fullFeed.length]);

  return (
    <>
      {/* 추천/실시간 탭 — TopBar 바로 아래에 sticky로 붙고 풀폭 */}
      <div className="sticky top-11 z-30 -mx-3 flex items-center gap-1 border-b border-[var(--border)] bg-[var(--bg)] px-3">
        {['추천', '실시간'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setFeedMode(m)}
            className={`border-b-2 px-3 py-2 text-[13px] font-bold transition ${
              feedMode === m
                ? 'border-[var(--ink)] text-[var(--text)]'
                : 'border-transparent text-[var(--text-muted)]'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* 추천 모드일 때만 페이지 제목 — 실시간은 list가 곧 본문 */}
      {feedMode === '추천' && (
        <div className="pt-3">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[var(--text-muted)]">
            {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
          <h1 className="font-display mt-0.5 text-[28px] font-black">오늘의 냥이들</h1>
        </div>
      )}

      {hasFollowing && (
        <div className="mb-1 mt-2 flex gap-2">
          {['전체', '팔로잉'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFeedFilter(item)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                feedFilter === item
                  ? 'bg-[var(--ink)] text-white'
                  : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {artworks.length === 0 ? (
        <EmptyState
          title="아직 카든냥이 비어있어요"
          hint={'사용법은 간단해요:\n1. 아래 + 버튼으로 사진 올리기\n2. 사진의 EXIF GPS 또는 "내 위치"로 자동 동네 매칭\n3. 같은 동네의 사진은 자동으로 한 전시에 묶여요\n\n둘러보고 싶으면 [내 전시] 탭에서 샘플 사진 5장 추가도 가능합니다.'}
          onAction={() => setScreen('record')}
          actionLabel="첫 사진 올리기"
        />
      ) : visibleArtworks.length === 0 ? (
        <EmptyState
          title="팔로잉 한 사람이 아직 사진을 안 올렸어요"
          hint="'전체' 탭으로 다른 사람들의 사진을 둘러보세요."
        />
      ) : feedMode === '추천' ? (
        // === 추천: 오늘의 주제 + 오늘의 한 컷 + 카드형 피드 + 작가 추천 ===
        <div className="space-y-5 pt-3">
          {/* 오늘의 주제 — 이벤트 카드 (대형 + 별빛 + 펄스 애니메이션) */}
          <DailyThemeCard
            artworks={artworks}
            onOpenKeyword={openKeyword}
          />


          {featured && (
            <section>
              <button
                type="button"
                onClick={() => openArtwork(featured.id)}
                className="block w-full overflow-hidden rounded-[24px] bg-[var(--surface)] text-left shadow-[0_0_0_1px_var(--border)]"
              >
                {/* 풀폭 세로 비율 사진 — 5장 캐러셀, 5초마다 우측 슬라이드 */}
                <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3/4' }}>
                  <div
                    className="absolute inset-0 flex transition-transform duration-[600ms] ease-out"
                    style={{ transform: `translateX(-${heroIndex * 100}%)` }}
                  >
                    {heroSlides.map((slide) => (
                      <div key={slide.id} className="relative h-full w-full shrink-0">
                        <ImageBox src={slide.imageUrl} alt={slide.title} className="h-full w-full" priority />
                      </div>
                    ))}
                  </div>
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--ink)]/85 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" /> 오늘의 한 컷
                  </span>
                  {heroSlides.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1">
                      {heroSlides.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 rounded-full transition-all ${i === heroIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/45'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                {/* 카드 아래 — 제목 + 작가 (중앙 정렬, 명조) */}
                <div className="px-5 py-5 text-center">
                  <h2 className="font-display line-clamp-2 text-[26px] font-black leading-[1.2]">
                    {featured.title}
                  </h2>
                  <p className="mt-2 inline-flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <span className="font-semibold text-[var(--text-body)]">
                      {profileLabel(getProfile(featured.user_id))}
                    </span>
                    <span className="text-[var(--text-faint)]">·</span>
                    <IconHype size={11} filled />
                    <span>{getHypeCount(featured.id)}</span>
                  </p>
                </div>
              </button>
            </section>
          )}

          {/* 추천 카드형 피드 — PhotoTile 2-col 그리드 */}
          {feedList.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[16px] font-extrabold tracking-[-0.05em]">오늘의 추천</h2>
                <span className="text-[10px] text-[var(--text-faint)]">최신·인기·팔로잉</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {feedList.map((art) => (
                  <PhotoTile key={art.id} artwork={art} onOpen={openArtwork} />
                ))}
              </div>
              {displayCount < fullFeed.length && (
                <div ref={sentinelRef} className="py-4 text-center text-[11px] text-[var(--text-muted)]">
                  불러오는 중…
                </div>
              )}
              {displayCount >= fullFeed.length && fullFeed.length > PAGE && (
                <div className="py-4 text-center text-[11px] text-[var(--text-faint)]">· 끝 ·</div>
              )}
            </section>
          )}

          {topCreators.length > 0 && (
            <section>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-[16px] font-extrabold tracking-[-0.05em]">눈에 띄는 작가</h2>
              </div>
              <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-1" style={{ scrollbarWidth: 'none' }}>
                {topCreators.map(({ profile, totalHype }) => {
                  const main =
                    getUserArtworks(profile.id).find((a) => a.is_twenty_five) ||
                    getUserArtworks(profile.id)[0];
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => openPerson(profile.id)}
                      className="min-w-[140px] overflow-hidden rounded-[18px] bg-[var(--surface)] text-left shadow-[0_0_0_1px_var(--border)]"
                    >
                      <ImageBox src={main?.imageUrl} alt={profile.nickname} className="h-[150px] w-full" />
                      <div className="p-2.5">
                        <p className="truncate text-[13px] font-bold tracking-[-0.04em]">
                          {profile.nickname}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                          <IconHype size={11} filled /> {totalHype}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      ) : (
        // === 실시간: 카든냥 list — edge-to-edge 풀 폭 (디시·디젤매니아 형태) ===
        <section className="-mx-3 mt-2">
          <div className="flex items-baseline gap-2 border-b border-[var(--border)] px-3 py-2">
            <h2 className="text-[14px] font-extrabold tracking-[-0.05em]">카든냥</h2>
            <span className="text-[10px] text-[var(--text-faint)]">
              {feedList.length}/{fullFeed.length} · 최신순
            </span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {feedList.map((art) => (
              <PostListRow key={art.id} artwork={art} onOpen={openArtwork} />
            ))}
          </div>
          {displayCount < fullFeed.length && (
            <div ref={sentinelRef} className="py-4 text-center text-[11px] text-[var(--text-muted)]">
              불러오는 중…
            </div>
          )}
          {displayCount >= fullFeed.length && fullFeed.length > PAGE && (
            <div className="py-4 text-center text-[11px] text-[var(--text-faint)]">· 끝 ·</div>
          )}
        </section>
      )}
    </>
  );
}

// 키워드별 색감 매핑 — 의미와 색감이 어긋나지 않게.
// 색상 키워드(빨강·초록 등)는 직접 매칭, 자연/감각 키워드는 정서적 매핑.
const KEYWORD_PALETTE = {
  // 색
  빨강:   { from: '#e11d48', via: '#7f1d1d', to: '#1a0a0a' },
  초록:   { from: '#16a34a', via: '#14532d', to: '#0d1a14' },
  파랑:   { from: '#2563eb', via: '#1e3a8a', to: '#0a1326' },
  회색:   { from: '#6b7280', via: '#374151', to: '#0f172a' },
  하양:   { from: '#cbd5e1', via: '#64748b', to: '#1e293b' },
  검정:   { from: '#404040', via: '#171717', to: '#000000' },
  // 빛과 그림자
  빛:     { from: '#ca8a04', via: '#7c2d12', to: '#1a1208' },
  그림자: { from: '#475569', via: '#1e293b', to: '#020617' },
  반사:   { from: '#67e8f9', via: '#0e7490', to: '#082f49' },
  역광:   { from: '#fb923c', via: '#7c2d12', to: '#1a0e08' },
  그늘:   { from: '#64748b', via: '#1e293b', to: '#020617' },
  // 자연
  하늘:   { from: '#60a5fa', via: '#1d4ed8', to: '#0c1f3d' },
  구름:   { from: '#94a3b8', via: '#475569', to: '#1e293b' },
  바람:   { from: '#34d399', via: '#15803d', to: '#0d1a14' },
  비:     { from: '#38bdf8', via: '#075985', to: '#0c1929' },
  잎:     { from: '#22c55e', via: '#166534', to: '#0d1a14' },
  돌:     { from: '#78716c', via: '#44403c', to: '#1c1917' },
  꽃:     { from: '#ec4899', via: '#9d174d', to: '#1a0a14' },
  // 시간
  아침:   { from: '#f59e0b', via: '#b45309', to: '#1a1208' },
  오후:   { from: '#fdba74', via: '#9a3412', to: '#1a0e08' },
  저녁:   { from: '#a78bfa', via: '#5b21b6', to: '#1a0e26' },
  '잠들기 전': { from: '#818cf8', via: '#3730a3', to: '#0a0a1a' },
  // 감각
  온기:   { from: '#fcd34d', via: '#b45309', to: '#1a1208' },
  서늘함: { from: '#7dd3fc', via: '#0369a1', to: '#0c1929' },
  조용함: { from: '#a5b4fc', via: '#3730a3', to: '#0a0a1a' },
};
const DEFAULT_PALETTE = { from: 'var(--accent)', via: '#3a2a18', to: '#1a1d1f' };

function DailyThemeCard({ artworks, onOpenKeyword }) {
  const today = getTodayKeyword();
  const todaysList = artworks.filter((a) => a.daily_vision === today);
  const todaysCount = todaysList.length;
  const previews = todaysList.slice(0, 4);
  const palette = KEYWORD_PALETTE[today] || DEFAULT_PALETTE;

  return (
    <button
      type="button"
      onClick={() => onOpenKeyword?.(today)}
      className="relative block w-full overflow-hidden rounded-[24px] p-6 text-left text-white shadow-[0_12px_36px_rgba(0,0,0,0.22)]"
      style={{
        backgroundImage: `linear-gradient(to bottom right, ${palette.from}, ${palette.via}, ${palette.to})`,
      }}
    >
      <style>{`
        @keyframes kadennyang-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes kadennyang-spark {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
      {/* 배경 별빛 — 펄스 */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-white/12 blur-2xl"
        style={{ animation: 'kadennyang-pulse 4s ease-in-out infinite' }}
      />
      <div
        className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-white/8 blur-2xl"
        style={{ animation: 'kadennyang-pulse 4.6s ease-in-out infinite 1s' }}
      />
      {/* 작은 별들 */}
      <span className="pointer-events-none absolute right-6 top-3 text-white/80" style={{ animation: 'kadennyang-spark 1.8s ease-in-out infinite' }}>✦</span>
      <span className="pointer-events-none absolute left-6 top-12 text-[10px] text-white/60" style={{ animation: 'kadennyang-spark 2.4s ease-in-out infinite 0.5s' }}>✦</span>
      <span className="pointer-events-none absolute right-14 bottom-6 text-[8px] text-white/60" style={{ animation: 'kadennyang-spark 3s ease-in-out infinite 1.2s' }}>✦</span>

      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
          오늘의 일일전 · {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
        </p>
        <h2 className="font-display mt-2 text-[48px] font-black leading-[0.98] text-center">
          #{today}
        </h2>
        <p className="mt-3 text-center text-[12px] leading-[1.7] text-white/85">
          카든냥이 오늘 골라준 단어.<br />
          이 단어로 셔터를 눌러 일일전에 참여하세요.
        </p>

        <div className="mt-4 flex items-center justify-center gap-3">
          {/* 참여 사진 미리보기 */}
          {previews.length > 0 ? (
            <div className="flex -space-x-2">
              {previews.map((art) => (
                <span
                  key={art.id}
                  className="h-9 w-9 overflow-hidden rounded-full border-2 border-white/90"
                >
                  <img src={art.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                </span>
              ))}
            </div>
          ) : null}
          <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
            지금까지 {todaysCount}장 →
          </span>
        </div>
      </div>
    </button>
  );
}
