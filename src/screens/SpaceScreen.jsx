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

export default function SpaceScreen({ openPlace, openArtwork }) {
  const { artworks, places, getPlaceArtworks } = useData();
  const [myLocation, setMyLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchPlaces(q);
      if (!cancelled) setSearchResults(results);
      setSearching(false);
    }, 350); // debounce
    return () => {
      cancelled = true;
      clearTimeout(timer);
      setSearching(false);
    };
  }, [searchQuery]);

  const flyToResult = (result) => {
    setFlyTarget({ lat: result.lat, lng: result.lng, zoom: 15, _ts: Date.now() });
    setSearchResults([]);
    setSearchQuery(result.shortName || '');
  };

  const placePoints = places
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({
      id: `place:${p.id}`,
      lat: p.lat,
      lng: p.lng,
      label: placeLabel(p),
      kind: 'place',
      ref: p,
    }));

  const exactArtPoints = artworks
    .filter((a) => a.location_mode === '정확한 위치' && a.lat != null && a.lng != null)
    .map((a) => ({
      id: `art:${a.id}`,
      lat: a.lat,
      lng: a.lng,
      label: a.title || '제목 없음',
      kind: 'artwork',
      ref: a,
    }));

  const points = [...placePoints, ...exactArtPoints];
  const center = myLocation || (points[0] ? { lat: points[0].lat, lng: points[0].lng } : null);

  const handleLocate = async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setMyLocation({ lat: pos.lat, lng: pos.lng });
      setFlyTarget({ lat: pos.lat, lng: pos.lng, zoom: 15, _ts: Date.now() });
    } catch (error) {
      alert('위치 정보를 가져올 수 없어요: ' + error.message);
    } finally {
      setLocating(false);
    }
  };

  const nearbyPlaces = myLocation
    ? places
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({ ...p, distance: distanceMeters(myLocation.lat, myLocation.lng, p.lat, p.lng) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)
    : [];

  return (
    <>
      <Header
        title="지도"
        subtitle="위치를 공유한 사진들이 여기에 걸립니다."
        kicker="공간"
        right={
          <button
            type="button"
            onClick={handleLocate}
            disabled={locating}
            className="rounded-full border border-[var(--ink)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {locating ? '확인 중' : '내 위치'}
          </button>
        }
      />
      <div className="space-y-5">
        <div className="relative">
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <Icon name="search" size={17} className="text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="동네/주소로 검색 (예: 망원동, 이태원)"
              className="w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
            />
            {searching && <span className="text-xs text-[var(--text-muted)]">검색 중…</span>}
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="text-[var(--text-muted)]"
                aria-label="지우기"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-[18px] bg-[var(--surface)] shadow-[0_8px_24px_rgba(0,0,0,0.12),0_0_0_1px_var(--border)]">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => flyToResult(result)}
                  className="flex w-full items-start gap-2 border-b border-[var(--border)] p-3 text-left last:border-b-0"
                >
                  <Icon name="pin" size={14} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{result.shortName}</p>
                    <p className="truncate text-[11px] text-[var(--text-muted)]">{result.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {points.length === 0 ? (
          <EmptyState
            title="아직 지도에 표시할 사진이 없어요"
            hint="'정확한 위치' 또는 '동네'로 사진을 올리면 자동으로 지도에 표시됩니다."
          />
        ) : (
          <MapView
            points={points}
            center={center}
            flyTarget={flyTarget}
            onMarkerClick={(point) => {
              if (point.kind === 'place') openPlace(point.ref.id);
              else openArtwork(point.ref.id);
            }}
          />
        )}

        {myLocation && nearbyPlaces.length > 0 && (
          <section>
            <h2 className="mb-3 text-[22px] font-extrabold tracking-[-0.07em]">가장 가까운 공간</h2>
            <div className="space-y-2">
              {nearbyPlaces.map((p) => {
                const photos = getPlaceArtworks(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openPlace(p.id)}
                    className="flex w-full items-center gap-3 rounded-[18px] bg-[var(--surface)] p-3 text-left shadow-[0_0_0_1px_var(--border)]"
                  >
                    <ImageBox src={photos[0]?.imageUrl} alt={p.name} className="h-14 w-14 shrink-0 rounded-[12px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold tracking-[-0.04em]">{placeLabel(p)}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {Math.round(p.distance)}m · 사진 {photos.length}장
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
