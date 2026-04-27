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
import { FourPhotoWall, PhotoTile, PersonRow, PlaceRow } from '../components/Cards';
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

  // 인기 키워드 top 5
  const trendingKeywords = useMemo(() => {
    const counts = new Map();
    for (const art of visibleArtworks) {
      if (!art.daily_vision) continue;
      counts.set(art.daily_vision, (counts.get(art.daily_vision) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([word, count]) => ({ word, count }));
  }, [visibleArtworks]);

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

  // 새로 올라온 사진
  const latest = visibleArtworks
    .filter((a) => a.location_mode !== '숨김')
    .slice(0, 8);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.18em] text-[var(--text-muted)]">시선집 · {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</p>
          <h1 className="mt-0.5 text-[27px] font-extrabold tracking-[-0.08em]">오늘의 시선들</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScreen('notifications')}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]"
            aria-label="알림"
          >
            <Icon name="bell" size={17} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-red-500" />
            )}
          </button>
          <button type="button" onClick={() => setScreen('search')} className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]" aria-label="탐색">
            <Icon name="search" size={17} />
          </button>
        </div>
      </div>

      {hasFollowing && (
        <div className="mb-4 flex gap-2">
          {['전체', '팔로잉'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFeedFilter(item)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
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
      ) : (
        <div className="space-y-6">
          {featured && (
            <section>
              <button
                type="button"
                onClick={() => openArtwork(featured.id)}
                className="block w-full overflow-hidden rounded-[28px] bg-[var(--ink)] text-left shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              >
                <div className="relative">
                  <ImageBox src={featured.imageUrl} alt={featured.title} className="h-[360px]" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 text-white">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-white/70">오늘의 한 컷</p>
                    <h2 className="mt-1 text-[26px] font-extrabold leading-tight tracking-[-0.07em]">
                      {featured.title || '제목 없는 사진'}
                    </h2>
                    <p className="mt-1 text-[13px] text-white/80">
                      {profileLabel(getProfile(featured.user_id))} ·{' '}
                      🔥 {getHypeCount(featured.id)}
                    </p>
                  </div>
                </div>
              </button>
            </section>
          )}

          {trendingKeywords.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">사람들의 시선</p>
                  <h2 className="mt-0.5 text-[20px] font-extrabold tracking-[-0.07em]">키워드 따라가기</h2>
                </div>
              </div>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                {trendingKeywords.map(({ word, count }) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => openKeyword(word)}
                    className="shrink-0 rounded-[16px] bg-[var(--surface)] px-4 py-3 text-left shadow-[0_0_0_1px_var(--border)]"
                  >
                    <p className="text-[15px] font-bold tracking-[-0.04em]">#{word}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{count}장</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {placesWithArt.length > 0 && (
            <section className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">동네별 전시</p>
                <h2 className="mt-0.5 text-[22px] font-extrabold tracking-[-0.075em]">근방 네컷</h2>
              </div>
              {placesWithArt.map(({ place, photos }) => (
                <article key={place.id} className="rounded-[28px] bg-[var(--surface)] p-3 shadow-[0_0_0_1px_var(--border)]">
                  <button
                    type="button"
                    onClick={() => openPlace(place.id)}
                    className="mb-3 flex w-full items-end justify-between gap-3 px-1 text-left"
                  >
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">
                        {placeLabel(place)}
                      </p>
                      <h3 className="mt-0.5 text-[20px] font-extrabold tracking-[-0.075em]">
                        {place.name || '이름 없는 공간'}
                      </h3>
                    </div>
                    <span className="rounded-full border border-[var(--border-strong)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
                      {photos.length}컷
                    </span>
                  </button>
                  <FourPhotoWall photos={photos} onOpen={openArtwork} />
                </article>
              ))}
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
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">🔥 {totalHype}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {latest.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">최근</p>
                  <h2 className="mt-0.5 text-[22px] font-extrabold tracking-[-0.075em]">새로 올라온 사진</h2>
                </div>
              </div>
              <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
                {latest.map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => openArtwork(art.id)}
                    className="min-w-[140px] overflow-hidden rounded-[18px] bg-[var(--surface)] text-left shadow-[0_0_0_1px_var(--border)]"
                  >
                    <ImageBox src={art.imageUrl} alt={art.title} className="h-[180px]" />
                    <div className="p-2">
                      <p className="truncate text-[12px] font-bold tracking-[-0.04em]">
                        {art.title || '제목 없음'}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-[var(--text-faint)]">
                        {profileLabel(getProfile(art.user_id))}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
