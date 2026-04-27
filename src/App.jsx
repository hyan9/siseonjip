import { useEffect, useMemo, useState } from 'react';

import {
  AuthProvider,
  useAuth,
  signInWithEmail,
  signInWithGoogle,
  signInAnonymous,
  signOut,
} from './lib/auth-context';
import { DataProvider, useData } from './lib/data-context';
import { NotificationsProvider, useNotifications } from './lib/notifications-context';
import { ThemeProvider, useTheme } from './lib/theme-context';
import { hasSupabaseConfig } from './lib/supabase';
import { readPhotoMeta } from './lib/exif';
import { reverseGeocode, getCurrentPosition, distanceMeters } from './lib/geocoding';
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
} from './lib/db';

import Icon from './components/Icon';
import MapView from './components/MapView';

/* ========================================================================
   유틸
   ====================================================================== */

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function dateOf(art) {
  return new Date(art.taken_at || art.created_at);
}

function getMonthDays(artworks, year, month) {
  const lastDay = new Date(year, month, 0).getDate();
  return Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    const artworkIds = artworks
      .filter((art) => {
        const d = dateOf(art);
        return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === day;
      })
      .map((art) => art.id);
    return { day, artworkIds };
  });
}

function placeLabel(place) {
  if (!place) return '장소 미상';
  return place.neighborhood || place.name || '이름 없는 공간';
}

function profileLabel(profile) {
  return profile?.nickname || '익명';
}

const MENTION_REGEX = /@([^\s@,.!?:;]{2,30})/g;

function renderTextWithMentions(text, profiles, onOpenPerson) {
  if (!text) return null;
  const parts = [];
  let lastIndex = 0;
  let match;
  // 정규식 stateful — exec 사용
  const re = new RegExp(MENTION_REGEX);
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const nickname = match[1];
    const profile = profiles?.find((p) => p.nickname === nickname);
    if (profile && onOpenPerson) {
      parts.push(
        <button
          key={`m-${match.index}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenPerson(profile.id);
          }}
          className="font-semibold text-blue-500 hover:underline"
        >
          @{nickname}
        </button>
      );
    } else {
      parts.push(
        <span key={`m-${match.index}`} className="font-semibold text-[var(--text-muted)]">
          @{nickname}
        </span>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

/* ========================================================================
   Visual Primitives
   ====================================================================== */

function Shell({ children, screen, setScreen, showNav = true }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[var(--bg)]">
        <main className="min-h-[calc(100vh-70px)] px-4 pb-7 pt-4">{children}</main>
        {showNav && <BottomNav screen={screen} setScreen={setScreen} />}
      </div>
    </div>
  );
}

function BottomNav({ screen, setScreen }) {
  const { unreadCount } = useNotifications();
  const tabs = [
    { id: 'home', label: '홈', icon: 'eye' },
    { id: 'space', label: '지도', icon: 'map' },
    { id: 'record', label: '기록', icon: 'plus', primary: true },
    { id: 'archive', label: '필름', icon: 'archive' },
    { id: 'profile', label: '내 전시', icon: 'user', dot: unreadCount > 0 },
  ];
  return (
    <nav className="sticky bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/95 px-3 py-2 backdrop-blur">
      <div className="grid grid-cols-5 items-end gap-1">
        {tabs.map((tab) => {
          const active = screen === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => setScreen(tab.id)} className="flex flex-col items-center gap-1 text-[11px]">
              <span className={`relative flex items-center justify-center rounded-full ${tab.primary ? 'h-11 w-11 bg-[var(--ink)] text-white' : active ? 'h-8 w-8 bg-[var(--surface-2)] text-[var(--text)]' : 'h-8 w-8 text-[var(--text-muted)]'}`}>
                <Icon name={tab.icon} size={tab.primary ? 20 : 17} />
                {tab.dot && (
                  <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-red-500" />
                )}
              </span>
              <span className={active ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ToastStack() {
  const { toasts, dismissToast } = useNotifications();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-3">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
          className="pointer-events-auto w-full max-w-[400px] rounded-[18px] bg-[var(--ink)] px-4 py-3 text-left text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition"
        >
          <p className="text-[13px] font-bold tracking-[-0.04em]">{toast.title}</p>
          {toast.body && <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-white/80">{toast.body}</p>}
        </button>
      ))}
    </div>
  );
}

function Header({ title, subtitle, kicker = '시선집', onBack, right }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {onBack && <button type="button" onClick={onBack} className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]"><Icon name="back" size={18} /></button>}
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">{kicker}</p>
          <h1 className="text-[30px] font-extrabold leading-none tracking-[-0.08em]">{title}</h1>
          {subtitle && <p className="mt-3 max-w-[31ch] text-[14px] leading-6 text-[var(--text-muted)]">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}

function ImageBox({ src, alt, className = '', fit = 'cover', priority = false }) {
  return (
    <div className={`overflow-hidden bg-[var(--image-bg)] ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || ''}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
        />
      ) : null}
    </div>
  );
}

function SearchBar({ query, setQuery, onFocus }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <Icon name="search" size={17} className="text-[var(--text-muted)]" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={onFocus} placeholder="사진, 사람, 위치 검색" className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-faint)]" />
    </div>
  );
}

function HypeButton({ artwork, compact = false }) {
  const { userId, getHypeCount, isHypedByMe, refresh } = useData();
  const [busy, setBusy] = useState(false);
  const count = getHypeCount(artwork.id);
  const hyped = isHypedByMe(artwork.id);

  const handleClick = async (event) => {
    event.stopPropagation();
    if (!userId) return;
    setBusy(true);
    try {
      await toggleHype(artwork.id, userId, hyped);
      await refresh();
    } catch (error) {
      console.error('hype 실패', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || !userId}
      title="Hype"
      aria-label="Hype"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-semibold ${compact ? 'h-7 px-2 text-[11px]' : 'h-9 px-3 text-sm'} ${hyped ? 'border border-[var(--ink)] bg-[var(--ink)] text-white' : 'border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]'}`}
    >
      <span>🔥</span>
      <span>Hype</span>
      <span className={hyped ? 'text-white/70' : 'text-[var(--text-muted)]'}>{count}</span>
    </button>
  );
}

function ShareButton({ label = '', title = '시선집', text = '이 전시를 같이 볼래요?' }) {
  const handleShare = async () => {
    const url = window.location.href;
    const shareData = { title, text, url };
    try {
      if (navigator?.share) await navigator.share(shareData);
      else {
        await navigator?.clipboard?.writeText(`${title} · ${text} ${url}`);
        alert('링크를 복사했어요.');
      }
    } catch (error) {
      console.warn('공유를 취소했거나 실패했습니다.', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="공유"
      title="공유"
      className={`${label ? 'gap-1.5 px-3' : 'h-9 w-9'} inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)]/90 text-xs font-semibold text-[var(--text)] shadow-[0_4px_16px_rgba(20,20,20,0.06)] backdrop-blur`}
    >
      <Icon name="share" size={15} />
      {label && <span>{label}</span>}
    </button>
  );
}

function GpsStatusBadge({ status, source }) {
  const baseLabel = {
    idle: '사진 선택 전',
    reading: '위치 정보 확인 중',
    found: source === 'manual' ? '내 위치로 설정됨' : '사진의 위치 정보 발견',
    empty: '사진에 위치 정보 없음',
    error: '위치 정보 확인 실패',
  }[status] || '위치 정보 없음';
  const dark = status === 'found' || status === 'reading';
  return <span className={`rounded-full px-3 py-1 text-[11px] ${dark ? 'bg-[var(--ink)]/85 text-white' : 'bg-white/90 text-[var(--text)]'}`}>{baseLabel}</span>;
}

function ExhibitionSlot({ artwork, onOpen, large = false }) {
  return (
    <button
      type="button"
      onClick={() => artwork && onOpen(artwork.id)}
      className={`group relative overflow-hidden bg-[var(--surface-3)] text-left ${large ? 'rounded-[24px]' : 'rounded-[18px]'} ${!artwork ? 'border border-dashed border-[var(--border-dashed)]' : ''}`}
    >
      {artwork ? (
        <>
          <ImageBox src={artwork.imageUrl} alt={artwork.title} className="h-full w-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
            <p className="line-clamp-2 text-sm font-semibold leading-5 text-white">{artwork.title}</p>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] text-[var(--text-faint)]">빈 벽</div>
      )}
    </button>
  );
}

function FourPhotoWall({ photos, onOpen, mini = false, compact = false }) {
  const slots = [photos[0], photos[1], photos[2], photos[3]];
  return (
    <div className={`grid grid-cols-2 gap-1.5 overflow-hidden ${mini ? 'h-[150px]' : compact ? 'h-[204px]' : 'h-[254px]'}`}>
      <div className="grid min-h-0 grid-rows-2 gap-1.5">
        <ExhibitionSlot artwork={slots[0]} onOpen={onOpen} large />
        <ExhibitionSlot artwork={slots[1]} onOpen={onOpen} large />
      </div>
      <div className="grid min-h-0 grid-rows-2 gap-1.5">
        <ExhibitionSlot artwork={slots[2]} onOpen={onOpen} large />
        <ExhibitionSlot artwork={slots[3]} onOpen={onOpen} large />
      </div>
    </div>
  );
}

function EmptyState({ title, hint, onAction, actionLabel }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8 text-center">
      <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
      {hint && <p className="mt-2 whitespace-pre-line text-xs leading-5 text-[var(--text-muted)]">{hint}</p>}
      {onAction && (
        <button type="button" onClick={onAction} className="mt-4 rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white">
          {actionLabel || '시작하기'}
        </button>
      )}
    </div>
  );
}

/* ========================================================================
   Login
   ====================================================================== */

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null); // 'email' | 'google' | 'anon' | null

  const handleEmail = async (event) => {
    event.preventDefault();
    if (!email) return;
    setBusy('email');
    setError(null);
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (err) {
      setError(err.message || '로그인 실패');
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    setBusy('google');
    setError(null);
    try {
      await signInWithGoogle();
      // OAuth 리디렉션이 일어나므로 여기까지 도달하지 않음
    } catch (err) {
      setError(err.message || 'Google 로그인 실패. Supabase에서 Google provider가 활성화 됐는지 확인해주세요.');
      setBusy(null);
    }
  };

  const handleAnon = async () => {
    setBusy('anon');
    setError(null);
    try {
      await signInAnonymous();
    } catch (err) {
      setError(err.message || '익명 로그인 실패. Supabase Auth → Providers → Anonymous Sign-Ins이 켜져있는지 확인해주세요.');
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col justify-between p-5">
        <section className="relative min-h-[560px] flex-1 overflow-hidden rounded-[32px] bg-gradient-to-br from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,200,140,0.18),transparent_60%)]" />
          <div className="relative flex h-full min-h-[560px] flex-col justify-between p-6">
            <div className="flex items-center justify-between text-[12px] font-semibold tracking-[0.16em]">
              <span>시선집</span>
              <span>입장</span>
            </div>
            <div>
              <h1 className="text-[48px] font-extrabold leading-[0.92] tracking-[-0.1em]">
                보게 되는<br />것들
              </h1>
              <p className="mt-4 text-[15px] leading-7 text-white/80">하루의 사진이 전시가 되는 곳.</p>

              {sent ? (
                <div className="mt-8 rounded-[20px] bg-white/10 p-5 text-sm leading-6">
                  <p className="font-semibold">메일을 보냈어요.</p>
                  <p className="mt-2 text-white/70">
                    <span className="font-semibold text-white">{email}</span> 받은편지함의 매직 링크를 누르면 입장됩니다. (스팸함도 확인)
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSent(false); setEmail(''); }}
                    className="mt-3 text-xs text-white/60 underline"
                  >
                    다른 이메일로 다시
                  </button>
                </div>
              ) : (
                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={!!busy}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-sm font-semibold text-[var(--text)] disabled:opacity-50"
                  >
                    <GoogleLogo />
                    {busy === 'google' ? 'Google로 이동…' : 'Google로 계속하기'}
                  </button>

                  <button
                    type="button"
                    onClick={handleAnon}
                    disabled={!!busy}
                    className="w-full rounded-full border border-white/30 bg-white/5 px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {busy === 'anon' ? '입장 중…' : '먼저 둘러보기 (익명)'}
                  </button>

                  {!showEmail ? (
                    <button
                      type="button"
                      onClick={() => setShowEmail(true)}
                      className="w-full text-center text-xs text-white/60 underline"
                    >
                      이메일 매직 링크로 로그인
                    </button>
                  ) : (
                    <form onSubmit={handleEmail} className="space-y-2 rounded-[20px] bg-white/5 p-3">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="이메일"
                        className="w-full rounded-full border border-white/30 bg-transparent px-5 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/60"
                      />
                      <button
                        type="submit"
                        disabled={!!busy}
                        className="w-full rounded-full bg-white/15 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {busy === 'email' ? '메일 보내는 중…' : '매직 링크 받기'}
                      </button>
                    </form>
                  )}

                  {error && <p className="text-xs text-red-300">{error}</p>}
                  <p className="text-[10px] leading-4 text-white/50">
                    "익명"으로 시작하면 이메일 없이 바로 둘러볼 수 있어요. 단, 브라우저 데이터를 지우거나 다른 기기로 옮기면 계정이 사라집니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.2 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.8-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C40.6 35.6 44 30.2 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

/* ========================================================================
   Home
   ====================================================================== */

function HomeScreen({ setScreen, openArtwork, openPlace, openPerson, openKeyword }) {
  const {
    userId,
    artworks,
    places,
    getPlaceArtworks,
    getProfile,
    getUserArtworks,
    getHypeCount,
    getFollowing,
    getRecommendedArtworks,
    getRecommendedCreators,
  } = useData();
  const { unreadCount } = useNotifications();
  const [feedFilter, setFeedFilter] = useState('전체');

  const followingIds = useMemo(
    () => new Set(getFollowing(userId).map((f) => f.followee_id)),
    [getFollowing, userId]
  );
  const hasFollowing = followingIds.size > 0;

  const visibleArtworks = useMemo(
    () => (feedFilter === '팔로잉' ? artworks.filter((a) => followingIds.has(a.user_id)) : artworks),
    [artworks, feedFilter, followingIds]
  );

  // 추천 알고리즘 (최신성 + 인기 + 팔로잉 + 키워드 친화도)
  const recommended = useMemo(
    () => getRecommendedArtworks(12),
    [getRecommendedArtworks]
  );
  const featuredPool = feedFilter === '팔로잉'
    ? recommended.filter((a) => followingIds.has(a.user_id))
    : recommended;
  const featured = featuredPool[0] || null;

  const topCreators = useMemo(() => getRecommendedCreators(6), [getRecommendedCreators]);

  // 인기 키워드 top 5
  const trendingKeywords = useMemo(() => {
    const counts = new Map();
    for (const art of visibleArtworks) {
      if (!art.daily_vision) continue;
      counts.set(art.daily_vision, (counts.get(art.daily_vision) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([word, count]) => ({ word, count }));
  }, [visibleArtworks]);

  const placesWithArt = useMemo(
    () =>
      places
        .map((place) => ({
          place,
          photos: getPlaceArtworks(place.id)
            .filter((a) => visibleArtworks.some((va) => va.id === a.id))
            .slice(0, 4),
        }))
        .filter((entry) => entry.photos.length > 0),
    [places, getPlaceArtworks, visibleArtworks]
  );

  // 새로 올라온 사진
  const latest = visibleArtworks
    .filter((a) => a.location_mode !== '숨김')
    .slice(0, 8);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.18em] text-[var(--text-muted)]">시선집 · {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</p>
          <h1 className="mt-0.5 text-[27px] font-extrabold tracking-[-0.08em]">오늘의 시선들</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScreen('notifications')}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]"
            aria-label="알림"
          >
            <Icon name="bell" size={17} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-red-500" />
            )}
          </button>
          <button type="button" onClick={() => setScreen('search')} className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]" aria-label="탐색">
            <Icon name="search" size={17} />
          </button>
        </div>
      </div>

      {hasFollowing && (
        <div className="mb-4 flex gap-2">
          {['전체', '팔로잉'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFeedFilter(item)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                feedFilter === item
                  ? 'bg-[var(--ink)] text-white'
                  : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {artworks.length === 0 ? (
        <EmptyState
          title="아직 시선집이 비어있어요"
          hint={'사용법은 간단해요:\n1. 아래 + 버튼으로 사진 올리기\n2. 사진의 EXIF GPS 또는 "내 위치"로 자동 동네 매칭\n3. 같은 동네의 사진은 자동으로 한 전시에 묶여요\n\n둘러보고 싶으면 [내 전시] 탭에서 샘플 사진 5장 추가도 가능합니다.'}
          onAction={() => setScreen('record')}
          actionLabel="첫 사진 올리기"
        />
      ) : visibleArtworks.length === 0 ? (
        <EmptyState
          title="팔로잉 한 사람이 아직 사진을 안 올렸어요"
          hint="'전체' 탭으로 다른 사람들의 사진을 둘러보세요."
        />
      ) : (
        <div className="space-y-6">
          {featured && (
            <section>
              <button
                type="button"
                onClick={() => openArtwork(featured.id)}
                className="block w-full overflow-hidden rounded-[28px] bg-[var(--ink)] text-left shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
              >
                <div className="relative">
                  <ImageBox src={featured.imageUrl} alt={featured.title} className="h-[360px]" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 text-white">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-white/70">오늘의 한 컷</p>
                    <h2 className="mt-1 text-[26px] font-extrabold leading-tight tracking-[-0.07em]">
                      {featured.title || '제목 없는 사진'}
                    </h2>
                    <p className="mt-1 text-[13px] text-white/80">
                      {profileLabel(getProfile(featured.user_id))} ·{' '}
                      🔥 {getHypeCount(featured.id)}
                    </p>
                  </div>
                </div>
              </button>
            </section>
          )}

          {trendingKeywords.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">사람들의 시선</p>
                  <h2 className="mt-0.5 text-[20px] font-extrabold tracking-[-0.07em]">키워드 따라가기</h2>
                </div>
              </div>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                {trendingKeywords.map(({ word, count }) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => openKeyword(word)}
                    className="shrink-0 rounded-[16px] bg-[var(--surface)] px-4 py-3 text-left shadow-[0_0_0_1px_var(--border)]"
                  >
                    <p className="text-[15px] font-bold tracking-[-0.04em]">#{word}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{count}장</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {placesWithArt.length > 0 && (
            <section className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">동네별 전시</p>
                <h2 className="mt-0.5 text-[22px] font-extrabold tracking-[-0.075em]">근방 네컷</h2>
              </div>
              {placesWithArt.map(({ place, photos }) => (
                <article key={place.id} className="rounded-[28px] bg-[var(--surface)] p-3 shadow-[0_0_0_1px_var(--border)]">
                  <button
                    type="button"
                    onClick={() => openPlace(place.id)}
                    className="mb-3 flex w-full items-end justify-between gap-3 px-1 text-left"
                  >
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">
                        {placeLabel(place)}
                      </p>
                      <h3 className="mt-0.5 text-[20px] font-extrabold tracking-[-0.075em]">
                        {place.name || '이름 없는 공간'}
                      </h3>
                    </div>
                    <span className="rounded-full border border-[var(--border-strong)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
                      {photos.length}컷
                    </span>
                  </button>
                  <FourPhotoWall photos={photos} onOpen={openArtwork} />
                </article>
              ))}
            </section>
          )}

          {topCreators.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">사람들</p>
                  <h2 className="mt-0.5 text-[22px] font-extrabold tracking-[-0.075em]">눈에 띄는 작가</h2>
                </div>
              </div>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                {topCreators.map(({ profile, totalHype }) => {
                  const main =
                    getUserArtworks(profile.id).find((a) => a.is_twenty_five) ||
                    getUserArtworks(profile.id)[0];
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => openPerson(profile.id)}
                      className="min-w-[150px] overflow-hidden rounded-[20px] bg-[var(--surface)] text-left shadow-[0_0_0_1px_var(--border)]"
                    >
                      <ImageBox src={main?.imageUrl} alt={profile.nickname} className="h-[170px] w-full" />
                      <div className="p-3">
                        <p className="truncate text-sm font-bold tracking-[-0.04em]">
                          {profile.nickname}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">🔥 {totalHype}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {latest.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">최근</p>
                  <h2 className="mt-0.5 text-[22px] font-extrabold tracking-[-0.075em]">새로 올라온 사진</h2>
                </div>
              </div>
              <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
                {latest.map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => openArtwork(art.id)}
                    className="min-w-[140px] overflow-hidden rounded-[18px] bg-[var(--surface)] text-left shadow-[0_0_0_1px_var(--border)]"
                  >
                    <ImageBox src={art.imageUrl} alt={art.title} className="h-[180px]" />
                    <div className="p-2">
                      <p className="truncate text-[12px] font-bold tracking-[-0.04em]">
                        {art.title || '제목 없음'}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-[var(--text-faint)]">
                        {profileLabel(getProfile(art.user_id))}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

/* ========================================================================
   Search
   ====================================================================== */

function SearchScreen({ openArtwork, openPerson, openPlace }) {
  const { artworks, profiles, places, getProfile, getPlace, getHypeCount, getUserArtworks } = useData();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('사진');
  const [sort, setSort] = useState('최신');
  const [keywordFilter, setKeywordFilter] = useState(null);
  const q = query.trim().toLowerCase();

  const matches = (text) => text?.toLowerCase().includes(q);

  const allKeywords = useMemo(() => {
    const counts = new Map();
    for (const art of artworks) {
      if (!art.daily_vision) continue;
      counts.set(art.daily_vision, (counts.get(art.daily_vision) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([word]) => word);
  }, [artworks]);

  const filteredArts = useMemo(() => {
    let arr = artworks.filter((art) =>
      !q ||
      [art.title, art.note, art.daily_vision, getProfile(art.user_id)?.nickname, placeLabel(getPlace(art.place_id))]
        .filter(Boolean)
        .some(matches)
    );
    if (keywordFilter) arr = arr.filter((art) => art.daily_vision === keywordFilter);
    if (sort === '인기') {
      arr = [...arr].sort((a, b) => getHypeCount(b.id) - getHypeCount(a.id));
    } else {
      arr = [...arr].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return arr;
  }, [artworks, q, keywordFilter, sort, getProfile, getPlace, getHypeCount]);

  const filteredUsers = useMemo(() => {
    const arr = profiles.filter((p) =>
      !q ||
      [p.nickname, p.exhibition_title, p.bio, ...(p.words || [])]
        .filter(Boolean)
        .some(matches)
    );
    if (sort === '인기') {
      return [...arr].sort((a, b) => {
        const aHype = getUserArtworks(a.id).reduce((sum, art) => sum + getHypeCount(art.id), 0);
        const bHype = getUserArtworks(b.id).reduce((sum, art) => sum + getHypeCount(art.id), 0);
        return bHype - aHype;
      });
    }
    return [...arr].sort((a, b) => getUserArtworks(b.id).length - getUserArtworks(a.id).length);
  }, [profiles, q, sort, getUserArtworks, getHypeCount]);

  const filteredPlaces = places.filter((p) =>
    !q ||
    [p.name, p.neighborhood, ...(p.words || [])]
      .filter(Boolean)
      .some(matches)
  );

  return (
    <>
      <Header title="탐색" subtitle="사진·사람·위치를 따라갑니다." kicker="찾아보기" />
      <div className="space-y-4">
        <SearchBar query={query} setQuery={setQuery} />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {['사진', '사람', '위치'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-full px-4 py-2 text-sm ${tab === item ? 'bg-[var(--ink)] text-white' : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`}
            >
              {item}
            </button>
          ))}
        </div>

        {tab !== '위치' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--text-faint)]">정렬</span>
            {['최신', '인기'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSort(item)}
                className={`rounded-full px-3 py-1 ${sort === item ? 'bg-[var(--surface-2)] font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'}`}
              >
                {item === '인기' ? '🔥 인기' : item}
              </button>
            ))}
          </div>
        )}

        {tab === '사진' && allKeywords.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setKeywordFilter(null)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${!keywordFilter ? 'bg-[var(--ink)] text-white' : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`}
            >
              전체
            </button>
            {allKeywords.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => setKeywordFilter(word === keywordFilter ? null : word)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${keywordFilter === word ? 'bg-[var(--ink)] text-white' : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]'}`}
              >
                #{word}
              </button>
            ))}
          </div>
        )}

        {tab === '사진' && (
          filteredArts.length === 0
            ? <EmptyState title="검색 결과 없음" hint="다른 키워드를 시도해보세요." />
            : <div className="grid grid-cols-2 gap-3">{filteredArts.map((art) => <PhotoTile key={art.id} artwork={art} onOpen={openArtwork} />)}</div>
        )}
        {tab === '사람' && (
          filteredUsers.length === 0
            ? <EmptyState title="아직 사람이 없어요" />
            : <div className="space-y-3">{filteredUsers.map((p) => <PersonRow key={p.id} profile={p} onOpen={openPerson} />)}</div>
        )}
        {tab === '위치' && (
          filteredPlaces.length === 0
            ? <EmptyState title="아직 위치가 없어요" hint="위치 정보가 있는 사진을 올리면 동네가 자동으로 생겨요." />
            : <div className="space-y-3">{filteredPlaces.map((p) => <PlaceRow key={p.id} place={p} onOpen={openPlace} />)}</div>
        )}
      </div>
    </>
  );
}

function PhotoTile({ artwork, onOpen }) {
  const { getHypeCount } = useData();
  const hypes = getHypeCount(artwork.id);
  return (
    <button type="button" onClick={() => onOpen(artwork.id)} className="overflow-hidden rounded-[20px] bg-[var(--surface)] text-left shadow-[0_0_0_1px_var(--border)]">
      <div className="relative">
        <ImageBox src={artwork.imageUrl} alt={artwork.title} className="h-44" />
        {hypes > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">🔥 {hypes}</span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold tracking-[-0.04em]">{artwork.title || '제목 없음'}</p>
        {artwork.daily_vision && <p className="mt-1 text-[11px] text-[var(--text-faint)]">#{artwork.daily_vision}</p>}
      </div>
    </button>
  );
}

function PersonRow({ profile, onOpen }) {
  const { getUserArtworks } = useData();
  const works = getUserArtworks(profile.id);
  const main = works.find((art) => art.is_twenty_five) || works[0];
  return (
    <button type="button" onClick={() => onOpen(profile.id)} className="flex w-full gap-3 rounded-[22px] bg-[var(--surface)] p-3 text-left shadow-[0_0_0_1px_var(--border)]">
      <ImageBox src={main?.imageUrl} alt={profile.nickname} className="h-20 w-20 shrink-0 rounded-[16px]" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">{profile.nickname}</p>
        <h3 className="mt-1 text-lg font-bold tracking-[-0.05em]">{profile.exhibition_title || '제목 미정'}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--text-muted)]">{profile.bio || ''}</p>
      </div>
    </button>
  );
}

function PlaceRow({ place, onOpen }) {
  const { getPlaceArtworks } = useData();
  const photo = getPlaceArtworks(place.id)[0];
  return (
    <button type="button" onClick={() => onOpen(place.id)} className="flex w-full gap-3 rounded-[22px] bg-[var(--surface)] p-3 text-left shadow-[0_0_0_1px_var(--border)]">
      <ImageBox src={photo?.imageUrl} alt={place.name} className="h-20 w-20 shrink-0 rounded-[16px]" />
      <div>
        <p className="text-lg font-bold tracking-[-0.05em]">{place.name || '이름 없는 공간'}</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{place.neighborhood || '미상'}</p>
      </div>
    </button>
  );
}

/* ========================================================================
   Record (사진 업로드 + GPS + 저장)
   ====================================================================== */

const LOCATION_MODES = ['정확한 위치', '동네', '개인전만', '숨김'];

async function processPickedFile(file) {
  const previewUrl = URL.createObjectURL(file);
  const meta = await readPhotoMeta(file);
  let neighborhood = null;
  if (meta.lat != null && meta.lng != null) {
    const geo = await reverseGeocode(meta.lat, meta.lng).catch(() => null);
    neighborhood = geo?.neighborhood ?? null;
  }
  const localId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `f-${Date.now()}-${Math.random()}`;
  return {
    localId,
    file,
    previewUrl,
    gpsStatus: meta.status,
    gpsSource: meta.lat != null ? 'exif' : null,
    gps: { lat: meta.lat, lng: meta.lng },
    takenAt: meta.takenAt,
    neighborhood,
    title: '',
  };
}

function RecordScreen({ setScreen }) {
  const { userId, places, refresh } = useData();
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState('동네');
  const [dailyVision, setDailyVision] = useState('');
  const [sharedNote, setSharedNote] = useState('');
  const [setAsCurate, setSetAsCurate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [locatingId, setLocatingId] = useState(null);

  useEffect(() => {
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remaining = Math.max(0, 4 - items.length);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, remaining || 4);
    event.target.value = '';
    if (files.length === 0) return;
    const processed = await Promise.all(files.map(processPickedFile));
    setItems((prev) => [...prev, ...processed].slice(0, 4));
  };

  const removeItem = (localId) => {
    setItems((prev) => {
      const item = prev.find((i) => i.localId === localId);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.localId !== localId);
    });
  };

  const updateItem = (localId, patch) => {
    setItems((prev) => prev.map((i) => (i.localId === localId ? { ...i, ...patch } : i)));
  };

  const useMyLocationFor = async (localId) => {
    setLocatingId(localId);
    try {
      const pos = await getCurrentPosition();
      const geo = await reverseGeocode(pos.lat, pos.lng).catch(() => null);
      updateItem(localId, {
        gps: { lat: pos.lat, lng: pos.lng },
        gpsStatus: 'found',
        gpsSource: 'manual',
        neighborhood: geo?.neighborhood ?? null,
      });
    } catch (err) {
      alert('위치 권한이 필요해요: ' + (err.message || ''));
    } finally {
      setLocatingId(null);
    }
  };

  const useMyLocationForAll = async () => {
    const without = items.filter((it) => it.gps.lat == null);
    if (without.length === 0) return;
    if (!window.confirm(`위치 없는 사진 ${without.length}장에 현재 내 위치를 적용할까요?`)) return;
    try {
      const pos = await getCurrentPosition();
      const geo = await reverseGeocode(pos.lat, pos.lng).catch(() => null);
      setItems((prev) =>
        prev.map((it) =>
          it.gps.lat == null
            ? {
                ...it,
                gps: { lat: pos.lat, lng: pos.lng },
                gpsStatus: 'found',
                gpsSource: 'manual',
                neighborhood: geo?.neighborhood ?? null,
              }
            : it
        )
      );
    } catch (err) {
      alert('위치 권한이 필요해요: ' + (err.message || ''));
    }
  };

  const handleSaveAll = async () => {
    if (items.length === 0 || !userId) return;
    setBusy(true);
    setError(null);
    setProgress({ done: 0, total: items.length });
    try {
      const createdIds = [];
      let placesCache = [...places];
      for (const item of items) {
        const storagePath = await uploadPhoto(userId, item.file);
        const shareLocation = mode === '정확한 위치' || mode === '동네';
        let placeId = null;
        if (shareLocation && item.gps.lat != null) {
          const place = await upsertPlace({
            lat: item.gps.lat,
            lng: item.gps.lng,
            neighborhood: item.neighborhood,
            name: item.neighborhood,
            places: placesCache,
          });
          if (place) {
            placeId = place.id;
            // 같은 좌표 재발견 방지를 위해 캐시에 추가
            if (!placesCache.find((p) => p.id === place.id)) placesCache.push(place);
          }
        }
        const storeExact = mode === '정확한 위치';
        const created = await insertArtwork({
          userId,
          storagePath,
          title: item.title || null,
          note: sharedNote || null,
          dailyVision,
          locationMode: mode,
          takenAt: item.takenAt,
          lat: storeExact ? item.gps.lat : null,
          lng: storeExact ? item.gps.lng : null,
          placeId,
        });
        createdIds.push(created.id);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }

      if (setAsCurate && createdIds.length > 0) {
        await setCurateOrder(userId, createdIds.slice(0, 4));
      }

      await refresh();
      setScreen('archive');
    } catch (err) {
      console.error(err);
      setError(err.message || '저장 실패');
    } finally {
      setBusy(false);
    }
  };

  const someWithoutGps = items.some((it) => it.gps.lat == null);

  return (
    <>
      <Header
        title="기록"
        subtitle="한 번에 최대 4장까지 올릴 수 있어요."
        kicker="새 장면"
      />
      <div className="space-y-4">
        {items.length === 0 ? (
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            <div className="flex h-[430px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]">
              <Icon name="camera" size={34} />
              <span className="mt-3 text-sm">사진 고르기 (최대 4장)</span>
              <span className="mt-2 text-xs text-[var(--text-faint)]">사진 안의 위치 정보도 함께 확인합니다.</span>
            </div>
          </label>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {items.map((item) => (
                <RecordItemCard
                  key={item.localId}
                  item={item}
                  onRemove={() => removeItem(item.localId)}
                  onTitleChange={(title) => updateItem(item.localId, { title })}
                  onUseMyLocation={() => useMyLocationFor(item.localId)}
                  locating={locatingId === item.localId}
                />
              ))}
              {remaining > 0 && (
                <label className="flex aspect-square cursor-pointer items-center justify-center rounded-[18px] border border-dashed border-[var(--border-dashed)] bg-[var(--surface)] text-[var(--text-muted)]">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
                  <div className="text-center">
                    <Icon name="plus" size={20} />
                    <p className="mt-1 text-[11px]">더 추가</p>
                  </div>
                </label>
              )}
            </div>

            {someWithoutGps && (
              <button
                type="button"
                onClick={useMyLocationForAll}
                className="w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)]"
              >
                📍 위치 없는 사진에 내 위치 일괄 적용
              </button>
            )}

            <section className="space-y-4 rounded-[24px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
              <textarea
                value={sharedNote}
                onChange={(event) => setSharedNote(event.target.value)}
                className="min-h-16 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-[var(--placeholder)]"
                placeholder="공통 노트 (선택) — 모든 사진에 같이 남겨집니다"
              />
              <input
                value={dailyVision}
                onChange={(event) => setDailyVision(event.target.value)}
                className="w-full rounded-full border border-[var(--border)] bg-transparent px-4 py-2 text-xs outline-none placeholder:text-[var(--placeholder)]"
                placeholder="오늘의 시선 (예: 빛, 벽, 흔들림) — 공통"
              />

              <div>
                <p className="mb-3 text-[12px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">공개 방식 (모두 공통)</p>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_MODES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setMode(item)}
                      className={`rounded-full px-3 py-2 text-xs ${mode === item ? 'bg-[var(--ink)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)]'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                  {mode === '정확한 위치' && '지도에 정확한 좌표로 표시됩니다.'}
                  {mode === '동네' && '동네 이름만 노출되고 좌표는 저장되지 않아요.'}
                  {mode === '개인전만' && '내 개인전에만 걸려요. 공간 전시에는 안 들어가요.'}
                  {mode === '숨김' && '나만 볼 수 있어요. 다른 사람에겐 보이지 않아요.'}
                </p>
              </div>

              {items.length >= 1 && (
                <label className="flex cursor-pointer items-center justify-between rounded-[16px] border border-[var(--border)] px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold">오늘의 4컷으로 큐레이팅</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                      이번에 올린 사진들이 내 개인전 메인 4컷으로 자동 설정됨
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={setAsCurate}
                    onChange={(event) => setSetAsCurate(event.target.checked)}
                    className="h-5 w-5 accent-[var(--ink)]"
                  />
                </label>
              )}

              {error && <p className="rounded-[12px] bg-red-50 p-3 text-xs text-red-700">{error}</p>}

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={busy}
                className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy
                  ? `올리는 중… (${progress.done}/${progress.total})`
                  : `${items.length}장 필름에 넣기`}
              </button>
            </section>
          </>
        )}
      </div>
    </>
  );
}

function RecordItemCard({ item, onRemove, onTitleChange, onUseMyLocation, locating }) {
  const showLocationFallback = item.gpsStatus === 'empty' || item.gpsStatus === 'error';
  return (
    <div className="overflow-hidden rounded-[18px] bg-[var(--surface)] shadow-[0_0_0_1px_var(--border)]">
      <div className="relative">
        <ImageBox src={item.previewUrl} alt={item.title || ''} className="aspect-square w-full" priority />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
          aria-label="제거"
        >
          <Icon name="x" size={13} />
        </button>
        <div className="absolute left-1.5 bottom-1.5 flex flex-wrap gap-1">
          <GpsStatusBadge status={item.gpsStatus} source={item.gpsSource} />
          {item.neighborhood && (
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] text-[var(--text)]">
              {item.neighborhood}
            </span>
          )}
        </div>
      </div>
      <div className="p-2">
        <input
          value={item.title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="제목 (선택)"
          className="w-full bg-transparent text-xs font-semibold outline-none placeholder:text-[var(--placeholder)]"
        />
        {showLocationFallback && (
          <button
            type="button"
            onClick={onUseMyLocation}
            disabled={locating}
            className="mt-1 w-full rounded-full bg-[var(--ink)] px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
          >
            {locating ? '확인 중…' : '📍 내 위치'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ========================================================================
   Artwork detail + comments
   ====================================================================== */

function ArtworkDetail({ artworkId, setScreen, openArtwork, openPlace, openPerson, openKeyword }) {
  const { userId, getArtwork, getProfile, getPlace, getUserArtworks, refresh } = useData();
  const art = getArtwork(artworkId);
  const [deleting, setDeleting] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [busyHero, setBusyHero] = useState(false);

  if (!art) return <EmptyState title="사진을 찾을 수 없어요" onAction={() => setScreen('home')} actionLabel="홈으로" />;

  const profile = getProfile(art.user_id);
  const place = getPlace(art.place_id);
  const userPhotos = getUserArtworks(art.user_id);
  const related = userPhotos.filter((item) => item.id !== art.id).slice(0, 3);
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

  const zoomIndex = Math.max(0, userPhotos.findIndex((a) => a.id === art.id));

  return (
    <>
      <button type="button" onClick={() => setScreen('home')} className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]">
        <Icon name="back" size={18} />
      </button>
      <div className="space-y-4">
        <section className="relative overflow-hidden rounded-[28px] bg-[var(--ink)] shadow-[0_0_0_1px_var(--ink)]">
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="relative flex min-h-[620px] w-full items-center justify-center bg-[var(--ink)]"
            aria-label="사진 확대해서 보기"
          >
            <ImageBox src={art.imageUrl} alt={art.title} fit="contain" className="h-[620px] w-full bg-[var(--ink)]" priority />
            {art.is_twenty_five && (
              <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--text)]">
                가장 아름다운 사진
              </span>
            )}
            {isHero && (
              <span className="absolute left-3 top-12 rounded-full bg-yellow-300 px-3 py-1 text-xs font-semibold text-[var(--text)]">
                ⭐ 대표 이미지
              </span>
            )}
          </button>
          <div className="absolute right-3 top-3"><ShareButton title={art.title || '시선집'} /></div>
        </section>

        <CommentSection artworkId={art.id} openPerson={openPerson} />

        <section className="rounded-[24px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[29px] font-extrabold leading-tight tracking-[-0.08em]">{art.title || '제목 없음'}</h1>
              <button
                type="button"
                onClick={() => place && openPlace(place.id)}
                className="mt-3 text-left text-sm text-[var(--text-muted)]"
              >
                {profileLabel(profile)} ·{' '}
                {art.location_mode === '개인전만' || art.location_mode === '숨김'
                  ? '장소 비공개'
                  : place
                  ? placeLabel(place)
                  : '장소 미상'}{' '}
                · {formatTime(art.taken_at) || formatTime(art.created_at)}
              </button>
            </div>
          </div>
          {art.note && <p className="mt-4 text-[15px] leading-7 text-[var(--text-quote)]">{art.note}</p>}
          {art.daily_vision && (
            <button
              type="button"
              onClick={() => openKeyword?.(art.daily_vision)}
              className="mt-3 inline-block rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text)]"
            >
              #{art.daily_vision}
            </button>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <HypeButton artwork={art} />
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

        {related.length > 0 && (
          <section>
            <h2 className="mb-3 text-[22px] font-extrabold tracking-[-0.07em]">같은 사람의 사진</h2>
            <div className="grid grid-cols-3 gap-2">
              {related.map((item) => (
                <button key={item.id} type="button" onClick={() => openArtwork(item.id)}>
                  <ImageBox src={item.imageUrl} alt={item.title} className="aspect-square rounded-[16px]" />
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
          onClose={() => setZoomOpen(false)}
        />
      )}
    </>
  );
}

function CommentSection({ artworkId, openPerson }) {
  const {
    userId,
    getProfile,
    getRootCommentsFor,
    refresh,
  } = useData();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const rootComments = getRootCommentsFor(artworkId).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim() || !userId) return;
    setBusy(true);
    try {
      await postComment(artworkId, userId, text.trim(), replyingTo);
      setText('');
      setReplyingTo(null);
      await refresh();
    } catch (error) {
      alert('댓글 실패: ' + error.message);
    } finally {
      setBusy(false);
    }
  };

  const replyTarget = replyingTo
    ? rootComments.find((c) => c.id === replyingTo) ||
      rootComments.flatMap((r) => [r]).find((c) => c.id === replyingTo)
    : null;

  return (
    <section className="rounded-[24px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
      <div className="mb-4">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">감상 노트</p>
        <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.06em]">이 사진 앞에서</h2>
      </div>

      {replyingTo && replyTarget && (
        <div className="mb-2 flex items-center justify-between rounded-[14px] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-body)]">
          <span>↳ {profileLabel(getProfile(replyTarget.user_id))}에게 답글</span>
          <button type="button" onClick={() => setReplyingTo(null)} className="text-[var(--text-muted)]">취소</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={replyingTo ? '답글… (@닉네임으로 멘션 가능)' : '짧게 남기기 (@닉네임 멘션 가능)'}
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text)] outline-none"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          {replyingTo ? '답글' : '남기기'}
        </button>
      </form>

      <div className="space-y-4">
        {rootComments.length === 0 && (
          <p className="text-xs text-[var(--text-faint)]">아직 노트가 없어요. 첫 감상을 남겨보세요.</p>
        )}
        {rootComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={() => { setReplyingTo(comment.id); }}
            openPerson={openPerson}
          />
        ))}
      </div>
    </section>
  );
}

function CommentItem({ comment, onReply, isReply = false, openPerson }) {
  const {
    userId,
    profiles,
    getProfile,
    getRepliesFor,
    getCommentReactionCount,
    isCommentLikedByMe,
    refresh,
  } = useData();
  const author = getProfile(comment.user_id);
  const isMine = comment.user_id === userId;
  const liked = isCommentLikedByMe(comment.id);
  const likeCount = getCommentReactionCount(comment.id);
  const replies = getRepliesFor(comment.id);
  const [showReplies, setShowReplies] = useState(replies.length > 0 && replies.length <= 3);
  const [busy, setBusy] = useState(false);

  const handleLike = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      await toggleCommentReaction(comment.id, userId, liked);
      await refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('댓글을 삭제할까요?')) return;
    try {
      await deleteComment(comment.id, userId);
      await refresh();
    } catch (err) {
      alert('삭제 실패: ' + err.message);
    }
  };

  return (
    <article className={`${isReply ? 'ml-5 border-l border-[var(--border)] pl-3' : 'border-l border-[var(--ink)] pl-4'}`}>
      <p className="text-[15px] leading-7 text-[var(--text-quote)]">
        "{renderTextWithMentions(comment.text, profiles, openPerson)}"
      </p>
      <p className="mt-1 text-[11px] tracking-[0.12em] text-[var(--text-meta)]">
        <button
          type="button"
          onClick={() => openPerson?.(author?.id)}
          className="hover:underline"
        >
          {profileLabel(author)}
        </button>
        {' · '}{timeAgo(comment.created_at)}
      </p>
      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
        <button
          type="button"
          onClick={handleLike}
          disabled={busy || !userId}
          className={`inline-flex items-center gap-1 ${liked ? 'text-red-500' : 'text-[var(--text-muted)]'}`}
        >
          <Icon name={liked ? 'heartFilled' : 'heart'} size={13} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        {!isReply && (
          <button type="button" onClick={onReply} className="inline-flex items-center gap-1">
            <Icon name="reply" size={13} />
            답글
          </button>
        )}
        {isMine && (
          <button type="button" onClick={handleDelete} className="text-red-500">삭제</button>
        )}
      </div>

      {!isReply && replies.length > 0 && (
        <div className="mt-2">
          {!showReplies ? (
            <button
              type="button"
              onClick={() => setShowReplies(true)}
              className="text-[11px] text-[var(--text-muted)] underline"
            >
              답글 {replies.length}개 보기
            </button>
          ) : (
            <div className="mt-2 space-y-3">
              {replies.map((r) => (
                <CommentItem key={r.id} comment={r} isReply onReply={() => {}} openPerson={openPerson} />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ========================================================================
   Bulk privacy (내 사진 일괄 공개 변경)
   ====================================================================== */

function BulkPrivacyScreen({ setScreen }) {
  const { userId, getUserArtworks, refresh } = useData();
  const works = getUserArtworks(userId);
  const [selected, setSelected] = useState(() => new Set());
  const [targetMode, setTargetMode] = useState('동네');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(works.map((w) => w.id)));
  };
  const clearAll = () => setSelected(new Set());

  const groupCounts = works.reduce(
    (acc, w) => {
      acc[w.location_mode] = (acc[w.location_mode] ?? 0) + 1;
      return acc;
    },
    { 정확한_위치: 0, 동네: 0, 개인전만: 0, 숨김: 0 }
  );

  const handleApply = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`${selected.size}장의 공개 방식을 "${targetMode}"으로 바꿀까요?`)) return;
    setBusy(true);
    try {
      await bulkUpdateArtworkLocationMode(Array.from(selected), userId, targetMode);
      await refresh();
      setSelected(new Set());
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch (err) {
      alert('변경 실패: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header
        title="공개 일괄 변경"
        subtitle="여러 장의 공개 방식을 한 번에 바꿉니다."
        kicker="설정"
        onBack={() => setScreen('profile')}
      />

      {works.length === 0 ? (
        <EmptyState title="아직 사진이 없어요" />
      ) : (
        <div className="space-y-4 pb-32">
          <section className="rounded-[20px] bg-[var(--surface)] p-3 shadow-[0_0_0_1px_var(--border)]">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {LOCATION_MODES.map((m) => (
                <div key={m}>
                  <p className="text-[16px] font-extrabold tracking-[-0.04em]">
                    {m === '정확한 위치' ? works.filter((w) => w.location_mode === '정확한 위치').length : groupCounts[m] ?? 0}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold tracking-[0.08em] text-[var(--text-muted)]">{m}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">
              총 {works.length}장 · 선택 {selected.size}장
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={selectAll} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">
                전체 선택
              </button>
              <button type="button" onClick={clearAll} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">
                해제
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {works.map((art) => {
              const checked = selected.has(art.id);
              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => toggle(art.id)}
                  className={`relative aspect-square overflow-hidden rounded-[14px] ${checked ? 'ring-4 ring-[var(--ink)]' : ''}`}
                >
                  <ImageBox src={art.imageUrl} alt={art.title} className="h-full w-full" />
                  <span
                    className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      checked ? 'border-[var(--ink)] bg-[var(--ink)] text-white' : 'border-white bg-black/30 text-transparent'
                    }`}
                  >
                    <Icon name="check" size={12} />
                  </span>
                  <span className="absolute bottom-1 left-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    {art.location_mode}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-[var(--surface)]/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-[400px] space-y-3">
            <div className="flex flex-wrap gap-2">
              {LOCATION_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTargetMode(m)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    targetMode === m ? 'bg-[var(--ink)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleApply}
              disabled={busy}
              className="w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? '변경 중…' : done ? '완료!' : `${selected.size}장 → "${targetMode}"으로 바꾸기`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ========================================================================
   Notifications history
   ====================================================================== */

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

function NotificationsScreen({ setScreen, openArtwork, openPerson }) {
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

/* ========================================================================
   Keyword aggregate page
   ====================================================================== */

function KeywordScreen({ keyword, setScreen, openArtwork }) {
  const { artworks, getHypeCount } = useData();
  const [sort, setSort] = useState('인기');

  const filtered = useMemo(() => {
    const arr = artworks.filter((a) => a.daily_vision === keyword);
    if (sort === '인기') {
      return [...arr].sort((a, b) => getHypeCount(b.id) - getHypeCount(a.id));
    }
    return [...arr].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [artworks, keyword, sort, getHypeCount]);

  return (
    <>
      <Header
        title={`#${keyword}`}
        subtitle="같은 시선을 모아봅니다."
        kicker="키워드"
        onBack={() => setScreen('home')}
      />
      <div className="mb-4 flex items-center gap-2 text-xs">
        <span className="text-[var(--text-faint)]">{filtered.length}장 · 정렬</span>
        {['인기', '최신'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSort(item)}
            className={`rounded-full px-3 py-1 ${
              sort === item ? 'bg-[var(--surface-2)] font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {item === '인기' ? '🔥 인기' : item}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="이 키워드 사진이 아직 없어요" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((art) => (
            <PhotoTile key={art.id} artwork={art} onOpen={openArtwork} />
          ))}
        </div>
      )}
    </>
  );
}

/* ========================================================================
   PhotoZoomModal — fullscreen viewer with swipe + native pinch
   ====================================================================== */

function PhotoZoomModal({ photos, initialIndex = 0, onClose, onOpenPerson }) {
  const [index, setIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(null);
  const photo = photos[index];

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(photos.length - 1, i + 1));

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') goPrev();
      else if (event.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // body 스크롤 막기
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleTouchStart = (event) => {
    if (event.touches.length === 1) {
      setTouchStart({ x: event.touches[0].clientX, y: event.touches[0].clientY });
    } else {
      setTouchStart(null); // pinch는 브라우저에 맡김
    }
  };

  const handleTouchEnd = (event) => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goPrev();
      else goNext();
    }
    setTouchStart(null);
  };

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs text-white/70">{index + 1} / {photos.length}</p>
          <p className="mt-0.5 text-sm font-semibold tracking-[-0.04em]">{photo.title || '제목 없음'}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
          aria-label="닫기"
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      <div
        className="flex-1 overflow-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pinch-zoom' }}
      >
        <img
          src={photo.imageUrl}
          alt={photo.title || ''}
          className="block min-h-full w-full max-w-none object-contain"
          draggable={false}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold disabled:opacity-30"
        >
          ← 이전
        </button>
        <p className="text-xs text-white/70">스와이프 또는 ←/→</p>
        <button
          type="button"
          onClick={goNext}
          disabled={index === photos.length - 1}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold disabled:opacity-30"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}

/* ========================================================================
   Artwork edit
   ====================================================================== */

function ArtworkEditScreen({ artworkId, setScreen }) {
  const { userId, getArtwork, refresh } = useData();
  const art = getArtwork(artworkId);
  const [title, setTitle] = useState(art?.title || '');
  const [note, setNote] = useState(art?.note || '');
  const [dailyVision, setDailyVision] = useState(art?.daily_vision || '');
  const [mode, setMode] = useState(art?.location_mode || '동네');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!art) return <EmptyState title="사진을 찾을 수 없어요" onAction={() => setScreen('home')} actionLabel="홈으로" />;
  if (art.user_id !== userId) {
    return <EmptyState title="내 사진만 편집할 수 있어요" onAction={() => setScreen('detail')} actionLabel="돌아가기" />;
  }

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    try {
      const fields = {
        title: title || null,
        note: note || null,
        daily_vision: dailyVision || null,
        location_mode: mode,
      };
      // 정확한 위치에서 다른 모드로 바꾸면 좌표 노출 안 되도록 정리
      if (mode !== '정확한 위치' && (art.lat != null || art.lng != null)) {
        fields.lat = null;
        fields.lng = null;
      }
      await updateArtwork(art.id, userId, fields);
      await refresh();
      setScreen('detail');
    } catch (err) {
      setError(err.message || '저장 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="사진 편집" kicker="수정" onBack={() => setScreen('detail')} />
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[24px]">
          <ImageBox src={art.imageUrl} alt={art.title} className="h-64" />
        </div>

        <section className="space-y-4 rounded-[24px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full bg-transparent text-[24px] font-bold tracking-[-0.06em] outline-none placeholder:text-[var(--placeholder)]"
            placeholder="제목"
          />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-20 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-[var(--placeholder)]"
            placeholder="이 사진의 노트"
          />
          <input
            value={dailyVision}
            onChange={(event) => setDailyVision(event.target.value)}
            className="w-full rounded-full border border-[var(--border)] bg-transparent px-4 py-2 text-xs outline-none placeholder:text-[var(--placeholder)]"
            placeholder="오늘의 시선"
          />

          <div>
            <p className="mb-2 text-[12px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">공개 방식</p>
            <div className="flex flex-wrap gap-2">
              {LOCATION_MODES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={`rounded-full px-3 py-2 text-xs ${mode === item ? 'bg-[var(--ink)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)]'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            {mode !== art.location_mode && mode !== '정확한 위치' && (art.lat != null) && (
              <p className="mt-2 text-xs text-[var(--text-muted)]">정확한 좌표는 저장 시 제거됩니다.</p>
            )}
          </div>

          {error && <p className="rounded-[12px] bg-red-50 p-3 text-xs text-red-700">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? '저장 중…' : '저장'}
          </button>
        </section>
      </div>
    </>
  );
}

/* ========================================================================
   Person Exhibition (개인전)
   ====================================================================== */

function ThemeToggleButton() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]"
      title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
    </button>
  );
}

function StatCell({ label, value }) {
  return (
    <div>
      <p className="text-[18px] font-extrabold tracking-[-0.04em] text-[var(--text)]">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold tracking-[0.08em] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

function PersonExhibition({ userId: viewedId, setScreen, openArtwork }) {
  const {
    userId,
    getProfile,
    getUserArtworks,
    getCurateForUser,
    getStats,
    isFollowing,
    getHypeCount,
    refresh,
  } = useData();
  const profile = getProfile(viewedId);
  const works = getUserArtworks(viewedId);
  const wall = getCurateForUser(viewedId);
  const isMe = viewedId === userId;
  const stats = getStats(viewedId);
  const following = isFollowing(viewedId);
  const [seeding, setSeeding] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  if (!profile) return <EmptyState title="사용자를 찾을 수 없어요" onAction={() => setScreen('home')} actionLabel="홈으로" />;

  const heroArtwork = profile.hero_artwork_id ? works.find((a) => a.id === profile.hero_artwork_id) : null;

  const handleLogout = () => {
    if (window.confirm('로그아웃 할까요?')) signOut();
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
                onClick={handleLogout}
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
        {heroArtwork && (
          <section className="-mx-4 -mt-2 mb-2">
            <button
              type="button"
              onClick={() => openArtwork(heroArtwork.id)}
              className="block w-full overflow-hidden bg-[var(--ink)] text-left"
            >
              <div className="relative">
                <ImageBox src={heroArtwork.imageUrl} alt={heroArtwork.title} className="h-[280px] w-full" priority />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 text-white">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-white/70">대표 이미지</p>
                  <p className="mt-1 text-[20px] font-extrabold leading-tight tracking-[-0.06em]">
                    {heroArtwork.title || '제목 없는 사진'}
                  </p>
                </div>
              </div>
            </button>
          </section>
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

          {/* Stats grid */}
          <div className="mt-4 grid grid-cols-4 gap-2 rounded-[18px] bg-[var(--bg)] p-3 text-center">
            <StatCell label="사진" value={stats.artworkCount} />
            <StatCell label="🔥 받음" value={stats.totalHype} />
            <StatCell label="팔로워" value={stats.followerCount} />
            <StatCell label="팔로잉" value={stats.followingCount} />
          </div>

          {!isMe && userId && (
            <button
              type="button"
              onClick={handleFollow}
              disabled={followBusy}
              className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${
                following
                  ? 'border border-[var(--ink)] bg-white text-[var(--text)]'
                  : 'bg-[var(--ink)] text-white'
              }`}
            >
              <Icon name={following ? 'checkFollow' : 'plusFollow'} size={16} />
              {following ? '팔로잉' : '팔로우'}
            </button>
          )}

          {isMe && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setScreen('profileEdit')}
                className="rounded-full border border-[var(--ink)] px-3 py-1.5 text-xs font-semibold"
              >
                프로필 편집
              </button>
              {works.length > 0 && (
                <button
                  type="button"
                  onClick={() => setScreen('bulkPrivacy')}
                  className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold"
                >
                  공개 일괄 변경
                </button>
              )}
              {works.length === 0 && (
                <button
                  type="button"
                  onClick={handleSeed}
                  disabled={seeding}
                  className="rounded-full bg-[var(--ink)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
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
          <h2 className="mb-3 text-[25px] font-extrabold tracking-[-0.07em]">필름</h2>
          {works.length === 0
            ? <EmptyState title="아직 사진이 없어요" />
            : <div className="grid grid-cols-2 gap-3">{works.map((art) => <PhotoTile key={art.id} artwork={art} onOpen={openArtwork} />)}</div>}
        </section>
      </div>
    </>
  );
}

/* ========================================================================
   Profile edit
   ====================================================================== */

function ProfileEditScreen({ setScreen }) {
  const { userId, getProfile, refresh } = useData();
  const profile = getProfile(userId);
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [exhibitionTitle, setExhibitionTitle] = useState(profile?.exhibition_title || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [note, setNote] = useState(profile?.note || '');
  const [words, setWords] = useState((profile?.words || []).join(', '));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile(userId, {
        nickname,
        exhibition_title: exhibitionTitle,
        bio,
        note,
        words: words.split(',').map((w) => w.trim()).filter(Boolean),
      });
      await refresh();
      setScreen('profile');
    } catch (err) {
      setError(err.message || '저장 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="프로필 편집" kicker="내 전시" onBack={() => setScreen('profile')} />
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">닉네임</span>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">전시 제목</span>
          <input value={exhibitionTitle} onChange={(e) => setExhibitionTitle(e.target.value)} className="w-full rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">짧은 소개</span>
          <input value={bio} onChange={(e) => setBio(e.target.value)} className="w-full rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">작가 노트</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-24 w-full rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">키워드 (쉼표로 구분)</span>
          <input value={words} onChange={(e) => setWords(e.target.value)} className="w-full rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        {error && <p className="rounded-[12px] bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        <button type="button" onClick={handleSave} disabled={busy} className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? '저장 중…' : '저장'}
        </button>
      </div>
    </>
  );
}

/* ========================================================================
   Space (지도)
   ====================================================================== */

function SpaceScreen({ openPlace, openArtwork }) {
  const { artworks, places, getPlaceArtworks } = useData();
  const [myLocation, setMyLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  const placePoints = places
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({
      id: `place:${p.id}`,
      lat: p.lat,
      lng: p.lng,
      label: placeLabel(p),
      kind: 'place',
      ref: p,
    }));

  const exactArtPoints = artworks
    .filter((a) => a.location_mode === '정확한 위치' && a.lat != null && a.lng != null)
    .map((a) => ({
      id: `art:${a.id}`,
      lat: a.lat,
      lng: a.lng,
      label: a.title || '제목 없음',
      kind: 'artwork',
      ref: a,
    }));

  const points = [...placePoints, ...exactArtPoints];
  const center = myLocation || (points[0] ? { lat: points[0].lat, lng: points[0].lng } : null);

  const handleLocate = async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setMyLocation({ lat: pos.lat, lng: pos.lng });
    } catch (error) {
      alert('위치 정보를 가져올 수 없어요: ' + error.message);
    } finally {
      setLocating(false);
    }
  };

  const nearbyPlaces = myLocation
    ? places
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({ ...p, distance: distanceMeters(myLocation.lat, myLocation.lng, p.lat, p.lng) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)
    : [];

  return (
    <>
      <Header
        title="지도"
        subtitle="위치를 공유한 사진들이 여기에 걸립니다."
        kicker="공간"
        right={
          <button
            type="button"
            onClick={handleLocate}
            disabled={locating}
            className="rounded-full border border-[var(--ink)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {locating ? '확인 중' : '내 위치'}
          </button>
        }
      />
      <div className="space-y-5">
        {points.length === 0 ? (
          <EmptyState
            title="아직 지도에 표시할 사진이 없어요"
            hint="'정확한 위치' 또는 '동네'로 사진을 올리면 자동으로 지도에 표시됩니다."
          />
        ) : (
          <MapView
            points={points}
            center={center}
            onMarkerClick={(point) => {
              if (point.kind === 'place') openPlace(point.ref.id);
              else openArtwork(point.ref.id);
            }}
          />
        )}

        {myLocation && nearbyPlaces.length > 0 && (
          <section>
            <h2 className="mb-3 text-[22px] font-extrabold tracking-[-0.07em]">가장 가까운 공간</h2>
            <div className="space-y-2">
              {nearbyPlaces.map((p) => {
                const photos = getPlaceArtworks(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openPlace(p.id)}
                    className="flex w-full items-center gap-3 rounded-[18px] bg-[var(--surface)] p-3 text-left shadow-[0_0_0_1px_var(--border)]"
                  >
                    <ImageBox src={photos[0]?.imageUrl} alt={p.name} className="h-14 w-14 shrink-0 rounded-[12px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold tracking-[-0.04em]">{placeLabel(p)}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {Math.round(p.distance)}m · 사진 {photos.length}장
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/* ========================================================================
   Place exhibition
   ====================================================================== */

function PlaceExhibition({ placeId, setScreen, openArtwork }) {
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

/* ========================================================================
   Curate (4컷 순서)
   ====================================================================== */

function CurateScreen({ setScreen, openArtwork }) {
  const { userId, getUserArtworks, getCurateForUser, refresh } = useData();
  const initial = getCurateForUser(userId);
  const [orderedIds, setOrderedIds] = useState(initial.map((art) => art.id));
  const [busy, setBusy] = useState(false);
  const all = getUserArtworks(userId);

  const ordered = orderedIds.map((id) => all.find((a) => a.id === id)).filter(Boolean);
  const remaining = all.filter((a) => !orderedIds.includes(a.id));

  const move = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= orderedIds.length) return;
    setOrderedIds((prev) => {
      const copy = [...prev];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  };

  const remove = (id) => setOrderedIds((prev) => prev.filter((x) => x !== id));
  const add = (id) => setOrderedIds((prev) => (prev.length >= 4 ? prev : [...prev, id]));

  const handleSave = async () => {
    setBusy(true);
    try {
      await setCurateOrder(userId, orderedIds);
      await refresh();
      setScreen('profile');
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="전시 순서" subtitle="오늘 걸어둘 4컷을 정해보세요." kicker="수정" onBack={() => setScreen('profile')} />
      <div className="space-y-4">
        <section className="rounded-[26px] border border-[var(--ink)] bg-[var(--surface)] p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[22px] font-extrabold tracking-[-0.07em]">미리보기</h2>
            <span className="rounded-full border border-[var(--border-strong)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">{ordered.length}/4</span>
          </div>
          <FourPhotoWall photos={ordered} onOpen={openArtwork} />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-[var(--text-muted)]">선택된 사진</h3>
          {ordered.length === 0 && <p className="text-xs text-[var(--text-faint)]">아래에서 사진을 골라 추가하세요.</p>}
          {ordered.map((art, index) => (
            <article key={art.id} className="flex items-center gap-3 rounded-[22px] bg-[var(--surface)] p-2.5 shadow-[0_0_0_1px_var(--border)]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-semibold text-white">{index + 1}</span>
              <button type="button" onClick={() => openArtwork(art.id)} className="h-16 w-16 shrink-0 overflow-hidden rounded-[14px]">
                <ImageBox src={art.imageUrl} alt={art.title} className="h-full w-full" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold tracking-[-0.04em]">{art.title || '제목 없음'}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(index, -1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-strong)]"><Icon name="chevronLeft" size={15} /></button>
                <button type="button" onClick={() => move(index, 1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-strong)]"><Icon name="chevronRight" size={15} /></button>
                <button type="button" onClick={() => remove(art.id)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-strong)] text-xs">×</button>
              </div>
            </article>
          ))}
        </section>

        {remaining.length > 0 && ordered.length < 4 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">추가할 사진</h3>
            <div className="grid grid-cols-3 gap-2">
              {remaining.map((art) => (
                <button key={art.id} type="button" onClick={() => add(art.id)} className="overflow-hidden rounded-[14px]">
                  <ImageBox src={art.imageUrl} alt={art.title} className="aspect-square" />
                </button>
              ))}
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? '저장 중…' : '이 순서로 걸기'}
        </button>
      </div>
    </>
  );
}

/* ========================================================================
   Calendar (필름)
   ====================================================================== */

function CalendarScreen({ setScreen, openArtwork }) {
  const { userId, getUserArtworks } = useData();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const myWorks = getUserArtworks(userId);
  const days = useMemo(() => getMonthDays(myWorks, year, month), [myWorks, year, month]);
  const activeDays = days.filter((d) => d.artworkIds.length > 0);

  const goPrev = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); } else setMonth(month - 1);
  };
  const goNext = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); } else setMonth(month + 1);
  };

  return (
    <>
      <Header title="필름" subtitle="날짜별로 보관된 내 사진." kicker="아카이브" />
      <div className="space-y-5">
        <section className="rounded-[24px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
          <div className="mb-5 flex items-center justify-between">
            <button type="button" onClick={goPrev} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)]"><Icon name="chevronLeft" size={18} /></button>
            <h2 className="text-[22px] font-extrabold tracking-[-0.07em]">{year}년 {month}월</h2>
            <button type="button" onClick={goNext} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)]"><Icon name="chevronRight" size={18} /></button>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] text-[var(--text-muted)]">
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => (
              <div key={`pad-${i}`} className="aspect-[0.78]" />
            ))}
            {days.map((day) => {
              const art = day.artworkIds[0] ? myWorks.find((a) => a.id === day.artworkIds[0]) : null;
              return (
                <button
                  key={day.day}
                  type="button"
                  onClick={() => (art ? openArtwork(art.id) : setScreen('record'))}
                  className="relative aspect-[0.78] overflow-hidden rounded-[12px] bg-[var(--surface-2)]"
                >
                  {art && <img src={art.imageUrl} alt={art.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                  <span className={`absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] ${art ? 'bg-white/85 text-[var(--text)]' : 'text-[var(--text-faint)]'}`}>
                    {day.day}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {activeDays.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[22px] font-extrabold tracking-[-0.07em]">날짜별 보기</h2>
              <button type="button" onClick={() => setScreen('twentyFive')} className="text-xs text-[var(--text-muted)]">
                25번째 사진 고르기
              </button>
            </div>
            {activeDays.map((day) => (
              <FilmDayGrid key={day.day} year={year} month={month} day={day.day} artworkIds={day.artworkIds} works={myWorks} openArtwork={openArtwork} />
            ))}
          </section>
        )}

        {myWorks.length === 0 && (
          <EmptyState title="아직 필름이 비어있어요" hint="첫 사진을 올려보세요." onAction={() => setScreen('record')} actionLabel="사진 올리기" />
        )}
      </div>
    </>
  );
}

function FilmDayGrid({ year, month, day, artworkIds, works, openArtwork }) {
  const photos = artworkIds.map((id) => works.find((a) => a.id === id)).filter(Boolean);
  if (photos.length === 0) return null;
  return (
    <section className="rounded-[24px] bg-[var(--surface)] p-3 shadow-[0_0_0_1px_var(--border)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">
            {year}.{String(month).padStart(2, '0')}.{String(day).padStart(2, '0')}
          </p>
          <h3 className="text-[20px] font-extrabold tracking-[-0.065em]">{photos.length}컷</h3>
        </div>
      </div>
      <div className={`grid gap-1.5 ${photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {photos.slice(0, 6).map((art) => (
          <button key={art.id} type="button" onClick={() => openArtwork(art.id)} className="overflow-hidden rounded-[16px]">
            <ImageBox src={art.imageUrl} alt={art.title} className="h-32" />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ========================================================================
   25th selection
   ====================================================================== */

function TwentyFiveScreen({ setScreen }) {
  const { userId, getUserArtworks, refresh } = useData();
  const works = getUserArtworks(userId);
  const current = works.find((a) => a.is_twenty_five);
  const [selectedId, setSelectedId] = useState(current?.id || works[0]?.id || null);
  const [busy, setBusy] = useState(false);
  const selected = works.find((a) => a.id === selectedId);

  const handleSave = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await setTwentyFive(userId, selectedId);
      await refresh();
      setScreen('archive');
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="가장 아름다운 사진" subtitle="필름 안에서 오래 남은 한 장을 고르세요." kicker="25번째" onBack={() => setScreen('archive')} />
      {works.length === 0 ? (
        <EmptyState title="아직 사진이 없어요" />
      ) : (
        <div className="space-y-4">
          {selected && <ImageBox src={selected.imageUrl} alt={selected.title} className="h-[420px] rounded-[26px]" />}
          <div className="grid grid-cols-4 gap-2">
            {works.slice(0, 16).map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => setSelectedId(art.id)}
                className={`overflow-hidden rounded-[14px] ${selectedId === art.id ? 'ring-2 ring-[var(--ink)]' : ''}`}
              >
                <ImageBox src={art.imageUrl} alt={art.title} className="aspect-square" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !selectedId}
            className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? '저장 중…' : '가장 아름다운 사진으로 정하기'}
          </button>
        </div>
      )}
    </>
  );
}

/* ========================================================================
   Router & App
   ====================================================================== */

function Splash({ message = '불러오는 중…' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6 text-center text-sm text-[var(--text-muted)]">
      {message}
    </div>
  );
}

function OnboardingModal() {
  const { userId, getProfile, refresh } = useData();
  const profile = getProfile(userId);
  // 자동 생성된 닉네임 패턴 (익명_xxxx, user_xxxxxx, user55gg, 짧고 임의의 문자열 등)
  const looksAutoGenerated = (nick) => {
    if (!nick) return true;
    if (/^익명[_-]?[a-z0-9]{2,8}$/i.test(nick)) return true;
    if (/^user[_-]?[a-z0-9]{2,8}$/i.test(nick)) return true;
    if (/^visitor[_-]?[a-z0-9]{2,8}$/i.test(nick)) return true;
    return false;
  };
  const needsOnboarding = profile && looksAutoGenerated(profile.nickname);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!needsOnboarding) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!nickname.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile(userId, {
        nickname: nickname.trim(),
        bio: bio.trim() || null,
      });
      await refresh();
    } catch (err) {
      // 닉네임 중복 등
      if (err.code === '23505') setError('이미 쓰는 닉네임이에요. 다른 걸로.');
      else setError(err.message || '저장 실패');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="mx-auto w-full max-w-[400px] rounded-[24px] bg-[var(--surface)] p-6 shadow-xl">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">시선집에 오신 걸 환영해요</p>
        <h2 className="mt-1 text-[26px] font-extrabold leading-tight tracking-[-0.07em]">
          어떻게 불러드릴까요?
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-body)]">
          닉네임과 짧은 소개를 적어주세요. 다른 사람의 개인전에 보이는 이름이에요.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="닉네임 (필수)"
            required
            maxLength={20}
            autoFocus
            className="w-full rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--ink)]"
          />
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="짧은 소개 (선택) — 예: 모서리와 빛을 모읍니다"
            maxLength={80}
            className="min-h-20 w-full resize-none rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--ink)]"
          />
          {error && <p className="rounded-[12px] bg-red-50 p-2 text-xs text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy || !nickname.trim()}
            className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? '시작 중…' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
}

function MainApp() {
  const [screen, setScreen] = useState('home');
  const [selectedArtworkId, setSelectedArtworkId] = useState(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState(null);

  const openArtwork = (id) => { setSelectedArtworkId(id); setScreen('detail'); };
  const openPlace = (id) => { setSelectedPlaceId(id); setScreen('place'); };
  const openPerson = (id) => { setSelectedUserId(id); setScreen('person'); };
  const openKeyword = (word) => { setSelectedKeyword(word); setScreen('keyword'); };

  let content = null;
  if (screen === 'home') content = <HomeScreen setScreen={setScreen} openArtwork={openArtwork} openPlace={openPlace} openPerson={openPerson} openKeyword={openKeyword} />;
  if (screen === 'search') content = <SearchScreen openArtwork={openArtwork} openPerson={openPerson} openPlace={openPlace} />;
  if (screen === 'space') content = <SpaceScreen openPlace={openPlace} openArtwork={openArtwork} />;
  if (screen === 'record') content = <RecordScreen setScreen={setScreen} />;
  if (screen === 'detail') content = <ArtworkDetail artworkId={selectedArtworkId} setScreen={setScreen} openArtwork={openArtwork} openPlace={openPlace} openPerson={openPerson} openKeyword={openKeyword} />;
  if (screen === 'artworkEdit') content = <ArtworkEditScreen artworkId={selectedArtworkId} setScreen={setScreen} />;
  if (screen === 'person') content = <PersonExhibition userId={selectedUserId} setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'profile') content = <PersonExhibitionMe setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'profileEdit') content = <ProfileEditScreen setScreen={setScreen} />;
  if (screen === 'curate') content = <CurateScreen setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'place') content = <PlaceExhibition placeId={selectedPlaceId} setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'archive') content = <CalendarScreen openArtwork={openArtwork} setScreen={setScreen} />;
  if (screen === 'twentyFive') content = <TwentyFiveScreen setScreen={setScreen} />;
  if (screen === 'notifications') content = <NotificationsScreen setScreen={setScreen} openArtwork={openArtwork} openPerson={openPerson} />;
  if (screen === 'keyword') content = <KeywordScreen keyword={selectedKeyword} setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'bulkPrivacy') content = <BulkPrivacyScreen setScreen={setScreen} />;

  return (
    <>
      <Shell screen={screen} setScreen={setScreen}>{content}</Shell>
      <OnboardingModal />
    </>
  );
}

function PersonExhibitionMe({ setScreen, openArtwork }) {
  const { userId } = useData();
  if (!userId) return <Splash />;
  return <PersonExhibition userId={userId} setScreen={setScreen} openArtwork={openArtwork} />;
}

function DataGate({ children }) {
  const { loading, error } = useData();
  if (loading) return <Splash />;
  if (error) {
    return (
      <Splash message={`데이터 로드 실패: ${error.message}. .env.local 또는 Supabase 설정을 확인해주세요.`} />
    );
  }
  return children;
}

function SetupNeededScreen() {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="mx-auto max-w-[430px] space-y-4 rounded-[24px] bg-[var(--surface)] p-6 shadow-[0_0_0_1px_var(--border)]">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">시선집</p>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.07em]">
          먼저 Supabase를<br />연결해야 해요
        </h1>
        <p className="text-sm leading-6 text-[var(--text-body)]">
          백엔드(데이터베이스/사진 저장/로그인)가 비어있어 앱이 작동하지 않습니다.
          <br />프로젝트 루트의 <code className="rounded bg-[var(--surface-2)] px-1">SETUP.md</code> 가이드를 따라
          <code className="ml-1 rounded bg-[var(--surface-2)] px-1">.env.local</code> 두 줄을 채운 뒤 개발 서버를 다시 시작하세요.
        </p>
        <div className="rounded-[16px] bg-[var(--ink)] p-4 text-xs leading-6 text-white/90">
          <p>VITE_SUPABASE_URL=...</p>
          <p>VITE_SUPABASE_ANON_KEY=...</p>
        </div>
        <p className="text-xs leading-5 text-[var(--text-muted)]">
          값은 Supabase 대시보드 → Project Settings → API 에서 복사할 수 있어요.
        </p>
      </div>
    </div>
  );
}

function Router() {
  const { session, loading: authLoading } = useAuth();

  if (!hasSupabaseConfig) return <SetupNeededScreen />;
  if (authLoading) return <Splash />;
  if (!session) return <LoginScreen />;

  return (
    <DataProvider>
      <DataGate>
        <NotificationsProvider>
          <MainApp />
          <ToastStack />
        </NotificationsProvider>
      </DataGate>
    </DataProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ThemeProvider>
  );
}
