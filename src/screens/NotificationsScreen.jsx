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

export default function NotificationsScreen({ setScreen, openArtwork, openPerson }) {
  const { notifications, markRead, clearUnread, error } = useNotifications();
  const { getProfile, getArtwork } = useData();

  useEffect(() => {
    // 화면 닫을 때 일괄 읽음 처리
    return () => { clearUnread(); };
  }, [clearUnread]);

  const handleClick = async (n) => {
    if (!n.read_at) await markRead(n.id);
    if (n.kind === 'follow') {
      if (n.source_user_id) openPerson(n.source_user_id);
    } else if (n.artwork_id) {
      openArtwork(n.artwork_id);
    }
  };

  return (
    <>
      <Header title="알림" subtitle="다른 사람의 반응을 모아봅니다." kicker="모아 보기" onBack={() => setScreen('home')} />

      {error && (
        <div className="mb-4 rounded-[16px] bg-yellow-50 p-3 text-xs leading-5 text-yellow-900">
          알림 테이블이 아직 없어요. <code>supabase/migrations/003_social_and_stats.sql</code>을 실행해주세요.
        </div>
      )}

      {notifications.length === 0 ? (
        <EmptyState title="아직 알림이 없어요" hint="다른 사람들이 내 사진에 반응하면 여기에 모아 보여드릴게요." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const source = getProfile(n.source_user_id);
            const art = n.artwork_id ? getArtwork(n.artwork_id) : null;
            const sourceName = source?.nickname ?? '누군가';
            const headline = (() => {
              switch (n.kind) {
                case 'hype': return `${sourceName}이(가) 🔥 Hype`;
                case 'comment': return `${sourceName}이(가) 댓글`;
                case 'comment_reply': return `${sourceName}이(가) 답글`;
                case 'comment_reaction': return `${sourceName}이(가) 댓글에 ❤`;
                case 'mention': return `${sourceName}이(가) @멘션`;
                case 'follow': return `${sourceName}이(가) 팔로우`;
                case 'message': return `${sourceName}이(가) 메시지`;
                default: return '새 알림';
              }
            })();
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className={`flex w-full items-center gap-3 rounded-[18px] p-3 text-left ${
                  n.read_at ? 'bg-[var(--surface)] shadow-[0_0_0_1px_var(--border)]' : 'bg-white shadow-[0_0_0_1px_var(--ink)]'
                }`}
              >
                {art ? (
                  <ImageBox src={art.imageUrl} alt={art.title} className="h-12 w-12 shrink-0 rounded-[10px]" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-2)] text-lg">
                    {n.kind === 'follow' ? '👋' : '✨'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold tracking-[-0.04em]">{headline}</p>
                  {art?.title && <p className="truncate text-[11px] text-[var(--text-muted)]">{art.title}</p>}
                  <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
