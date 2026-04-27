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
import Avatar from '../components/Avatar';
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
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => setScreen('messages')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]">
          <Icon name="back" size={16} />
        </button>
        <button
          type="button"
          onClick={() => openPerson(otherId)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <Avatar profile={other} size={36} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold tracking-[-0.04em]">{other.nickname}</p>
            <p className="truncate text-[10px] text-[var(--text-muted)]">대화</p>
          </div>
        </button>
      </div>

      <div
        ref={scrollRef}
        className="space-y-1 overflow-y-auto rounded-[16px] bg-[var(--surface)] p-3 shadow-[0_0_0_1px_var(--border)]"
        style={{ minHeight: '60vh', maxHeight: '70vh' }}
      >
        {thread.length === 0 && (
          <p className="py-12 text-center text-xs text-[var(--text-muted)]">첫 메시지를 보내보세요.</p>
        )}
        {thread.map((m, i) => {
          const mine = m.sender_id === userId;
          const prev = thread[i - 1];
          const groupedWithPrev = prev && prev.sender_id === m.sender_id &&
            (new Date(m.created_at) - new Date(prev.created_at)) < 60000;
          const showAvatar = !mine && !groupedWithPrev;
          return (
            <div key={m.id} className={`flex items-end gap-1.5 ${mine ? 'justify-end' : 'justify-start'} ${groupedWithPrev ? '' : 'mt-2'}`}>
              {!mine && (
                showAvatar
                  ? <Avatar profile={other} size={26} />
                  : <span className="w-[26px] shrink-0" />
              )}
              <div
                className={`max-w-[72%] px-3 py-1.5 text-[14px] leading-snug ${
                  mine
                    ? `bg-[var(--ink)] text-white ${groupedWithPrev ? 'rounded-[14px] rounded-tr-md' : 'rounded-[14px]'}`
                    : `bg-[var(--surface-2)] text-[var(--text)] ${groupedWithPrev ? 'rounded-[14px] rounded-tl-md' : 'rounded-[14px]'}`
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
              </div>
              {!groupedWithPrev && (
                <span className={`shrink-0 text-[9px] ${mine ? 'text-[var(--text-faint)]' : 'text-[var(--text-faint)]'}`}>
                  {timeAgo(m.created_at)}
                </span>
              )}
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
