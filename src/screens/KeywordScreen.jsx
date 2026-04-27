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

export default function KeywordScreen({ keyword, setScreen, openArtwork }) {
  const { artworks, getHypeCount } = useData();
  const [sort, setSort] = useState('인기');

  const filtered = useMemo(() => {
    const arr = artworks.filter((a) => a.daily_vision === keyword);
    if (sort === '인기') {
      return [...arr].sort((a, b) => getHypeCount(b.id) - getHypeCount(a.id));
    }
    return [...arr].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [artworks, keyword, sort, getHypeCount]);

  return (
    <>
      <Header
        title={`#${keyword}`}
        subtitle="같은 시선을 모아봅니다."
        kicker="키워드"
        onBack={() => setScreen('home')}
      />
      <div className="mb-4 flex items-center gap-2 text-xs">
        <span className="text-[var(--text-faint)]">{filtered.length}장 · 정렬</span>
        {['인기', '최신'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSort(item)}
            className={`rounded-full px-3 py-1 ${
              sort === item ? 'bg-[var(--surface-2)] font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {item === '인기' ? '🔥 인기' : item}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="이 키워드 사진이 아직 없어요" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((art) => (
            <PhotoTile key={art.id} artwork={art} onOpen={openArtwork} />
          ))}
        </div>
      )}
    </>
  );
}
