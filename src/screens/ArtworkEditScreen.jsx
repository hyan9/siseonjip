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

export default function ArtworkEditScreen({ artworkId, setScreen }) {
  const { userId, getArtwork, refresh } = useData();
  const art = getArtwork(artworkId);
  const [title, setTitle] = useState(art?.title || '');
  const [note, setNote] = useState(art?.note || '');
  const [dailyVision, setDailyVision] = useState(art?.daily_vision || '');
  const [mode, setMode] = useState(art?.location_mode || '동네');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!art) return <EmptyState title="사진을 찾을 수 없어요" onAction={() => setScreen('home')} actionLabel="홈으로" />;
  if (art.user_id !== userId) {
    return <EmptyState title="내 사진만 편집할 수 있어요" onAction={() => setScreen('detail')} actionLabel="돌아가기" />;
  }

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    try {
      const fields = {
        title: title || null,
        note: note || null,
        daily_vision: dailyVision || null,
        location_mode: mode,
      };
      // 정확한 위치에서 다른 모드로 바꾸면 좌표 노출 안 되도록 정리
      if (mode !== '정확한 위치' && (art.lat != null || art.lng != null)) {
        fields.lat = null;
        fields.lng = null;
      }
      await updateArtwork(art.id, userId, fields);
      await refresh();
      setScreen('detail');
    } catch (err) {
      setError(err.message || '저장 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="사진 편집" kicker="수정" onBack={() => setScreen('detail')} />
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[24px]">
          <ImageBox src={art.imageUrl} alt={art.title} className="h-64" />
        </div>

        <section className="space-y-4 rounded-[24px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full bg-transparent text-[24px] font-bold tracking-[-0.06em] outline-none placeholder:text-[var(--placeholder)]"
            placeholder="제목"
          />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-20 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-[var(--placeholder)]"
            placeholder="이 사진의 노트"
          />
          <input
            value={dailyVision}
            onChange={(event) => setDailyVision(event.target.value)}
            className="w-full rounded-full border border-[var(--border)] bg-transparent px-4 py-2 text-xs outline-none placeholder:text-[var(--placeholder)]"
            placeholder="오늘의 시선"
          />

          <div>
            <p className="mb-2 text-[12px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">공개 방식</p>
            <div className="flex flex-wrap gap-2">
              {LOCATION_MODES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-full px-3 py-2 text-xs ${mode === item ? 'bg-[var(--ink)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)]'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            {mode !== art.location_mode && mode !== '정확한 위치' && (art.lat != null) && (
              <p className="mt-2 text-xs text-[var(--text-muted)]">정확한 좌표는 저장 시 제거됩니다.</p>
            )}
          </div>

          {error && <p className="rounded-[12px] bg-red-50 p-3 text-xs text-red-700">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? '저장 중…' : '저장'}
          </button>
        </section>
      </div>
    </>
  );
}
