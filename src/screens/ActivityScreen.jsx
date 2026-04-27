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

export default function ActivityScreen({ setScreen, openArtwork, openPerson }) {
  const { userId, getMyActivity, getProfile, getArtwork } = useData();
  const items = getMyActivity(80);

  if (!userId) return <Splash />;

  const labelFor = (item) => {
    switch (item.kind) {
      case 'hype': return '🔥 Hype';
      case 'comment': return '💬 댓글';
      case 'reply': return '↳ 답글';
      case 'comment_reaction': return '❤ 댓글 좋아요';
      case 'save': return '🔖 저장';
      case 'follow': return '👋 팔로우';
      default: return '활동';
    }
  };

  return (
    <>
      <Header
        title="내 활동"
        subtitle="내가 남긴 흔적을 시간순으로 모아봅니다."
        kicker="활동"
        onBack={() => setScreen('profile')}
      />

      {items.length === 0 ? (
        <EmptyState title="아직 활동이 없어요" hint="다른 사람 사진에 🔥/💬/🔖 남겨보세요." />
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const art = item.artwork_id ? getArtwork(item.artwork_id) : null;
            const target = item.followee_id ? getProfile(item.followee_id) : null;
            const onClick = () => {
              if (art) openArtwork(art.id);
              else if (target) openPerson(target.id);
            };
            return (
              <button
                key={`${item.kind}-${item.created_at}-${index}`}
                type="button"
                onClick={onClick}
                className="flex w-full items-center gap-3 rounded-[18px] bg-[var(--surface)] p-3 text-left shadow-[0_0_0_1px_var(--border)]"
              >
                {art ? (
                  <ImageBox src={art.imageUrl} alt={art.title} className="h-12 w-12 shrink-0 rounded-[10px]" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-2)] text-lg">
                    {labelFor(item).slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-[-0.04em]">{labelFor(item)}</p>
                  {art?.title && <p className="truncate text-[11px] text-[var(--text-muted)]">{art.title}</p>}
                  {target && <p className="truncate text-[11px] text-[var(--text-muted)]">{target.nickname}</p>}
                  {item.text && <p className="truncate text-[11px] text-[var(--text-muted)]">"{item.text}"</p>}
                  <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">{timeAgo(item.created_at)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
