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

export default function ConversationScreen({ otherId, setScreen, openPerson }) {
  const { userId, getProfile, getThread, refresh } = useData();
  const other = getProfile(otherId);
  const thread = getThread(otherId);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  // 진입/메시지 추가 시 자동 스크롤 + read 마킹
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread.length]);

  useEffect(() => {
    if (!userId || !otherId) return;
    markMessagesRead(otherId, userId).then(() => refresh()).catch(() => {});
  }, [userId, otherId, thread.length]);

  if (!other) return <EmptyState title="사용자를 찾을 수 없어요" onAction={() => setScreen('messages')} actionLabel="목록으로" />;

  const handleSend = async (event) => {
    event.preventDefault();
    if (!text.trim() || !userId) return;
    setBusy(true);
    try {
      await sendMessage(userId, otherId, text.trim());
      setText('');
      await refresh();
    } catch (err) {
      alert('전송 실패: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => setScreen('messages')} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]">
          <Icon name="back" size={16} />
        </button>
        <button
          type="button"
          onClick={() => openPerson(otherId)}
          className="text-center"
        >
          <p className="text-xs font-semibold tracking-[0.16em] text-[var(--text-muted)]">대화</p>
          <p className="text-lg font-extrabold tracking-[-0.06em]">{other.nickname}</p>
        </button>
        <span className="h-9 w-9" />
      </div>

      <div
        ref={scrollRef}
        className="space-y-2 overflow-y-auto rounded-[20px] bg-[var(--surface)] p-3 shadow-[0_0_0_1px_var(--border)]"
        style={{ minHeight: '60vh', maxHeight: '70vh' }}
      >
        {thread.length === 0 && (
          <p className="py-12 text-center text-xs text-[var(--text-muted)]">첫 메시지를 보내보세요.</p>
        )}
        {thread.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-[16px] px-3 py-2 ${
                  mine
                    ? 'bg-[var(--ink)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text)]'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-5">{m.text}</p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-white/60' : 'text-[var(--text-faint)]'}`}>
                  {timeAgo(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="메시지 입력…"
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          전송
        </button>
      </form>
    </>
  );
}
