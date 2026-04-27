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

export default function PlaceExhibition({ placeId, setScreen, openArtwork }) {
  const { getPlace, getPlaceArtworks } = useData();
  const place = getPlace(placeId);
  const photos = getPlaceArtworks(placeId);

  if (!place) return <EmptyState title="공간을 찾을 수 없어요" onAction={() => setScreen('space')} actionLabel="지도로" />;

  return (
    <>
      <Header
        title={place.name || placeLabel(place)}
        subtitle={place.note || place.neighborhood || ''}
        kicker="공간 전시"
        onBack={() => setScreen('space')}
      />
      {photos.length === 0
        ? <EmptyState title="이 공간에는 아직 사진이 없어요" />
        : (
          <>
            {place.lat != null && place.lng != null && (
              <div className="mb-4">
                <MapView points={[{ id: place.id, lat: place.lat, lng: place.lng, label: placeLabel(place) }]} height={200} zoom={15} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">{photos.map((art) => <PhotoTile key={art.id} artwork={art} onOpen={openArtwork} />)}</div>
          </>
        )}
    </>
  );
}
