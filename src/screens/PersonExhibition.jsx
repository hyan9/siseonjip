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
import { FourPhotoWall, PhotoTile, PersonRow, PlaceRow, PostListRow } from '../components/Cards';
import CommentSection from '../components/CommentSection';
import ReportModal from '../components/ReportModal';
import ConfirmDialog from '../components/ConfirmDialog';
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

export default function PersonExhibition({ userId: viewedId, setScreen, openArtwork, openConversation }) {
  const {
    userId,
    getProfile,
    getUserArtworks,
    getCurateForUser,
    getStats,
    isFollowing,
    isBlocked,
    getHypeCount,
    refresh,
  } = useData();
  const { theme } = useTheme();
  const profile = getProfile(viewedId);
  const works = getUserArtworks(viewedId);
  const wall = getCurateForUser(viewedId);
  const isMe = viewedId === userId;
  const stats = getStats(viewedId);
  const following = isFollowing(viewedId);
  const blocked = isBlocked(viewedId);
  const [seeding, setSeeding] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [recapBusy, setRecapBusy] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  if (!profile) return <EmptyState title="사용자를 찾을 수 없어요" onAction={() => setScreen('home')} actionLabel="홈으로" />;

  const twentyFiveArt = works.find((a) => a.is_twenty_five) || null;
  const heroArtwork = profile.hero_artwork_id ? works.find((a) => a.id === profile.hero_artwork_id) : null;
  const featured = twentyFiveArt || heroArtwork;
  const featuredLabel = twentyFiveArt ? '🌟 25번째 사진' : '대표 이미지';

  const handleLogoutConfirm = async () => {
    setLogoutOpen(false);
    await signOut();
  };

  const handleSeed = async () => {
    if (!window.confirm('샘플 사진 5장을 내 계정에 추가할까요? (나중에 직접 삭제 가능)')) return;
    setSeeding(true);
    try {
      await seedDemoArtworks(userId);
      await refresh();
    } catch (error) {
      alert('시딩 실패: ' + error.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleFollow = async () => {
    if (!userId || isMe) return;
    setFollowBusy(true);
    try {
      await toggleFollow(viewedId, userId, following);
      await refresh();
    } catch (err) {
      alert('실패: ' + err.message);
    } finally {
      setFollowBusy(false);
    }
  };

  const handleExport4Cut = async () => {
    if (wall.length === 0) {
      alert('4컷이 비어있어요. 먼저 큐레이팅 해주세요.');
      return;
    }
    setExporting(true);
    try {
      await shareFourCutCard({ photos: wall, profile, theme });
    } catch (err) {
      alert('카드 생성 실패: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleBlockConfirm = async () => {
    if (!userId || isMe) return;
    setBlockOpen(false);
    setBlockBusy(true);
    try {
      await toggleBlock(viewedId, userId, blocked);
      await refresh();
    } catch (err) {
      alert('실패: ' + err.message);
    } finally {
      setBlockBusy(false);
    }
  };

  const handleWeeklyRecap = async () => {
    setRecapBusy(true);
    try {
      const weekAgo = Date.now() - 7 * 86400000;
      const recent = works
        .filter((a) => new Date(a.created_at).getTime() >= weekAgo && a.location_mode !== '숨김')
        .map((a) => ({ ...a, hype: getHypeCount(a.id) }))
        .sort((a, b) => b.hype - a.hype || new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      if (recent.length === 0) {
        alert('이번 주 올린 사진이 없어요.');
        return;
      }
      const today = new Date();
      const start = new Date(today.getTime() - 6 * 86400000);
      const fmt = (d) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
      const weekRange = `${fmt(start)} – ${fmt(today)}`;
      await shareWeeklyRecapCard({ photos: recent, profile, theme, weekRange });
    } catch (err) {
      alert('회고 카드 실패: ' + err.message);
    } finally {
      setRecapBusy(false);
    }
  };

  return (
    <>
      <Header
        title={`${profile.nickname}의 개인전`}
        subtitle={profile.bio || ''}
        kicker="개인전"
        onBack={isMe ? undefined : () => setScreen('home')}
        right={
          isMe ? (
            <div className="flex gap-2">
              <ThemeToggleButton />
              <button
                type="button"
                onClick={() => setScreen('messages')}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-base"
                title="메시지"
              >
                💬
              </button>
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]"
                title="로그아웃"
              >
                <Icon name="logout" size={16} />
              </button>
            </div>
          ) : null
        }
      />
      <div className="space-y-4">
        {featured && (
          <button
            type="button"
            onClick={() => openArtwork(featured.id)}
            className="relative -mx-4 -mt-2 block w-[calc(100%+2rem)] overflow-hidden text-left"
          >
            <ImageBox src={featured.imageUrl} alt={featured.title} className="h-[200px] w-full" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-white/80">{featuredLabel}</p>
              <p className="mt-1 text-[20px] font-extrabold leading-tight tracking-[-0.06em]">
                {featured.title || '제목 없는 사진'}
              </p>
            </div>
          </button>
        )}

        <section className="rounded-[28px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
          <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.075em]">{profile.exhibition_title || '제목 없는 전시'}</h2>
          {profile.note && <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{profile.note}</p>}
          {profile.words?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.words.map((word) => (
                <span key={word} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)]">{word}</span>
              ))}
            </div>
          )}

          {/* Stats — 인라인 메타 */}
          <div className="mt-4 flex items-center gap-1 text-[12px] text-[var(--text-muted)]">
            <span><b className="text-[var(--text)]">{stats.artworkCount}</b> 사진</span>
            <span className="px-1 text-[var(--text-faint)]">·</span>
            <span>🔥 <b className="text-[var(--text)]">{stats.totalHype}</b></span>
            <span className="px-1 text-[var(--text-faint)]">·</span>
            <span><b className="text-[var(--text)]">{stats.followerCount}</b> 팔로워</span>
            <span className="px-1 text-[var(--text-faint)]">·</span>
            <span><b className="text-[var(--text)]">{stats.followingCount}</b> 팔로잉</span>
          </div>

          {!isMe && userId && (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleFollow}
                disabled={followBusy}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
                  following
                    ? 'border border-[var(--ink)] bg-[var(--surface)] text-[var(--text)]'
                    : 'bg-[var(--ink)] text-white'
                }`}
              >
                <Icon name={following ? 'checkFollow' : 'plusFollow'} size={15} />
                {following ? '팔로잉' : '팔로우'}
              </button>
              {openConversation && (
                <button
                  type="button"
                  onClick={() => openConversation(viewedId)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-base"
                  title="메시지"
                >
                  💬
                </button>
              )}
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-base"
                title="신고"
              >
                🚩
              </button>
              <button
                type="button"
                onClick={() => setBlockOpen(true)}
                disabled={blockBusy}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base disabled:opacity-50 ${
                  blocked
                    ? 'border border-red-300 bg-red-50'
                    : 'border border-[var(--border)] bg-[var(--surface)]'
                }`}
                title={blocked ? '차단 해제' : '차단'}
              >
                🚫
              </button>
            </div>
          )}

          {isMe && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScreen('saved')}
                  className="flex flex-col items-center gap-1 rounded-[14px] border border-[var(--border)] bg-[var(--bg)] px-2 py-2.5 text-[11px] font-semibold"
                >
                  <span className="text-base leading-none">🔖</span>
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('collections')}
                  className="flex flex-col items-center gap-1 rounded-[14px] border border-[var(--border)] bg-[var(--bg)] px-2 py-2.5 text-[11px] font-semibold"
                >
                  <span className="text-base leading-none">📚</span>
                  컬렉션
                </button>
                <button
                  type="button"
                  onClick={() => setScreen('activity')}
                  className="flex flex-col items-center gap-1 rounded-[14px] border border-[var(--border)] bg-[var(--bg)] px-2 py-2.5 text-[11px] font-semibold"
                >
                  <span className="text-base leading-none">⚡</span>
                  활동
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setScreen('profileEdit')}
                  className="rounded-full border border-[var(--ink)] px-4 py-1.5 text-xs font-semibold"
                >
                  프로필 편집
                </button>
                {works.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setScreen('bulkPrivacy')}
                    className="rounded-full border border-[var(--border)] px-4 py-1.5 text-xs font-semibold text-[var(--text-muted)]"
                  >
                    공개 일괄 변경
                  </button>
                )}
              </div>

              {(wall.length >= 1 || works.length > 0) && (
                <div className="flex gap-2 border-t border-[var(--border)] pt-3">
                  {wall.length >= 1 && (
                    <button
                      type="button"
                      onClick={handleExport4Cut}
                      disabled={exporting}
                      className="flex-1 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      {exporting ? '만드는 중…' : '📤 4컷 카드'}
                    </button>
                  )}
                  {works.length > 0 && (
                    <button
                      type="button"
                      onClick={handleWeeklyRecap}
                      disabled={recapBusy}
                      className="flex-1 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      {recapBusy ? '만드는 중…' : '🗓 이번 주 회고'}
                    </button>
                  )}
                </div>
              )}

              {works.length === 0 && (
                <button
                  type="button"
                  onClick={handleSeed}
                  disabled={seeding}
                  className="w-full rounded-full bg-[var(--ink)] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {seeding ? '샘플 추가 중…' : '🌱 샘플 사진 5장 추가'}
                </button>
              )}
            </div>
          )}
        </section>

        {stats.topArtwork && stats.totalHype > 0 && (
          <section className="rounded-[24px] bg-[var(--surface)] p-3 shadow-[0_0_0_1px_var(--border)]">
            <button
              type="button"
              onClick={() => openArtwork(stats.topArtwork.id)}
              className="block w-full text-left"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">가장 인기 있는 사진</p>
                <span className="rounded-full bg-[var(--ink)] px-2 py-0.5 text-[10px] font-semibold text-white">🔥 {getHypeCount(stats.topArtwork.id)}</span>
              </div>
              <div className="overflow-hidden rounded-[18px]">
                <ImageBox src={stats.topArtwork.imageUrl} alt={stats.topArtwork.title} className="h-44" />
              </div>
              <p className="mt-2 px-1 text-sm font-bold tracking-[-0.04em]">{stats.topArtwork.title || '제목 없음'}</p>
            </button>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[25px] font-extrabold tracking-[-0.07em]">오늘의 4컷</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--border-strong)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">{Math.min(wall.length, 4)}/4</span>
              {isMe && (
                <button type="button" onClick={() => setScreen('curate')} className="rounded-full border border-[var(--ink)] px-3 py-1.5 text-xs font-semibold">
                  수정
                </button>
              )}
            </div>
          </div>
          {wall.length === 0
            ? <EmptyState title="아직 4컷이 없어요" hint={isMe ? '사진을 올리면 자동으로 채워져요.' : ''} />
            : <FourPhotoWall photos={wall} onOpen={openArtwork} />}
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[25px] font-extrabold tracking-[-0.07em]">필름</h2>
            <span className="text-[11px] text-[var(--text-muted)]">{works.length}건</span>
          </div>
          {works.length === 0 ? (
            <EmptyState title="아직 사진이 없어요" />
          ) : (
            <div className="rounded-[20px] bg-[var(--surface)] px-4 shadow-[0_0_0_1px_var(--border)]">
              {works.map((art) => (
                <PostListRow key={art.id} artwork={art} onOpen={openArtwork} />
              ))}
            </div>
          )}
        </section>
      </div>

      {reportOpen && (
        <ReportModal
          target={{ userId: viewedId }}
          onClose={() => setReportOpen(false)}
        />
      )}

      <ConfirmDialog
        open={logoutOpen}
        title="로그아웃 할까요?"
        message="다시 들어오려면 같은 계정으로 로그인이 필요해요."
        confirmLabel="로그아웃"
        destructive
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutOpen(false)}
      />

      <ConfirmDialog
        open={blockOpen}
        title={blocked ? '차단을 해제할까요?' : `${profile.nickname}을(를) 차단할까요?`}
        message={
          blocked
            ? '다시 서로의 콘텐츠가 보이게 됩니다.'
            : '차단하면 서로의 사진/댓글/메시지가 보이지 않습니다.'
        }
        confirmLabel={blocked ? '차단 해제' : '차단'}
        destructive={!blocked}
        onConfirm={handleBlockConfirm}
        onCancel={() => setBlockOpen(false)}
      />
    </>
  );
}
