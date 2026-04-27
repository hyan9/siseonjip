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
import { IconShare, IconCollections, IconReport, IconStar, IconEdit, IconTrash, IconBookmark } from '../components/icons/AppIcons';
import MapView from '../components/MapView';
import HypeButton from '../components/HypeButton';
import ShareButton from '../components/ShareButton';
import { FourPhotoWall, PhotoTile, PersonRow, PlaceRow } from '../components/Cards';
import CommentSection from '../components/CommentSection';
import ReportModal from '../components/ReportModal';
import LocationPickerModal from '../components/LocationPickerModal';
import PhotoZoomModal from '../components/PhotoZoomModal';
import { blockIfBotAction, isBotArtworkId } from '../lib/bot-seed';
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

export default function ArtworkDetail({ artworkId, setScreen, openArtwork, openPlace, openPerson, openKeyword, openCamera, openCollectionPicker }) {
  const { userId, artworks, getArtwork, getProfile, getPlace, getUserArtworks, getHypeCount, getCommentsFor, isHypedByMe, isSavedByMe, refresh } = useData();
  const { theme } = useTheme();
  const art = getArtwork(artworkId);
  const [deleting, setDeleting] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomAutoplay, setZoomAutoplay] = useState(false);
  const [busyHero, setBusyHero] = useState(false);
  const [busySave, setBusySave] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [sharingCard, setSharingCard] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false); // 카메라/시간 등 메타 토글

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
  const hypeCount = getHypeCount(art.id);
  const hyped = isHypedByMe(art.id);
  const commentCount = getCommentsFor(art.id).length;
  const [busyHype, setBusyHype] = useState(false);
  const handleHypeToggle = async () => {
    if (!userId) return;
    if (blockIfBotAction({ artworkId: art.id, userId: art.user_id, kind: 'hype' })) return;
    setBusyHype(true);
    try { await toggleHype(art.id, userId, hyped); await refresh(); }
    catch (err) { console.error(err); }
    finally { setBusyHype(false); }
  };
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
    if (blockIfBotAction({ artworkId: art.id, userId: art.user_id, kind: 'save' })) return;
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

  // 줌 모달 — 같은 날 작성자가 올린 4장만 묶음 (오늘의 4컷)
  const dayPhotos = useMemo(() => {
    const target = new Date(art.created_at).toDateString();
    return userPhotos
      .filter((a) => new Date(a.created_at).toDateString() === target)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [userPhotos, art.created_at]);
  const zoomIndex = Math.max(0, dayPhotos.findIndex((a) => a.id === art.id));

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
      <div className="space-y-3">
        {/* 통합 본문 카드 — 제목 / 작성자 / 사진 / 노트 / 추천바 / 부가 액션 */}
        <article className="overflow-hidden rounded-[20px] bg-[var(--surface)] shadow-[0_0_0_1px_var(--border)]">
          {/* 헤더: 제목 + 작성자 아바타 + 메타 */}
          <header className="border-b border-[var(--border)] p-4">
            <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.06em]">
              {art.title}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => openPerson?.(art.user_id)}
                className="shrink-0"
              >
                <Avatar profile={profile} size={28} />
              </button>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 text-[11px] text-[var(--text-muted)]">
                <button
                  type="button"
                  onClick={() => openPerson?.(art.user_id)}
                  className="font-semibold text-[var(--text)]"
                >
                  {profileLabel(profile)}
                </button>
                <span className="text-[var(--text-faint)]">·</span>
                <span>{formatTime(art.taken_at) || formatTime(art.created_at)}</span>
                <span className="text-[var(--text-faint)]">·</span>
                <button
                  type="button"
                  onClick={() => place && openPlace(place.id)}
                  className="hover:underline"
                >
                  📍 {art.location_mode === '개인전만' || art.location_mode === '숨김'
                    ? '장소 비공개'
                    : place
                    ? placeLabel(place)
                    : '장소 미상'}
                </button>
              </div>
            </div>
          </header>

          {/* 사진 — 메인은 사진/제목/노트 위주. 메타는 토글로 */}
          <div className="relative bg-[var(--ink)]">
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className="relative flex min-h-[420px] w-full items-center justify-center"
              aria-label="사진 확대해서 보기"
            >
              <ImageBox src={art.imageUrl} alt={art.title} fit="contain" className="h-[520px] w-full bg-[var(--ink)]" priority />
              {art.is_twenty_five && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[var(--text)]">
                  <IconStar size={10} filled /> 25번째
                </span>
              )}
              {isHero && (
                <span className="absolute left-3 top-12 inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
                  <IconStar size={10} filled /> 대표
                </span>
              )}
              {detailOpen && (exifLine || takenLabel) && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/60 to-transparent px-4 pb-2 pt-8 text-[10px] tracking-wide text-white/80">
                  <span className="truncate">{exifLine}</span>
                  {takenLabel && <span className="shrink-0">{takenLabel}</span>}
                </div>
              )}
            </button>
            {/* 정보 토글 — 닫혀 있을 때만 작은 (i) 버튼 */}
            <button
              type="button"
              onClick={() => setDetailOpen((v) => !v)}
              aria-label="사진 정보"
              className="absolute bottom-2 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-[10px] font-bold text-white backdrop-blur-sm hover:bg-black/60"
            >
              {detailOpen ? '×' : 'i'}
            </button>
            {detailOpen && exifLine && openCamera && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openCamera({ make: art.camera_make, model: art.camera_model, lens: art.lens });
                }}
                className="absolute bottom-2 left-12 z-10 rounded-full bg-black/40 px-2 py-1 text-[10px] font-semibold tracking-wide text-white backdrop-blur-sm"
              >
                카메라 보기
              </button>
            )}
            <div className="absolute right-3 top-3"><ShareButton title={art.title || '시선집'} /></div>
            {/* 사진 좌우에 작은 이전/다음 화살표 (제목 없음, 방향만) */}
            {feedNav.prev && (
              <button
                type="button"
                onClick={() => openArtwork(feedNav.prev.id)}
                className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
                title="이전 글"
              >
                ‹
              </button>
            )}
            {feedNav.next && (
              <button
                type="button"
                onClick={() => openArtwork(feedNav.next.id)}
                className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
                title="다음 글"
              >
                ›
              </button>
            )}
          </div>

          {/* 본문 노트 */}
          {art.note && (
            <div className="border-t border-[var(--border)] p-4">
              <p className="text-[15px] leading-7 text-[var(--text-quote)]">{art.note}</p>
            </div>
          )}

          {/* 액션 — 가벼운 한 줄 */}
          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-2.5">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={userId && !isMine && !busyHype ? handleHypeToggle : undefined}
                disabled={!userId || isMine || busyHype}
                className={`flex items-center gap-1.5 text-[14px] font-bold transition ${
                  hyped ? 'text-yellow-500' : 'text-[var(--text-muted)]'
                } disabled:opacity-50`}
              >
                <IconStar size={20} filled={hyped} />
                {hypeCount}
              </button>
              <button
                type="button"
                onClick={userId && !isMine ? handleSave : undefined}
                disabled={!userId || isMine}
                className={`flex items-center transition ${saved ? 'text-[var(--ink)]' : 'text-[var(--text-muted)]'} disabled:opacity-30`}
                title={saved ? '저장됨' : '저장'}
              >
                <IconBookmark size={20} filled={saved} />
              </button>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">조회 {art.view_count ?? 0}</span>
          </div>
        </article>

        {/* 부가 액션 — SVG 아이콘 한 줄 */}
        <div className="flex items-center gap-3 px-2 text-[var(--text-muted)]">
          <button
            type="button"
            onClick={handleShareSingle}
            disabled={sharingCard}
            title="공유 카드"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-40"
          >
            <IconShare size={17} />
          </button>
          {userId && !isMine && openCollectionPicker && (
            <button
              type="button"
              onClick={() => openCollectionPicker(art.id)}
              title="컬렉션에 추가"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            >
              <IconCollections size={17} />
            </button>
          )}
          {userId && !isMine && (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              title="신고"
              className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-[var(--surface-2)]"
            >
              <IconReport size={17} />
            </button>
          )}
          {isMine && (
            <>
              <span className="ml-auto" />
              <button
                type="button"
                onClick={handleSetHero}
                disabled={busyHero}
                title={isHero ? '대표 해제' : '대표로'}
                className={`flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--surface-2)] disabled:opacity-50 ${isHero ? 'text-yellow-500' : ''}`}
              >
                <IconStar size={17} filled={isHero} />
              </button>
              <button
                type="button"
                onClick={() => setScreen('artworkEdit')}
                title="편집"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              >
                <IconEdit size={17} />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                title="삭제"
                className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-[var(--surface-2)] disabled:opacity-50"
              >
                <IconTrash size={17} />
              </button>
            </>
          )}
        </div>

        <div id="comment-section-anchor" />
        <CommentSection artworkId={art.id} openPerson={openPerson} />

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

      </div>

      {zoomOpen && (
        <PhotoZoomModal
          photos={dayPhotos}
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

function DcActionItem({ icon, label, onClick, highlight }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick || undefined}
      className={`flex flex-col items-center justify-center gap-0.5 rounded-[12px] py-2.5 text-[10px] font-semibold ${
        highlight
          ? 'bg-[var(--ink)] text-white'
          : onClick
          ? 'bg-[var(--bg)] text-[var(--text)] hover:bg-[var(--surface-2)]'
          : 'text-[var(--text-muted)]'
      }`}
    >
      <span className="text-[18px] leading-none">{icon}</span>
      <span className="leading-tight">{label}</span>
    </Tag>
  );
}
