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

export default function BulkPrivacyScreen({ setScreen }) {
  const { userId, getUserArtworks, refresh } = useData();
  const works = getUserArtworks(userId);
  const [selected, setSelected] = useState(() => new Set());
  const [targetMode, setTargetMode] = useState('동네');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(works.map((w) => w.id)));
  };
  const clearAll = () => setSelected(new Set());

  const groupCounts = works.reduce(
    (acc, w) => {
      acc[w.location_mode] = (acc[w.location_mode] ?? 0) + 1;
      return acc;
    },
    { 정확한_위치: 0, 동네: 0, 개인전만: 0, 숨김: 0 }
  );

  const handleApply = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`${selected.size}장의 공개 방식을 "${targetMode}"으로 바꿀까요?`)) return;
    setBusy(true);
    try {
      await bulkUpdateArtworkLocationMode(Array.from(selected), userId, targetMode);
      await refresh();
      setSelected(new Set());
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (err) {
      alert('변경 실패: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header
        title="공개 일괄 변경"
        subtitle="여러 장의 공개 방식을 한 번에 바꿉니다."
        kicker="설정"
        onBack={() => setScreen('profile')}
      />

      {works.length === 0 ? (
        <EmptyState title="아직 사진이 없어요" />
      ) : (
        <div className="space-y-4 pb-32">
          <section className="rounded-[20px] bg-[var(--surface)] p-3 shadow-[0_0_0_1px_var(--border)]">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {LOCATION_MODES.map((m) => (
                <div key={m}>
                  <p className="text-[16px] font-extrabold tracking-[-0.04em]">
                    {m === '정확한 위치' ? works.filter((w) => w.location_mode === '정확한 위치').length : groupCounts[m] ?? 0}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold tracking-[0.08em] text-[var(--text-muted)]">{m}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">
              총 {works.length}장 · 선택 {selected.size}장
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={selectAll} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">
                전체 선택
              </button>
              <button type="button" onClick={clearAll} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">
                해제
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {works.map((art) => {
              const checked = selected.has(art.id);
              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => toggle(art.id)}
                  className={`relative aspect-square overflow-hidden rounded-[14px] ${checked ? 'ring-4 ring-[var(--ink)]' : ''}`}
                >
                  <ImageBox src={art.imageUrl} alt={art.title} className="h-full w-full" />
                  <span
                    className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      checked ? 'border-[var(--ink)] bg-[var(--ink)] text-white' : 'border-white bg-black/30 text-transparent'
                    }`}
                  >
                    <Icon name="check" size={12} />
                  </span>
                  <span className="absolute bottom-1 left-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    {art.location_mode}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-[400px] space-y-3">
            <div className="flex flex-wrap gap-2">
              {LOCATION_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTargetMode(m)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    targetMode === m ? 'bg-[var(--ink)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={busy}
              className="w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? '변경 중…' : done ? '완료!' : `${selected.size}장 → "${targetMode}"으로 바꾸기`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
