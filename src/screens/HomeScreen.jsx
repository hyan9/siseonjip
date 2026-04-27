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
  const [feedMode, setFeedMode] = useState('추천'); // 추천 / 실시간

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
  const featured = featuredPool[0] || null;

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
          <h1 className="mt-0.5 text-[22px] font-extrabold tracking-[-0.07em]">오늘의 셔터들</h1>
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
          {/* 오늘의 주제 — 일일 사진전 (한 줄 미니멀 카드) */}
          {(() => {
            const today = getTodayKeyword();
            const todaysList = artworks.filter((a) => a.daily_vision === today);
            const todaysCount = todaysList.length;
            const previewPhotos = todaysList.slice(0, 3);
            return (
              <button
                type="button"
                onClick={() => openKeyword?.(today)}
                className="flex w-full items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-left transition hover:bg-[var(--surface-2)]"
              >
                {/* 좌측 — 작은 별 모양 인디케이터 */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                  <span className="text-[16px]">✦</span>
                </div>
                {/* 본문 */}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--text-muted)]">
                    오늘의 주제
                  </p>
                  <p className="mt-0.5 truncate text-[15px] font-extrabold tracking-[-0.05em] text-[var(--text)]">
                    #{today}
                    <span className="ml-2 text-[11px] font-semibold text-[var(--text-faint)]">
                      {todaysCount}장
                    </span>
                  </p>
                </div>
                {/* 우측 — 참여한 사진 미니 썸네일 (있으면) */}
                {previewPhotos.length > 0 && (
                  <div className="flex shrink-0 -space-x-1.5">
                    {previewPhotos.map((art) => (
                      <span
                        key={art.id}
                        className="h-7 w-7 overflow-hidden rounded-full border-2 border-[var(--surface)]"
                        style={{ background: 'var(--image-bg)' }}
                      >
                        <img
                          src={art.imageUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </span>
                    ))}
                  </div>
                )}
                <span className="shrink-0 text-[var(--text-faint)]">›</span>
              </button>
            );
          })()}

          {featured && (
            <section>
              <button
                type="button"
                onClick={() => openArtwork(featured.id)}
                className="block w-full overflow-hidden rounded-[20px] bg-[var(--surface)] text-left shadow-[0_0_0_1px_var(--border)]"
              >
                <div className="relative">
                  <ImageBox src={featured.imageUrl} alt={featured.title} className="h-[260px] w-full" />
                  <div className="absolute right-2 top-2 rounded-full bg-[var(--surface)]/90 p-1 text-[var(--ink)] backdrop-blur">
                    <CatPhotographer size={26} animate />
                  </div>
                  <span className="absolute left-3 top-3 rounded-full bg-[var(--ink)]/85 px-2 py-0.5 text-[9px] font-semibold tracking-[0.18em] text-white">
                    오늘의 한 컷
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="line-clamp-2 text-[28px] font-extrabold leading-[1.05] tracking-[-0.08em]">
                    {featured.title}
                  </h2>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
                    <span className="font-semibold text-[var(--text-body)]">
                      {profileLabel(getProfile(featured.user_id))}
                    </span>
                    <span className="text-[var(--text-faint)]">·</span>
                    <IconHype size={12} filled />
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
