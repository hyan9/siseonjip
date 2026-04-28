import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../lib/data-context';
import { useTheme } from '../lib/theme-context';
import {
  Header,
  ImageBox,
  EmptyState,
} from '../components/ui';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import { FourPhotoWall } from '../components/Cards';
import ReportModal from '../components/ReportModal';
import ConfirmDialog from '../components/ConfirmDialog';
import SettingsSheet from '../components/SettingsSheet';
import PhotoZoomModal from '../components/PhotoZoomModal';
import { IconSaved, IconCollections, IconActivity, IconEdit, IconSettings, IconShare, IconCalendar, IconLock, IconMessage, IconReport, IconBlock, IconHype, IconStar } from '../components/icons/AppIcons';
import {
  seedDemoArtworks,
  toggleFollow,
  toggleBlock,
} from '../lib/db';


import { signOut } from '../lib/auth-context';
import {
  shareFourCutCard,
  shareWeeklyRecapCard,
} from '../lib/share-card';





export default function PersonExhibition({ userId: viewedId, setScreen, openArtwork, openConversation, openPerson }) {
  const {
    userId,
    getProfile,
    getUserArtworks,
    getCurateForUser,
    getStats,
    isFollowing,
    isBlocked,
    getHypeCount,
    getFollowers,
    getFollowing,
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [followListType, setFollowListType] = useState(null); // 'followers' | 'following'
  const [galleryStart, setGalleryStart] = useState(null); // 갤러리 zoom 시작 인덱스

  if (!profile) return <EmptyState title="사용자를 찾을 수 없어요" onAction={() => setScreen('home')} actionLabel="홈으로" />;

  const twentyFiveArt = works.find((a) => a.is_twenty_five) || null;
  const heroArtwork = profile.hero_artwork_id ? works.find((a) => a.id === profile.hero_artwork_id) : null;
  const featured = twentyFiveArt || heroArtwork;
  const featuredLabel = twentyFiveArt ? '25번째 사진' : '대표 이미지';
  const featuredSub = twentyFiveArt
    ? '월터의 상상은 현실이 된다 — 가장 오래 남은 한 장'
    : '아직 찾는 중';

  // 카든 온도 — 사진/팔로워/하입을 합친 활동성 지표 (당근마켓 매너온도 오마주)
  // 기본 36.5°C + 사진(0.05) + 팔로워(0.03) + 받은 하입(0.02) + 25번째(0.5)
  const totalHypeReceived = works.reduce((sum, a) => sum + getHypeCount(a.id), 0);
  const temperature = Math.min(
    99.9,
    36.5
      + works.length * 0.05
      + stats.followerCount * 0.03
      + totalHypeReceived * 0.02
      + (twentyFiveArt ? 0.5 : 0)
  );
  const tempColor =
    temperature >= 39 ? 'text-red-500' :
    temperature >= 37.5 ? 'text-orange-500' :
    temperature >= 36.8 ? 'text-emerald-600' :
    'text-[var(--text-muted)]';
  const tempEmoji =
    temperature >= 39 ? '🔥' :
    temperature >= 37.5 ? '☀️' :
    temperature >= 36.8 ? '🌱' :
    '❄️';

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
    if (profile?.is_bot) {
      alert('데모 봇이라 실제 팔로우는 작동하지 않아요. 팔로워/팔로잉 화면이 어떻게 보이는지 살펴봐 주세요.');
      return;
    }
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
        title={profile.is_bot ? `${profile.nickname} · demo` : profile.nickname}
        subtitle={profile.bio || ''}
        kicker={isMe ? '내 개인전' : '개인전'}
        onBack={isMe ? undefined : () => setScreen('home')}
        right={
          isMe ? (
            // 우상단은 설정 하나만 — 저장/컬렉션/활동/메시지/프로필 편집은 TopBar 햄버거 메뉴에 통합되어 있음
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              title="설정"
            >
              <IconSettings size={17} />
            </button>
          ) : null
        }
      />
      <div className="space-y-4">
        <section className="rounded-[24px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
          <div className="flex gap-3">
            {/* 프로필 사진 — 25번째 우선, 없으면 첫 작품, 둘 다 없으면 마스코트 placeholder */}
            {(() => {
              const profilePhoto = featured || works[0] || null;
              if (profilePhoto) {
                return (
                  <button
                    type="button"
                    onClick={() => openArtwork(profilePhoto.id)}
                    className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-full"
                  >
                    <ImageBox src={profilePhoto.imageUrl} alt={profilePhoto.title} className="h-full w-full" priority />
                    {twentyFiveArt && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink)] text-white">
                        <IconStar size={11} filled />
                      </span>
                    )}
                  </button>
                );
              }
              // 작품 0개 — 마스코트 placeholder
              return (
                <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
                  <Icon name="camera" size={32} />
                </div>
              );
            })()}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                {profile.exhibition_title ? (
                  <h2 className="line-clamp-2 flex-1 text-[20px] font-extrabold leading-[1.15] tracking-[-0.07em]">
                    {profile.exhibition_title}
                  </h2>
                ) : (
                  <span className="flex-1" />
                )}
                {/* 카든 온도 — 우상단 게이지 (36.5° → 45° 범위 시각화) */}
                <div
                  className="flex shrink-0 flex-col items-end gap-1"
                  title={`사진 ${works.length}장 · 받은 하입 ${totalHypeReceived} · 팔로워 ${stats.followerCount}`}
                >
                  <span className={`flex items-baseline gap-0.5 text-[16px] font-extrabold leading-none tracking-[-0.05em] ${tempColor}`}>
                    {tempEmoji}{temperature.toFixed(1)}°
                  </span>
                  <div className="relative h-1.5 w-[68px] overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <div
                      className={`h-full rounded-full transition-[width] duration-700 ${
                        temperature >= 39 ? 'bg-red-500' :
                        temperature >= 37.5 ? 'bg-orange-400' :
                        temperature >= 36.8 ? 'bg-emerald-500' :
                        'bg-cyan-400'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, ((temperature - 36.5) / (45 - 36.5)) * 100))}%` }}
                    />
                  </div>
                  <span className="text-[8.5px] font-semibold tracking-[0.16em] text-[var(--text-faint)]">
                    카든 온도
                  </span>
                </div>
              </div>
              {profile.note && (
                <p className={`${profile.exhibition_title ? 'mt-2' : 'mt-1'} line-clamp-3 text-[12px] leading-[1.6] text-[var(--text-body)]`}>
                  {profile.note}
                </p>
              )}
              {profile.words?.length > 0 && (
                <div className={`${(profile.exhibition_title || profile.note) ? 'mt-2' : 'mt-1'} flex flex-wrap gap-1`}>
                  {profile.words.map((word) => (
                    <span key={word} className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">{word}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats — 사진/팔로워/팔로잉 (팔로워·팔로잉은 클릭하면 목록) */}
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3 text-center">
            <div>
              <p className="text-[18px] font-extrabold tracking-[-0.05em]">{stats.artworkCount}</p>
              <p className="text-[10px] text-[var(--text-muted)]">사진</p>
            </div>
            <button
              type="button"
              onClick={() => stats.followerCount > 0 && setFollowListType('followers')}
              disabled={stats.followerCount === 0}
              className="rounded-[8px] py-1 transition hover:bg-[var(--surface-2)] disabled:cursor-default disabled:hover:bg-transparent"
            >
              <p className="text-[18px] font-extrabold tracking-[-0.05em]">{stats.followerCount}</p>
              <p className="text-[10px] text-[var(--text-muted)]">팔로워</p>
            </button>
            <button
              type="button"
              onClick={() => stats.followingCount > 0 && setFollowListType('following')}
              disabled={stats.followingCount === 0}
              className="rounded-[8px] py-1 transition hover:bg-[var(--surface-2)] disabled:cursor-default disabled:hover:bg-transparent"
            >
              <p className="text-[18px] font-extrabold tracking-[-0.05em]">{stats.followingCount}</p>
              <p className="text-[10px] text-[var(--text-muted)]">팔로잉</p>
            </button>
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-muted)]"
                  title="메시지"
                >
                  <IconMessage size={16} />
                </button>
              )}
              {/* 신고/차단 통합 — ⋯ 더보기 메뉴 안에 */}
              <PersonMoreMenu
                blocked={blocked}
                blockBusy={blockBusy}
                onReport={() => setReportOpen(true)}
                onBlockToggle={() => setBlockOpen(true)}
              />
            </div>
          )}

          {isMe && works.length === 0 && (
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="mt-3 w-full rounded-full bg-[var(--ink)] px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
            >
              {seeding ? '…' : '🌱 샘플 사진 5장 추가'}
            </button>
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
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ink)] px-2 py-0.5 text-[10px] font-semibold text-white">
                  <IconHype size={11} filled /> {getHypeCount(stats.topArtwork.id)}
                </span>
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
            : <FourPhotoWall photos={wall} onOpen={(id) => {
                const i = works.findIndex((a) => a.id === id);
                setGalleryStart(i >= 0 ? i : 0);
              }} />}
        </section>

        {/* 자주 쓰는 단어 — 작가의 시선 키워드 */}
        {(() => {
          const counts = new Map();
          for (const a of works) if (a.daily_vision) counts.set(a.daily_vision, (counts.get(a.daily_vision) ?? 0) + 1);
          const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
          if (top.length === 0) return null;
          return (
            <section>
              <h2 className="mb-2 text-[16px] font-extrabold tracking-[-0.05em]">자주 쓰는 단어</h2>
              <div className="flex flex-wrap gap-1.5">
                {top.map(([word, n]) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold"
                  >
                    #{word}
                    <span className="text-[10px] text-[var(--text-faint)]">{n}</span>
                  </span>
                ))}
              </div>
            </section>
          );
        })()}

        {/* 모든 작품 — 시간순 그리드 (필름 타임라인은 캘린더에 있으니 여기는 단순 그리드) */}
        {works.length > 0 && (
          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-[16px] font-extrabold tracking-[-0.05em]">모든 작품</h2>
              <span className="text-[10px] text-[var(--text-muted)]">{works.length}장</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {works.map((art, i) => (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => setGalleryStart(i)}
                  className="relative overflow-hidden rounded-[8px]"
                >
                  <ImageBox src={art.imageUrl} alt={art.title} className="aspect-square w-full" />
                  {art.is_twenty_five && (
                    <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                      <IconStar size={9} filled />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}
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

      {settingsOpen && isMe && (
        <SettingsSheet
          onClose={() => setSettingsOpen(false)}
          onMessages={() => { setSettingsOpen(false); setScreen('messages'); }}
          onLogout={() => { setSettingsOpen(false); setLogoutOpen(true); }}
          extraItems={[
            wall.length >= 1 && {
              label: '4컷 카드 만들기',
              iconNode: <IconShare size={18} />,
              onClick: () => { setSettingsOpen(false); handleExport4Cut(); },
              busy: exporting,
            },
            works.length > 0 && {
              label: '이번 주 회고',
              iconNode: <IconCalendar size={18} />,
              onClick: () => { setSettingsOpen(false); handleWeeklyRecap(); },
              busy: recapBusy,
            },
            works.length > 0 && {
              label: '공개 일괄 변경',
              iconNode: <IconLock size={18} />,
              onClick: () => { setSettingsOpen(false); setScreen('bulkPrivacy'); },
            },
          ].filter(Boolean)}
        />
      )}

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

      {galleryStart != null && (
        <PhotoZoomModal
          photos={works}
          initialIndex={galleryStart}
          onClose={() => setGalleryStart(null)}
        />
      )}

      {followListType && (
        <FollowListModal
          title={followListType === 'followers' ? `팔로워 ${stats.followerCount}` : `팔로잉 ${stats.followingCount}`}
          rows={
            followListType === 'followers'
              ? getFollowers(viewedId).map((f) => getProfile(f.follower_id)).filter(Boolean)
              : getFollowing(viewedId).map((f) => getProfile(f.followee_id)).filter(Boolean)
          }
          onClose={() => setFollowListType(null)}
          onOpenPerson={(id) => { setFollowListType(null); openPerson?.(id); }}
        />
      )}
    </>
  );
}

function FollowListModal({ title, rows, onClose, onOpenPerson }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[430px] overflow-hidden rounded-[20px] bg-[var(--surface)] shadow-[0_-8px_24px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h3 className="text-[15px] font-extrabold tracking-[-0.05em]">{title}</h3>
          <button type="button" onClick={onClose} className="text-[var(--text-muted)]">×</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {rows.length === 0 ? (
            <p className="p-6 text-center text-[12px] text-[var(--text-muted)]">아직 비어 있어요.</p>
          ) : (
            rows.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onOpenPerson?.(p.id)}
                className="flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-left last:border-b-0 hover:bg-[var(--surface-2)]"
              >
                <Avatar profile={p} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold tracking-[-0.04em]">{p.nickname}</p>
                  {p.bio && <p className="truncate text-[11px] text-[var(--text-muted)]">{p.bio}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// 신고/차단 통합 — ⋯ 더보기 드롭다운
function PersonMoreMenu({ blocked, blockBusy, onReport, onBlockToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={blockBusy}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] disabled:opacity-50"
        title="더보기"
        aria-label="더보기"
      >
        <span className="text-[18px] leading-none">⋯</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-[12px] bg-[var(--surface)] shadow-[0_12px_32px_rgba(0,0,0,0.18),0_0_0_1px_var(--border)]">
          <button
            type="button"
            onClick={() => { setOpen(false); onReport(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            <IconReport size={14} className="text-[var(--text-muted)]" />
            신고
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onBlockToggle(); }}
            className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-semibold hover:bg-[var(--surface-2)] ${
              blocked ? 'text-red-600' : 'text-[var(--text)]'
            }`}
          >
            <IconBlock size={14} className={blocked ? 'text-red-600' : 'text-[var(--text-muted)]'} />
            {blocked ? '차단 해제' : '차단'}
          </button>
        </div>
      )}
    </div>
  );
}

// 필름 타임라인 — 날짜별 그룹, 작은 썸네일 그리드
// onOpenAt(globalIndex)을 받아 갤러리 zoom 시작 인덱스를 부모에 전달.
function FilmTimeline({ works, onOpenAt }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const art of works) {
      const d = new Date(art.created_at);
      const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(art);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [works]);

  // works 배열 내 글로벌 인덱스를 미리 매핑
  const indexById = useMemo(() => {
    const m = new Map();
    works.forEach((a, i) => m.set(a.id, i));
    return m;
  }, [works]);

  return (
    <div className="space-y-4">
      {groups.map(([date, items]) => (
        <div key={date} className="flex gap-3">
          <div className="w-[64px] shrink-0 pt-1">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-[var(--text-muted)]">
              {date}
            </p>
            <p className="text-[10px] text-[var(--text-faint)]">{items.length}컷</p>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-1.5">
            {items.map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => onOpenAt?.(indexById.get(art.id) ?? 0)}
                className="relative overflow-hidden rounded-[8px]"
              >
                <ImageBox src={art.imageUrl} alt={art.title} className="aspect-square w-full" />
                {art.is_twenty_five && (
                  <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ink)] text-white">
                    <IconStar size={9} filled />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
