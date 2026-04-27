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
  incrementArtworkView,
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

export default function ArtworkDetail({ artworkId, setScreen, openArtwork, openPlace, openPerson, openKeyword, openCollectionPicker }) {
  const { userId, artworks, getArtwork, getProfile, getPlace, getUserArtworks, getHypeCount, isSavedByMe, refresh } = useData();
  const { theme } = useTheme();
  const art = getArtwork(artworkId);
  const [deleting, setDeleting] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomAutoplay, setZoomAutoplay] = useState(false);
  const [busyHero, setBusyHero] = useState(false);
  const [busySave, setBusySave] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [sharingCard, setSharingCard] = useState(false);

  // 조회수 +1 (세션당 한 번)
  useEffect(() => {
    if (!artworkId) return;
    const key = `siseonjip:viewed:${artworkId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    incrementArtworkView(artworkId);
  }, [artworkId]);

  if (!art) return <EmptyState title="사진을 찾을 수 없어요" onAction={() => setScreen('home')} actionLabel="홈으로" />;

  const profile = getProfile(art.user_id);
  const exifLine = [art.camera_make, art.camera_model, art.lens].filter(Boolean).join(' · ');
  const takenLabel = art.taken_at
    ? new Date(art.taken_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')
    : null;
  const place = getPlace(art.place_id);
  const userPhotos = getUserArtworks(art.user_id);
  const related = userPhotos.filter((item) => item.id !== art.id).slice(0, 3);
  const sameNeighborhood = artworks
    .filter((a) => a.id !== art.id && art.place_id && a.place_id === art.place_id && a.location_mode !== '숨김')
    .slice(0, 6);
  const sameKeyword = artworks
    .filter(
      (a) =>
        a.id !== art.id &&
        art.daily_vision &&
        a.daily_vision === art.daily_vision &&
        a.location_mode !== '숨김' &&
        (!art.place_id || a.place_id !== art.place_id)
    )
    .slice(0, 6);
  const isMine = art.user_id === userId;
  const isHero = profile?.hero_artwork_id === art.id;

  const handleDelete = async () => {
    if (!window.confirm('이 사진을 정말 삭제할까요? 되돌릴 수 없어요.')) return;
    setDeleting(true);
    try {
      await deleteArtwork(art.id, userId, art.storage_path);
      await refresh();
      setScreen('archive');
    } catch (err) {
      alert('삭제 실패: ' + err.message);
      setDeleting(false);
    }
  };

  const handleSetHero = async () => {
    setBusyHero(true);
    try {
      await setHeroArtwork(userId, isHero ? null : art.id);
      await refresh();
    } catch (err) {
      alert('히어로 설정 실패: ' + err.message);
    } finally {
      setBusyHero(false);
    }
  };

  const saved = isSavedByMe(art.id);
  const handleSave = async () => {
    if (!userId) return;
    setBusySave(true);
    try {
      await toggleSave(art.id, userId, saved);
      await refresh();
    } catch (err) {
      alert('저장 실패: ' + err.message);
    } finally {
      setBusySave(false);
    }
  };

  const handleShareSingle = async () => {
    setSharingCard(true);
    try {
      await shareSinglePhotoCard({ photo: art, profile, theme });
    } catch (err) {
      alert('카드 생성 실패: ' + err.message);
    } finally {
      setSharingCard(false);
    }
  };

  const zoomIndex = Math.max(0, userPhotos.findIndex((a) => a.id === art.id));

  // 이전/다음 글 네비게이션 — 전체 피드(공개)에서 같은 알고리즘 정렬로 인접 항목 찾기
  const feedNav = useMemo(() => {
    const candidates = artworks.filter((a) => a.location_mode !== '숨김');
    const now = Date.now();
    const sorted = candidates
      .map((a) => {
        const ageHours = (now - new Date(a.created_at).getTime()) / 3600000;
        const recencyScore = 1 / (1 + ageHours / 24);
        const hypeScore = Math.log1p(getHypeCount(a.id)) * 0.6;
        return { a, score: recencyScore + hypeScore };
      })
      .sort((x, y) => y.score - x.score)
      .map((s) => s.a);
    const idx = sorted.findIndex((a) => a.id === art.id);
    if (idx === -1) return { prev: null, next: null };
    return {
      prev: idx > 0 ? sorted[idx - 1] : null,
      next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
    };
  }, [artworks, getHypeCount, art.id]);

  return (
    <>
      <button type="button" onClick={() => setScreen('home')} className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]">
        <Icon name="back" size={18} />
      </button>
      <div className="space-y-4">
        {/* 게시물 헤더 — 제목/작성자/메타 (DC 게시물 스타일) */}
        <section className="rounded-t-[20px] border-b border-[var(--border)] bg-[var(--surface)] p-4">
          <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.06em]">
            <span className="mr-1.5 align-middle text-[14px] font-semibold text-[var(--text-muted)]">[사진 📷]</span>
            {art.title || '제목 없음'}
          </h1>
          <button
            type="button"
            onClick={() => openPerson?.(art.user_id)}
            className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold"
          >
            <span>{profileLabel(profile)}</span>
            <span className="text-[var(--text-faint)]">›</span>
          </button>
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            <span>📅 {formatTime(art.taken_at) || formatTime(art.created_at)}</span>
            <span className="mx-1.5 text-[var(--text-faint)]">|</span>
            <button
              type="button"
              onClick={() => place && openPlace(place.id)}
              className="underline-offset-2 hover:underline"
            >
              📍 {art.location_mode === '개인전만' || art.location_mode === '숨김'
                ? '장소 비공개'
                : place
                ? placeLabel(place)
                : '장소 미상'}
            </button>
          </p>
          <p className="mt-1.5 text-[10px] tracking-wide text-[var(--text-faint)]">
            조회 {art.view_count ?? 0} · 🔥 추천 받음 {/* live count via HypeButton */}
          </p>
        </section>

        {/* 사진 본문 — DC식 풀 폭 사진 */}
        <section className="relative overflow-hidden rounded-[20px] bg-[var(--ink)] shadow-[0_0_0_1px_var(--ink)]">
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="relative flex min-h-[480px] w-full items-center justify-center bg-[var(--ink)]"
            aria-label="사진 확대해서 보기"
          >
            <ImageBox src={art.imageUrl} alt={art.title} fit="contain" className="h-[560px] w-full bg-[var(--ink)]" priority />
            {art.is_twenty_five && (
              <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--text)]">
                🌟 25번째 사진
              </span>
            )}
            {isHero && (
              <span className="absolute left-3 top-12 rounded-full bg-yellow-300 px-3 py-1 text-xs font-semibold text-[var(--text)]">
                ⭐ 대표 이미지
              </span>
            )}
            {(exifLine || takenLabel) && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/60 to-transparent px-4 pb-2 pt-8 text-[10px] tracking-wide text-white/80">
                <span className="truncate">{exifLine}</span>
                {takenLabel && <span className="shrink-0">{takenLabel}</span>}
              </div>
            )}
          </button>
          <div className="absolute right-3 top-3"><ShareButton title={art.title || '시선집'} /></div>
        </section>

        {/* 본문 노트 + 키워드 */}
        {(art.note || art.daily_vision) && (
          <section className="rounded-[20px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
            {art.note && <p className="text-[15px] leading-7 text-[var(--text-quote)]">{art.note}</p>}
            {art.daily_vision && (
              <button
                type="button"
                onClick={() => openKeyword?.(art.daily_vision)}
                className={`${art.note ? 'mt-3' : ''} inline-block rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text)]`}
              >
                #{art.daily_vision}
              </button>
            )}
          </section>
        )}

        {/* 추천/저장/공유 액션바 */}
        <section className="rounded-[20px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
          <div className="flex flex-wrap items-center gap-2">
            <HypeButton artwork={art} />
            {userId && !isMine && (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={busySave}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                    saved
                      ? 'border border-[var(--ink)] bg-[var(--ink)] text-white'
                      : 'border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]'
                  }`}
                >
                  {saved ? '🔖 저장됨' : '🔖 저장'}
                </button>
                {openCollectionPicker && (
                  <button
                    type="button"
                    onClick={() => openCollectionPicker(art.id)}
                    className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]"
                  >
                    + 컬렉션
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={handleShareSingle}
              disabled={sharingCard}
              className="rounded-full border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] disabled:opacity-50"
              title="이 사진을 카드로 공유"
            >
              {sharingCard ? '카드 만드는 중…' : '📤 공유 카드'}
            </button>
            {userId && !isMine && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                title="신고"
              >
                🚩
              </button>
            )}
            {isMine && (
              <>
                <button
                  type="button"
                  onClick={handleSetHero}
                  disabled={busyHero}
                  className={`ml-auto rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${isHero ? 'border border-yellow-400 bg-yellow-200 text-[var(--text)]' : 'border border-[var(--border-strong)] text-[var(--text)]'}`}
                  title={isHero ? '대표 이미지 해제' : '내 프로필의 대표 이미지로 설정'}
                >
                  {isHero ? '⭐ 대표' : '⭐ 대표로'}
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('artworkEdit')}
                  className="rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]"
                >
                  편집
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50"
                >
                  {deleting ? '삭제 중…' : '🗑'}
                </button>
              </>
            )}
          </div>
        </section>

        {/* DC 게시물 하단 큰 추천 버튼 */}
        {userId && !isMine && (
          <section>
            <HypeButton artwork={art} large />
          </section>
        )}

        <CommentSection artworkId={art.id} openPerson={openPerson} />

        {(feedNav.prev || feedNav.next) && (
          <section className="flex gap-2">
            <button
              type="button"
              onClick={() => feedNav.prev && openArtwork(feedNav.prev.id)}
              disabled={!feedNav.prev}
              className="flex-1 truncate rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-xs disabled:opacity-40"
            >
              <span className="block text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">‹ 이전 글</span>
              <span className="mt-0.5 block truncate font-bold text-[var(--text)]">
                {feedNav.prev ? (feedNav.prev.title || '제목 없음') : '없음'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => feedNav.next && openArtwork(feedNav.next.id)}
              disabled={!feedNav.next}
              className="flex-1 truncate rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-right text-xs disabled:opacity-40"
            >
              <span className="block text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">다음 글 ›</span>
              <span className="mt-0.5 block truncate font-bold text-[var(--text)]">
                {feedNav.next ? (feedNav.next.title || '제목 없음') : '없음'}
              </span>
            </button>
          </section>
        )}

        {related.length > 0 && (
          <section>
            <h2 className="mb-3 text-[20px] font-extrabold tracking-[-0.06em]">같은 사람의 사진</h2>
            <div className="grid grid-cols-3 gap-2">
              {related.map((item) => (
                <button key={item.id} type="button" onClick={() => openArtwork(item.id)}>
                  <ImageBox src={item.imageUrl} alt={item.title} className="aspect-square rounded-[16px]" />
                </button>
              ))}
            </div>
          </section>
        )}

        {sameNeighborhood.length > 0 && place && (
          <section>
            <button
              type="button"
              onClick={() => openPlace(place.id)}
              className="mb-3 flex w-full items-baseline justify-between text-left"
            >
              <h2 className="text-[20px] font-extrabold tracking-[-0.06em]">📍 {place.name || placeLabel(place)}의 다른 사진</h2>
              <span className="text-[11px] text-[var(--text-muted)]">전체 ›</span>
            </button>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
              {sameNeighborhood.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openArtwork(item.id)}
                  className="shrink-0"
                >
                  <ImageBox src={item.imageUrl} alt={item.title} className="h-[140px] w-[140px] rounded-[14px]" />
                </button>
              ))}
            </div>
          </section>
        )}

        {sameKeyword.length > 0 && (
          <section>
            <button
              type="button"
              onClick={() => openKeyword?.(art.daily_vision)}
              className="mb-3 flex w-full items-baseline justify-between text-left"
            >
              <h2 className="text-[20px] font-extrabold tracking-[-0.06em]">#{art.daily_vision}</h2>
              <span className="text-[11px] text-[var(--text-muted)]">전체 ›</span>
            </button>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
              {sameKeyword.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openArtwork(item.id)}
                  className="shrink-0"
                >
                  <ImageBox src={item.imageUrl} alt={item.title} className="h-[140px] w-[140px] rounded-[14px]" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {zoomOpen && (
        <PhotoZoomModal
          photos={userPhotos}
          initialIndex={zoomIndex}
          autoplay={zoomAutoplay}
          onClose={() => { setZoomOpen(false); setZoomAutoplay(false); }}
        />
      )}

      {reportOpen && (
        <ReportModal
          target={{ artworkId: art.id, userId: art.user_id }}
          onClose={() => setReportOpen(false)}
        />
      )}
    </>
  );
}
