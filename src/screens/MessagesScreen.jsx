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

export default function MessagesScreen({ setScreen, openConversation }) {
  const { userId, getConversations, getProfile } = useData();
  const conversations = getConversations();

  return (
    <>
      <Header
        title="메시지"
        subtitle="1:1 쪽지를 주고받습니다."
        kicker="💬 DM"
        onBack={() => setScreen('profile')}
      />

      {conversations.length === 0 ? (
        <EmptyState
          title="아직 대화가 없어요"
          hint="다른 사람의 개인전에서 💬 메시지 버튼으로 시작해보세요."
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const other = getProfile(conv.otherId);
            return (
              <button
                key={conv.otherId}
                type="button"
                onClick={() => openConversation(conv.otherId)}
                className="flex w-full items-center gap-3 rounded-[18px] bg-[var(--surface)] p-3 text-left shadow-[0_0_0_1px_var(--border)]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-lg font-bold text-[var(--text)]">
                  {other?.nickname?.[0] || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold tracking-[-0.04em]">
                    {other?.nickname || '익명'}
                    {conv.unread > 0 && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {conv.unread}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-[var(--text-muted)]">
                    {conv.lastFromMe && '나: '}{conv.lastText}
                  </p>
                </div>
                <span className="text-[10px] text-[var(--text-faint)]">{timeAgo(conv.lastAt)}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
