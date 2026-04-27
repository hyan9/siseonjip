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

export default function CollectionDetailScreen({ collectionId, setScreen, openArtwork }) {
  const { userId, getCollection, getCollectionArtworks, refresh } = useData();
  const collection = getCollection(collectionId);
  const items = getCollectionArtworks(collectionId);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(collection?.name || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [isPublic, setIsPublic] = useState(collection?.is_public ?? true);
  const [busy, setBusy] = useState(false);

  if (!collection) return <EmptyState title="컬렉션을 찾을 수 없어요" onAction={() => setScreen('collections')} actionLabel="목록으로" />;

  const isMine = collection.user_id === userId;

  const handleSave = async () => {
    if (!isMine) return;
    setBusy(true);
    try {
      await updateCollection(collection.id, userId, { name: name.trim(), description, isPublic });
      await refresh();
      setEditing(false);
    } catch (err) {
      alert('수정 실패: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!isMine) return;
    if (!window.confirm(`"${collection.name}" 컬렉션을 삭제할까요? 사진은 그대로 남아요.`)) return;
    try {
      await deleteCollection(collection.id, userId);
      await refresh();
      setScreen('collections');
    } catch (err) {
      alert('삭제 실패: ' + err.message);
    }
  };

  const handleRemove = async (artworkId) => {
    if (!isMine) return;
    try {
      await removeArtworkFromCollection(collection.id, artworkId);
      await refresh();
    } catch (err) {
      alert('제거 실패: ' + err.message);
    }
  };

  return (
    <>
      <Header
        title={collection.name}
        subtitle={collection.description || ''}
        kicker={`📚 ${items.length}장`}
        onBack={() => setScreen('collections')}
      />

      {isMine && (
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setEditing(!editing); setName(collection.name); setDescription(collection.description || ''); setIsPublic(collection.is_public); }}
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
          >
            {editing ? '편집 취소' : '편집'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
          >
            🗑 삭제
          </button>
        </div>
      )}

      {editing && (
        <section className="mb-4 rounded-[20px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
          <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-[14px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="설명" className="mt-2 min-h-16 w-full resize-none rounded-[14px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none" />
          <label className="mt-2 flex items-center gap-2 text-xs">
            <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} className="h-4 w-4 accent-[var(--ink)]" />
            <span>공개</span>
          </label>
          <button type="button" onClick={handleSave} disabled={busy || !name.trim()} className="mt-3 w-full rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? '저장 중…' : '저장'}
          </button>
        </section>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="아직 사진이 없어요"
          hint={isMine ? '다른 사람 사진의 + 컬렉션 버튼으로 추가하세요.' : ''}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((art) => (
            <div key={art.id} className="relative">
              <PhotoTile artwork={art} onOpen={openArtwork} />
              {isMine && (
                <button
                  type="button"
                  onClick={() => handleRemove(art.id)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
                  aria-label="컬렉션에서 제거"
                >
                  <Icon name="x" size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
