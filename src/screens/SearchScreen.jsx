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

export default function SearchScreen({ openArtwork, openPerson, openPlace }) {
  const { artworks, profiles, places, getProfile, getPlace, getHypeCount, getUserArtworks } = useData();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('사진');
  const [sort, setSort] = useState('최신');
  const [keywordFilter, setKeywordFilter] = useState(null);
  const q = query.trim().toLowerCase();

  const matches = (text) => text?.toLowerCase().includes(q);

  const allKeywords = useMemo(() => {
    const counts = new Map();
    for (const art of artworks) {
      if (!art.daily_vision) continue;
      counts.set(art.daily_vision, (counts.get(art.daily_vision) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([word]) => word);
  }, [artworks]);

  const filteredArts = useMemo(() => {
    let arr = artworks.filter((art) =>
      !q ||
      [art.title, art.note, art.daily_vision, getProfile(art.user_id)?.nickname, placeLabel(getPlace(art.place_id))]
        .filter(Boolean)
        .some(matches)
    );
    if (keywordFilter) arr = arr.filter((art) => art.daily_vision === keywordFilter);
    if (sort === '인기') {
      arr = [...arr].sort((a, b) => getHypeCount(b.id) - getHypeCount(a.id));
    } else {
      arr = [...arr].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return arr;
  }, [artworks, q, keywordFilter, sort, getProfile, getPlace, getHypeCount]);

  const filteredUsers = useMemo(() => {
    const arr = profiles.filter((p) =>
      !q ||
      [p.nickname, p.exhibition_title, p.bio, ...(p.words || [])]
        .filter(Boolean)
        .some(matches)
    );
    if (sort === '인기') {
      return [...arr].sort((a, b) => {
        const aHype = getUserArtworks(a.id).reduce((sum, art) => sum + getHypeCount(art.id), 0);
        const bHype = getUserArtworks(b.id).reduce((sum, art) => sum + getHypeCount(art.id), 0);
        return bHype - aHype;
      });
    }
    return [...arr].sort((a, b) => getUserArtworks(b.id).length - getUserArtworks(a.id).length);
  }, [profiles, q, sort, getUserArtworks, getHypeCount]);

  const filteredPlaces = places.filter((p) =>
    !q ||
    [p.name, p.neighborhood, ...(p.words || [])]
      .filter(Boolean)
      .some(matches)
  );

  return (
    <>
      <Header title="탐색" subtitle="사진·사람·위치를 따라갑니다." kicker="찾아보기" />
      <div className="space-y-4">
        <SearchBar query={query} setQuery={setQuery} />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {['사진', '사람', '위치'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-full px-4 py-2 text-sm ${tab === item ? 'bg-[var(--ink)] text-white' : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`}
            >
              {item}
            </button>
          ))}
        </div>

        {tab !== '위치' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--text-faint)]">정렬</span>
            {['최신', '인기'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSort(item)}
                className={`rounded-full px-3 py-1 ${sort === item ? 'bg-[var(--surface-2)] font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'}`}
              >
                {item === '인기' ? '🔥 인기' : item}
              </button>
            ))}
          </div>
        )}

        {tab === '사진' && allKeywords.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setKeywordFilter(null)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${!keywordFilter ? 'bg-[var(--ink)] text-white' : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`}
            >
              전체
            </button>
            {allKeywords.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => setKeywordFilter(word === keywordFilter ? null : word)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${keywordFilter === word ? 'bg-[var(--ink)] text-white' : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`}
              >
                #{word}
              </button>
            ))}
          </div>
        )}

        {tab === '사진' && (
          filteredArts.length === 0
            ? <EmptyState title="검색 결과 없음" hint="다른 키워드를 시도해보세요." />
            : <div className="grid grid-cols-2 gap-3">{filteredArts.map((art) => <PhotoTile key={art.id} artwork={art} onOpen={openArtwork} />)}</div>
        )}
        {tab === '사람' && (
          filteredUsers.length === 0
            ? <EmptyState title="아직 사람이 없어요" />
            : <div className="space-y-3">{filteredUsers.map((p) => <PersonRow key={p.id} profile={p} onOpen={openPerson} />)}</div>
        )}
        {tab === '위치' && (
          filteredPlaces.length === 0
            ? <EmptyState title="아직 위치가 없어요" hint="위치 정보가 있는 사진을 올리면 동네가 자동으로 생겨요." />
            : <div className="space-y-3">{filteredPlaces.map((p) => <PlaceRow key={p.id} place={p} onOpen={openPlace} />)}</div>
        )}
      </div>
    </>
  );
}
