import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../lib/data-context';
import { useNotifications } from '../lib/notifications-context';
import { useTheme } from '../lib/theme-context';
import {
  Header,
  ImageBox,
  SearchBar,
  EmptyState,
  GpsStatusBadge,
  Splash,
  ThemeToggleButton,
  StatCell,
  GoogleLogo,
} from '../components/ui';
import Icon from '../components/Icon';
import MapView from '../components/MapView';
import HypeButton from '../components/HypeButton';
import ShareButton from '../components/ShareButton';
import { FourPhotoWall, PhotoTile, PersonRow, PlaceRow, PostListRow } from '../components/Cards';
import { CatPhotographer } from '../components/Mascot';
import { IconHype } from '../components/icons/AppIcons';
import CommentSection from '../components/CommentSection';
import ReportModal from '../components/ReportModal';
import LocationPickerModal from '../components/LocationPickerModal';
import PhotoZoomModal from '../components/PhotoZoomModal';
import {
  uploadPhoto,
  upsertPlace,
  insertArtwork,
  toggleHype,
  postComment,
  setCurateOrder,
  setTwentyFive,
  updateProfile,
  seedDemoArtworks,
  deleteArtwork,
  updateArtwork,
  toggleFollow,
  toggleCommentReaction,
  deleteComment,
  bulkUpdateArtworkLocationMode,
  setHeroArtwork,
  toggleSave,
  createCollection,
  updateCollection,
  deleteCollection,
  addArtworkToCollection,
  removeArtworkFromCollection,
  sendMessage,
  markMessagesRead,
  reportContent,
  toggleBlock,
} from '../lib/db';
import { readPhotoMeta } from '../lib/exif';
import { reverseGeocode, getCurrentPosition, distanceMeters, searchPlaces } from '../lib/geocoding';
import {
  formatTime,
  dateOf,
  getMonthDays,
  placeLabel,
  profileLabel,
  timeAgo,
  renderTextWithMentions,
  LOCATION_MODES,
} from '../lib/utils';
import { signInWithEmail, signInWithGoogle, signInAnonymous, signOut } from '../lib/auth-context';
import {
  shareFourCutCard,
  shareSinglePhotoCard,
  shareWeeklyRecapCard,
} from '../lib/share-card';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
      <div className="mb-3">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--text-muted)]">시선집 · {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</p>
        <h1 className="mt-0.5 text-[26px] font-extrabold tracking-[-0.08em]">오늘의 시선들</h1>
      </div>

      {/* 좌측 정렬 미니멀 액션 + 추천/실시간 탭 한 줄로 */}
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-[var(--border)]">
        <div className="flex items-center">
          {['추천', '실시간'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFeedMode(m)}
              className={`border-b-2 px-2 py-2 text-[13px] font-bold transition ${
                feedMode === m
                  ? 'border-[var(--ink)] text-[var(--text)]'
                  : 'border-transparent text-[var(--text-muted)]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 pb-1.5 text-[var(--text-muted)]">
          <button
            type="button"
            onClick={() => setScreen('search')}
            className="relative flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--surface)]"
            aria-label="탐색"
          >
            <Icon name="search" size={15} />
          </button>
          <button
            type="button"
            onClick={() => setScreen('notifications')}
            className="relative flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--surface)]"
            aria-label="알림"
          >
            <Icon name="bell" size={15} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      </div>

      {hasFollowing && (
        <div className="mb-3 flex gap-2">
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
          title="아직 시선집이 비어있어요"
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
        // === 추천: 오늘의 한 컷 + 카드형 피드 + 작가 추천 ===
        <div className="space-y-6">
          {featured && (
            <section>
              <button
                type="button"
                onClick={() => openArtwork(featured.id)}
                className="flex w-full items-center gap-3 overflow-hidden rounded-[18px] bg-[var(--surface)] p-2 text-left shadow-[0_0_0_1px_var(--border)]"
              >
                <div className="relative shrink-0">
                  <ImageBox src={featured.imageUrl} alt={featured.title} className="h-[88px] w-[88px] rounded-[12px]" />
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-[var(--surface)] p-0.5 text-[var(--ink)] shadow">
                    <CatPhotographer size={28} animate />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-semibold tracking-[0.18em] text-[var(--text-muted)]">오늘의 한 컷</p>
                  <h2 className="mt-0.5 line-clamp-2 text-[18px] font-extrabold leading-tight tracking-[-0.06em]">
                    {featured.title}
                  </h2>
                  <p className="mt-1 inline-flex items-center gap-1 truncate text-[11px] text-[var(--text-muted)]">
                    {profileLabel(getProfile(featured.user_id))}
                    <span className="text-[var(--text-faint)]">·</span>
                    <IconHype size={11} filled />
                    {getHypeCount(featured.id)}
                  </p>
                </div>
              </button>
            </section>
          )}

          {/* 추천 카드형 피드 — PhotoTile 2-col 그리드 */}
          {feedList.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[18px] font-extrabold tracking-[-0.06em]">오늘의 추천</h2>
                <span className="text-[10px] text-[var(--text-faint)]">
                  최신 · 인기 · 팔로잉 가중
                </span>
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
                <div className="py-4 text-center text-[11px] text-[var(--text-faint)]">
                  · 끝 ·
                </div>
              )}
            </section>
          )}

          {topCreators.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">사람들</p>
                  <h2 className="mt-0.5 text-[22px] font-extrabold tracking-[-0.075em]">눈에 띄는 작가</h2>
                </div>
              </div>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                {topCreators.map(({ profile, totalHype }) => {
                  const main =
                    getUserArtworks(profile.id).find((a) => a.is_twenty_five) ||
                    getUserArtworks(profile.id)[0];
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => openPerson(profile.id)}
                      className="min-w-[150px] overflow-hidden rounded-[20px] bg-[var(--surface)] text-left shadow-[0_0_0_1px_var(--border)]"
                    >
                      <ImageBox src={main?.imageUrl} alt={profile.nickname} className="h-[170px] w-full" />
                      <div className="p-3">
                        <p className="truncate text-sm font-bold tracking-[-0.04em]">
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
        // === 실시간: 시선집 list만 ===
        <section className="rounded-[20px] bg-[var(--surface)] px-4 py-2 shadow-[0_0_0_1px_var(--border)]">
          <div className="flex items-end justify-between border-b border-[var(--border)] py-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[18px] font-extrabold tracking-[-0.06em]">시선집</h2>
              <span className="text-[10px] text-[var(--text-faint)]">
                {feedList.length}/{fullFeed.length} · 최신순
              </span>
            </div>
          </div>
          <div>
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
            <div className="py-4 text-center text-[11px] text-[var(--text-faint)]">
              · 끝 ·
            </div>
          )}
        </section>
      )}
    </>
  );
}
