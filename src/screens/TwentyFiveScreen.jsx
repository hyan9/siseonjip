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

export default function TwentyFiveScreen({ setScreen }) {
  const { userId, getUserArtworks, refresh } = useData();
  const works = getUserArtworks(userId);
  const current = works.find((a) => a.is_twenty_five);
  const [selectedId, setSelectedId] = useState(current?.id || works[0]?.id || null);
  const [busy, setBusy] = useState(false);
  const selected = works.find((a) => a.id === selectedId);

  const handleSave = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await setTwentyFive(userId, selectedId);
      await refresh();
      setScreen('archive');
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="가장 아름다운 사진" subtitle="필름 안에서 오래 남은 한 장을 고르세요." kicker="25번째" onBack={() => setScreen('archive')} />
      {works.length === 0 ? (
        <EmptyState title="아직 사진이 없어요" />
      ) : (
        <div className="space-y-4">
          {selected && <ImageBox src={selected.imageUrl} alt={selected.title} className="h-[420px] rounded-[26px]" />}
          <div className="grid grid-cols-4 gap-2">
            {works.slice(0, 16).map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => setSelectedId(art.id)}
                className={`overflow-hidden rounded-[14px] ${selectedId === art.id ? 'ring-2 ring-[var(--ink)]' : ''}`}
              >
                <ImageBox src={art.imageUrl} alt={art.title} className="aspect-square" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !selectedId}
            className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? '저장 중…' : '가장 아름다운 사진으로 정하기'}
          </button>
        </div>
      )}
    </>
  );
}
