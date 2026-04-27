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
import { CatPhotographer } from '../components/Mascot';
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
  const [celebrating, setCelebrating] = useState(false);
  const selected = works.find((a) => a.id === selectedId);

  const handleSave = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await setTwentyFive(userId, selectedId);
      await refresh();
      // 마스코트가 등장하는 짧은 축하 모먼트
      setCelebrating(true);
      setTimeout(() => {
        setCelebrating(false);
        setScreen('archive');
      }, 1600);
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

      {celebrating && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/55 p-6 backdrop-blur-sm">
          <div className="rounded-[28px] bg-[var(--surface)] px-8 py-7 text-center shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
            <div className="text-[var(--ink)]">
              <CatPhotographer size={120} animate />
            </div>
            <p className="mt-3 text-[10px] font-semibold tracking-[0.18em] text-[var(--text-muted)]">
              25번째 사진 결정
            </p>
            <p className="mt-1 text-[20px] font-extrabold tracking-[-0.06em]">
              한 롤이 완성됐어요
            </p>
          </div>
        </div>
      )}
    </>
  );
}
