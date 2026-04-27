import { useEffect, useMemo, useState } from 'react';

import { AuthProvider, useAuth, signInWithEmail, signOut } from './lib/auth-context';
import { DataProvider, useData } from './lib/data-context';
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

/* ========================================================================
   Visual Primitives
   ====================================================================== */

function Shell({ children, screen, setScreen, showNav = true }) {
  return (
    <div className="min-h-screen bg-[#f4efe6] text-[#151515]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[#f4efe6]">
        <main className="min-h-[calc(100vh-70px)] px-4 pb-7 pt-4">{children}</main>
        {showNav && <BottomNav screen={screen} setScreen={setScreen} />}
      </div>
    </div>
  );
}

function BottomNav({ screen, setScreen }) {
  const tabs = [
    { id: 'home', label: '홈', icon: 'eye' },
    { id: 'space', label: '지도', icon: 'map' },
    { id: 'record', label: '기록', icon: 'plus', primary: true },
    { id: 'archive', label: '필름', icon: 'archive' },
    { id: 'profile', label: '내 전시', icon: 'user' },
  ];
  return (
    <nav className="sticky bottom-0 z-40 border-t border-[#e4dccd] bg-[#fbf8f2]/95 px-3 py-2 backdrop-blur">
      <div className="grid grid-cols-5 items-end gap-1">
        {tabs.map((tab) => {
          const active = screen === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => setScreen(tab.id)} className="flex flex-col items-center gap-1 text-[11px]">
              <span className={`flex items-center justify-center rounded-full ${tab.primary ? 'h-11 w-11 bg-[#151515] text-white' : active ? 'h-8 w-8 bg-[#eee6d8] text-[#151515]' : 'h-8 w-8 text-[#7a746b]'}`}>
                <Icon name={tab.icon} size={tab.primary ? 20 : 17} />
              </span>
              <span className={active ? 'font-semibold text-[#151515]' : 'text-[#7a746b]'}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Header({ title, subtitle, kicker = '시선집', onBack, right }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {onBack && <button type="button" onClick={onBack} className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-[#e4dccd] bg-[#fbf8f2]"><Icon name="back" size={18} /></button>}
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-[0.16em] text-[#7a746b]">{kicker}</p>
          <h1 className="text-[30px] font-extrabold leading-none tracking-[-0.08em]">{title}</h1>
          {subtitle && <p className="mt-3 max-w-[31ch] text-[14px] leading-6 text-[#746e66]">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}

function ImageBox({ src, alt, className = '', fit = 'cover' }) {
  return (
    <div className={`overflow-hidden bg-[#ded6c8] ${className}`}>
      {src ? <img src={src} alt={alt || ''} className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`} /> : null}
    </div>
  );
}

function SearchBar({ query, setQuery, onFocus }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[#e4dccd] bg-[#fbf8f2] px-4 py-3">
      <Icon name="search" size={17} className="text-[#7a746b]" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={onFocus} placeholder="사진, 사람, 위치 검색" className="w-full bg-transparent text-sm outline-none placeholder:text-[#9a948b]" />
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
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-semibold ${compact ? 'h-7 px-2 text-[11px]' : 'h-9 px-3 text-sm'} ${hyped ? 'border border-[#151515] bg-[#151515] text-white' : 'border border-[#d8cfbf] bg-[#fbf8f2] text-[#151515]'}`}
    >
      <span>🔥</span>
      <span>Hype</span>
      <span className={hyped ? 'text-white/70' : 'text-[#746e66]'}>{count}</span>
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
      className={`${label ? 'gap-1.5 px-3' : 'h-9 w-9'} inline-flex items-center justify-center rounded-full border border-[#d8cfbf] bg-[#fbf8f2]/90 text-xs font-semibold text-[#151515] shadow-[0_4px_16px_rgba(20,20,20,0.06)] backdrop-blur`}
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
  return <span className={`rounded-full px-3 py-1 text-[11px] ${dark ? 'bg-[#151515]/85 text-white' : 'bg-white/90 text-[#151515]'}`}>{baseLabel}</span>;
}

function ExhibitionSlot({ artwork, onOpen, large = false }) {
  return (
    <button
      type="button"
      onClick={() => artwork && onOpen(artwork.id)}
      className={`group relative overflow-hidden bg-[#e8dfd1] text-left ${large ? 'rounded-[24px]' : 'rounded-[18px]'} ${!artwork ? 'border border-dashed border-[#cfc6b8]' : ''}`}
    >
      {artwork ? (
        <>
          <ImageBox src={artwork.imageUrl} alt={artwork.title} className="h-full w-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
            <p className="line-clamp-2 text-sm font-semibold leading-5 text-white">{artwork.title}</p>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] text-[#9a948b]">빈 벽</div>
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
    <div className="rounded-[24px] border border-dashed border-[#d8cfbf] bg-[#fbf8f2] p-8 text-center">
      <p className="text-sm font-semibold text-[#151515]">{title}</p>
      {hint && <p className="mt-2 whitespace-pre-line text-xs leading-5 text-[#746e66]">{hint}</p>}
      {onAction && (
        <button type="button" onClick={onAction} className="mt-4 rounded-full bg-[#151515] px-4 py-2 text-xs font-semibold text-white">
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
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch (err) {
      setError(err.message || '로그인 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#151515] text-white">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col justify-between p-5">
        <section className="relative min-h-[560px] flex-1 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#3b2f25] via-[#1f1610] to-black">
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
                <form onSubmit={handleSubmit} className="mt-8 space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="이메일"
                    className="w-full rounded-full border border-white/30 bg-white/5 px-5 py-4 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/60"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-full bg-white px-5 py-4 text-sm font-semibold text-[#151515] disabled:opacity-50"
                  >
                    {busy ? '메일 보내는 중…' : '매직 링크 받기'}
                  </button>
                  {error && <p className="text-xs text-red-300">{error}</p>}
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ========================================================================
   Home
   ====================================================================== */

function HomeScreen({ setScreen, openArtwork, openPlace }) {
  const { artworks, places, getPlaceArtworks } = useData();

  const placesWithArt = places
    .map((place) => ({ place, photos: getPlaceArtworks(place.id).slice(0, 4) }))
    .filter((entry) => entry.photos.length > 0);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold tracking-[0.18em] text-[#746e66]">시선집</p>
          <h1 className="mt-0.5 text-[27px] font-extrabold tracking-[-0.08em]">근방 네컷 전시</h1>
        </div>
        <button type="button" onClick={() => setScreen('profile')} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4dccd] bg-[#fbf8f2]">
          <Icon name="user" size={17} />
        </button>
      </div>

      {artworks.length === 0 ? (
        <div className="space-y-3">
          <EmptyState
            title="아직 시선집이 비어있어요"
            hint={'사용법은 간단해요:\n1. 아래 + 버튼으로 사진 올리기\n2. 사진의 EXIF GPS 또는 "내 위치"로 자동 동네 매칭\n3. 같은 동네의 사진은 자동으로 한 전시에 묶여요\n\n둘러보고 싶으면 [내 전시] 탭에서 샘플 사진 5장 추가도 가능합니다.'}
            onAction={() => setScreen('record')}
            actionLabel="첫 사진 올리기"
          />
        </div>
      ) : placesWithArt.length === 0 ? (
        <EmptyState
          title="아직 위치 기반 전시가 없어요"
          hint="위치 정보가 있는 사진(EXIF GPS 또는 '내 위치 사용')을 올리면 동네별로 묶여서 보여요."
          onAction={() => setScreen('record')}
          actionLabel="사진 올리기"
        />
      ) : (
        <section className="space-y-4">
          {placesWithArt.map(({ place, photos }) => (
            <article key={place.id} className="rounded-[28px] bg-[#fbf8f2] p-3 shadow-[0_0_0_1px_#e4dccd]">
              <button type="button" onClick={() => openPlace(place.id)} className="mb-3 flex w-full items-end justify-between gap-3 px-1 text-left">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-[#746e66]">{placeLabel(place)}</p>
                  <h2 className="mt-0.5 text-[24px] font-extrabold tracking-[-0.075em]">{place.name || '이름 없는 공간'}</h2>
                </div>
                <span className="rounded-full border border-[#d8cfbf] px-2.5 py-1 text-[11px] text-[#746e66]">위치 전시</span>
              </button>
              <FourPhotoWall photos={photos} onOpen={openArtwork} />
              {place.note && <p className="mt-3 px-1 text-xs leading-5 text-[#746e66]">{place.note}</p>}
            </article>
          ))}
        </section>
      )}
    </>
  );
}

/* ========================================================================
   Search
   ====================================================================== */

function SearchScreen({ openArtwork, openPerson, openPlace }) {
  const { artworks, profiles, places, getProfile, getPlace } = useData();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('사진');
  const q = query.trim().toLowerCase();

  const matches = (text) => text?.toLowerCase().includes(q);

  const filteredArts = artworks.filter((art) =>
    [art.title, art.note, art.daily_vision, getProfile(art.user_id)?.nickname, placeLabel(getPlace(art.place_id))]
      .filter(Boolean)
      .some(matches)
  );
  const filteredUsers = profiles.filter((p) =>
    [p.nickname, p.exhibition_title, p.bio, ...(p.words || [])]
      .filter(Boolean)
      .some(matches)
  );
  const filteredPlaces = places.filter((p) =>
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
              className={`rounded-full px-4 py-2 text-sm ${tab === item ? 'bg-[#151515] text-white' : 'border border-[#e4dccd] bg-[#fbf8f2] text-[#746e66]'}`}
            >
              {item}
            </button>
          ))}
        </div>
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
  return (
    <button type="button" onClick={() => onOpen(artwork.id)} className="overflow-hidden rounded-[20px] bg-[#fbf8f2] text-left shadow-[0_0_0_1px_#e4dccd]">
      <div className="relative"><ImageBox src={artwork.imageUrl} alt={artwork.title} className="h-44" /></div>
      <div className="p-3"><p className="line-clamp-2 text-sm font-semibold tracking-[-0.04em]">{artwork.title || '제목 없음'}</p></div>
    </button>
  );
}

function PersonRow({ profile, onOpen }) {
  const { getUserArtworks } = useData();
  const works = getUserArtworks(profile.id);
  const main = works.find((art) => art.is_twenty_five) || works[0];
  return (
    <button type="button" onClick={() => onOpen(profile.id)} className="flex w-full gap-3 rounded-[22px] bg-[#fbf8f2] p-3 text-left shadow-[0_0_0_1px_#e4dccd]">
      <ImageBox src={main?.imageUrl} alt={profile.nickname} className="h-20 w-20 shrink-0 rounded-[16px]" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#746e66]">{profile.nickname}</p>
        <h3 className="mt-1 text-lg font-bold tracking-[-0.05em]">{profile.exhibition_title || '제목 미정'}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#746e66]">{profile.bio || ''}</p>
      </div>
    </button>
  );
}

function PlaceRow({ place, onOpen }) {
  const { getPlaceArtworks } = useData();
  const photo = getPlaceArtworks(place.id)[0];
  return (
    <button type="button" onClick={() => onOpen(place.id)} className="flex w-full gap-3 rounded-[22px] bg-[#fbf8f2] p-3 text-left shadow-[0_0_0_1px_#e4dccd]">
      <ImageBox src={photo?.imageUrl} alt={place.name} className="h-20 w-20 shrink-0 rounded-[16px]" />
      <div>
        <p className="text-lg font-bold tracking-[-0.05em]">{place.name || '이름 없는 공간'}</p>
        <p className="mt-1 text-sm text-[#746e66]">{place.neighborhood || '미상'}</p>
      </div>
    </button>
  );
}

/* ========================================================================
   Record (사진 업로드 + GPS + 저장)
   ====================================================================== */

const LOCATION_MODES = ['정확한 위치', '동네', '개인전만', '숨김'];

function RecordScreen({ setScreen }) {
  const { userId, places, refresh } = useData();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mode, setMode] = useState('동네');
  const [gpsStatus, setGpsStatus] = useState('idle');
  const [gpsSource, setGpsSource] = useState(null); // 'exif' | 'manual'
  const [gps, setGps] = useState({ lat: null, lng: null });
  const [takenAt, setTakenAt] = useState(null);
  const [neighborhood, setNeighborhood] = useState(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dailyVision, setDailyVision] = useState('');
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const fillFromCoords = async (lat, lng, source) => {
    setGps({ lat, lng });
    setGpsStatus('found');
    setGpsSource(source);
    const geo = await reverseGeocode(lat, lng);
    if (geo?.neighborhood) setNeighborhood(geo.neighborhood);
  };

  const handleFile = async (event) => {
    const picked = event.target.files?.[0];
    if (!picked) return;
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
    setGpsStatus('reading');
    setGpsSource(null);
    setNeighborhood(null);
    setGps({ lat: null, lng: null });

    const meta = await readPhotoMeta(picked);
    setTakenAt(meta.takenAt);

    if (meta.lat != null && meta.lng != null) {
      await fillFromCoords(meta.lat, meta.lng, 'exif');
    } else {
      setGpsStatus(meta.status);
    }
  };

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      await fillFromCoords(pos.lat, pos.lng, 'manual');
    } catch (err) {
      alert('위치 권한이 필요해요: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setLocating(false);
    }
  };

  const clearLocation = () => {
    setGps({ lat: null, lng: null });
    setNeighborhood(null);
    setGpsStatus('empty');
    setGpsSource(null);
  };

  const handleSave = async () => {
    if (!file || !userId) return;
    setBusy(true);
    setError(null);
    try {
      const storagePath = await uploadPhoto(userId, file);

      const shareLocation = mode === '정확한 위치' || mode === '동네';
      let placeId = null;
      if (shareLocation && gps.lat != null && gps.lng != null) {
        const place = await upsertPlace({
          lat: gps.lat,
          lng: gps.lng,
          neighborhood,
          name: neighborhood || null,
          places,
        });
        placeId = place?.id || null;
      }

      const storeExactCoords = mode === '정확한 위치';
      await insertArtwork({
        userId,
        storagePath,
        title,
        note,
        dailyVision,
        locationMode: mode,
        takenAt,
        lat: storeExactCoords ? gps.lat : null,
        lng: storeExactCoords ? gps.lng : null,
        placeId,
      });

      await refresh();
      setScreen('archive');
    } catch (err) {
      console.error(err);
      setError(err.message || '저장 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="기록" subtitle="사진 한 장이 오늘의 전시가 됩니다." kicker="새 장면" />
      <div className="space-y-4">
        <label className="block cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {!previewUrl ? (
            <div className="flex h-[430px] flex-col items-center justify-center rounded-[28px] border border-[#e4dccd] bg-[#fbf8f2] text-[#746e66]">
              <Icon name="camera" size={34} />
              <span className="mt-3 text-sm">사진 고르기</span>
              <span className="mt-2 text-xs text-[#9a948b]">사진 안의 위치 정보도 함께 확인합니다.</span>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[28px] bg-[#fbf8f2] shadow-[0_0_0_1px_#e4dccd]">
              <div className="relative">
                <img src={previewUrl} alt="선택한 사진" className="h-[460px] w-full object-cover" />
                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                  <GpsStatusBadge status={gpsStatus} source={gpsSource} />
                  {neighborhood && (
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] text-[#151515]">{neighborhood}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </label>

        {previewUrl && (
          <div className="rounded-[20px] bg-[#fbf8f2] p-3 text-xs leading-5 text-[#4d4943] shadow-[0_0_0_1px_#e4dccd]">
            {gpsStatus === 'found' && gpsSource === 'exif' && (
              <p>📍 사진에 새겨진 좌표를 읽었어요{neighborhood ? ` (${neighborhood})` : ''}.</p>
            )}
            {gpsStatus === 'found' && gpsSource === 'manual' && (
              <div className="flex items-center justify-between gap-2">
                <p>📍 지금 내 위치로 설정됨{neighborhood ? ` (${neighborhood})` : ''}.</p>
                <button type="button" onClick={(event) => { event.preventDefault(); clearLocation(); }} className="rounded-full border border-[#d8cfbf] px-2.5 py-1 text-[11px] text-[#746e66]">
                  취소
                </button>
              </div>
            )}
            {(gpsStatus === 'empty' || gpsStatus === 'error') && (
              <div className="space-y-2">
                <p>이 사진엔 위치 정보가 없어요. (iOS는 업로드할 때 위치를 빼버리는 경우가 많아요.)</p>
                <button
                  type="button"
                  onClick={(event) => { event.preventDefault(); handleUseMyLocation(); }}
                  disabled={locating}
                  className="rounded-full bg-[#151515] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                >
                  {locating ? '위치 가져오는 중…' : '📍 현재 내 위치 사용'}
                </button>
              </div>
            )}
          </div>
        )}

        {previewUrl && (
          <section className="space-y-4 rounded-[24px] bg-[#fbf8f2] p-4 shadow-[0_0_0_1px_#e4dccd]">
            <div>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full bg-transparent text-[24px] font-bold tracking-[-0.06em] outline-none placeholder:text-[#aaa399]"
                placeholder="제목"
              />
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="mt-3 min-h-20 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-[#aaa399]"
                placeholder="왜 이 사진을 남기고 싶었나요"
              />
              <input
                value={dailyVision}
                onChange={(event) => setDailyVision(event.target.value)}
                className="mt-3 w-full rounded-full border border-[#e4dccd] bg-transparent px-4 py-2 text-xs outline-none placeholder:text-[#aaa399]"
                placeholder="오늘의 시선 (예: 빛, 벽, 흔들림)"
              />
            </div>

            <div>
              <p className="mb-3 text-[12px] font-semibold tracking-[0.14em] text-[#746e66]">공개 방식</p>
              <div className="flex flex-wrap gap-2">
                {LOCATION_MODES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={`rounded-full px-3 py-2 text-xs ${mode === item ? 'bg-[#151515] text-white' : 'border border-[#e4dccd] text-[#746e66]'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-[#746e66]">
                {mode === '정확한 위치' && '지도에 정확한 좌표로 표시됩니다.'}
                {mode === '동네' && '동네 이름만 노출되고 좌표는 저장되지 않아요.'}
                {mode === '개인전만' && '내 개인전에만 걸려요. 공간 전시에는 안 들어가요.'}
                {mode === '숨김' && '나만 볼 수 있어요. 다른 사람에겐 보이지 않아요.'}
              </p>
            </div>

            {error && <p className="rounded-[12px] bg-red-50 p-3 text-xs text-red-700">{error}</p>}

            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="w-full rounded-full bg-[#151515] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? '올리는 중…' : '필름에 넣기'}
            </button>
          </section>
        )}
      </div>
    </>
  );
}

/* ========================================================================
   Artwork detail + comments
   ====================================================================== */

function ArtworkDetail({ artworkId, setScreen, openArtwork, openPlace }) {
  const { getArtwork, getProfile, getPlace, getUserArtworks, getCommentsFor } = useData();
  const art = getArtwork(artworkId);

  if (!art) return <EmptyState title="사진을 찾을 수 없어요" onAction={() => setScreen('home')} actionLabel="홈으로" />;

  const profile = getProfile(art.user_id);
  const place = getPlace(art.place_id);
  const related = getUserArtworks(art.user_id).filter((item) => item.id !== art.id).slice(0, 3);
  const artComments = getCommentsFor(art.id);

  return (
    <>
      <button type="button" onClick={() => setScreen('home')} className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#e4dccd] bg-[#fbf8f2]">
        <Icon name="back" size={18} />
      </button>
      <div className="space-y-4">
        <section className="overflow-hidden rounded-[28px] bg-[#151515] shadow-[0_0_0_1px_#151515]">
          <div className="relative flex min-h-[620px] items-center justify-center bg-[#151515]">
            <ImageBox src={art.imageUrl} alt={art.title} fit="contain" className="h-[620px] w-full bg-[#151515]" />
            {art.is_twenty_five && (
              <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#151515]">
                가장 아름다운 사진
              </span>
            )}
            <div className="absolute right-3 top-3"><ShareButton title={art.title || '시선집'} /></div>
          </div>
        </section>

        <CommentSection artworkId={art.id} comments={artComments} />

        <section className="rounded-[24px] bg-[#fbf8f2] p-4 shadow-[0_0_0_1px_#e4dccd]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[29px] font-extrabold leading-tight tracking-[-0.08em]">{art.title || '제목 없음'}</h1>
              <button
                type="button"
                onClick={() => place && openPlace(place.id)}
                className="mt-3 text-left text-sm text-[#746e66]"
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
          {art.note && <p className="mt-4 text-[15px] leading-7 text-[#3f3a34]">{art.note}</p>}
          <div className="mt-4"><HypeButton artwork={art} /></div>
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
    </>
  );
}

function CommentSection({ artworkId, comments }) {
  const { userId, getProfile, refresh } = useData();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!text.trim() || !userId) return;
    setBusy(true);
    try {
      await postComment(artworkId, userId, text.trim());
      setText('');
      await refresh();
    } catch (error) {
      console.error('댓글 실패', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-[24px] bg-[#fbf8f2] p-4 shadow-[0_0_0_1px_#e4dccd]">
      <div className="mb-4">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#746e66]">감상 노트</p>
        <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.06em]">이 사진 앞에서</h2>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="짧게 남기기"
          className="flex-1 rounded-full border border-[#e4dccd] bg-white px-4 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="rounded-full bg-[#151515] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          남기기
        </button>
      </form>

      <div className="space-y-3">
        {comments.length === 0 && <p className="text-xs text-[#9a948b]">아직 노트가 없어요. 첫 감상을 남겨보세요.</p>}
        {comments.map((comment) => {
          const author = getProfile(comment.user_id);
          return (
            <article key={comment.id} className="border-l border-[#151515] pl-4">
              <p className="text-[15px] leading-7 text-[#3f3a34]">"{comment.text}"</p>
              <p className="mt-2 text-[11px] tracking-[0.12em] text-[#8c857c]">
                {profileLabel(author)} · {formatTime(comment.created_at)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ========================================================================
   Person Exhibition (개인전)
   ====================================================================== */

function PersonExhibition({ userId: viewedId, setScreen, openArtwork }) {
  const { userId, getProfile, getUserArtworks, getCurateForUser, refresh } = useData();
  const profile = getProfile(viewedId);
  const works = getUserArtworks(viewedId);
  const wall = getCurateForUser(viewedId);
  const isMe = viewedId === userId;
  const [seeding, setSeeding] = useState(false);

  if (!profile) return <EmptyState title="사용자를 찾을 수 없어요" onAction={() => setScreen('home')} actionLabel="홈으로" />;

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

  return (
    <>
      <Header
        title={`${profile.nickname}의 개인전`}
        subtitle={profile.bio || ''}
        kicker="개인전"
        onBack={isMe ? undefined : () => setScreen('home')}
        right={
          isMe ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4dccd] bg-[#fbf8f2]"
              title="로그아웃"
            >
              <Icon name="logout" size={16} />
            </button>
          ) : null
        }
      />
      <div className="space-y-4">
        <section className="rounded-[28px] bg-[#fbf8f2] p-4 shadow-[0_0_0_1px_#e4dccd]">
          <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.075em]">{profile.exhibition_title || '제목 없는 전시'}</h2>
          {profile.note && <p className="mt-2 text-sm leading-6 text-[#4d4943]">{profile.note}</p>}
          {profile.words?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.words.map((word) => (
                <span key={word} className="rounded-full border border-[#e4dccd] px-3 py-1 text-xs text-[#746e66]">{word}</span>
              ))}
            </div>
          )}
          {isMe && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setScreen('profileEdit')}
                className="rounded-full border border-[#151515] px-3 py-1.5 text-xs font-semibold"
              >
                프로필 편집
              </button>
              {works.length === 0 && (
                <button
                  type="button"
                  onClick={handleSeed}
                  disabled={seeding}
                  className="rounded-full bg-[#151515] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {seeding ? '샘플 추가 중…' : '🌱 샘플 사진 5장 추가'}
                </button>
              )}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[25px] font-extrabold tracking-[-0.07em]">오늘의 4컷</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#d8cfbf] px-2.5 py-1 text-[11px] text-[#746e66]">{Math.min(wall.length, 4)}/4</span>
              {isMe && (
                <button type="button" onClick={() => setScreen('curate')} className="rounded-full border border-[#151515] px-3 py-1.5 text-xs font-semibold">
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
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[#746e66]">닉네임</span>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full rounded-[16px] border border-[#e4dccd] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[#746e66]">전시 제목</span>
          <input value={exhibitionTitle} onChange={(e) => setExhibitionTitle(e.target.value)} className="w-full rounded-[16px] border border-[#e4dccd] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[#746e66]">짧은 소개</span>
          <input value={bio} onChange={(e) => setBio(e.target.value)} className="w-full rounded-[16px] border border-[#e4dccd] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[#746e66]">작가 노트</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-24 w-full rounded-[16px] border border-[#e4dccd] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[#746e66]">키워드 (쉼표로 구분)</span>
          <input value={words} onChange={(e) => setWords(e.target.value)} className="w-full rounded-[16px] border border-[#e4dccd] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        {error && <p className="rounded-[12px] bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        <button type="button" onClick={handleSave} disabled={busy} className="w-full rounded-full bg-[#151515] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50">
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
            className="rounded-full border border-[#151515] px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
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
                    className="flex w-full items-center gap-3 rounded-[18px] bg-[#fbf8f2] p-3 text-left shadow-[0_0_0_1px_#e4dccd]"
                  >
                    <ImageBox src={photos[0]?.imageUrl} alt={p.name} className="h-14 w-14 shrink-0 rounded-[12px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold tracking-[-0.04em]">{placeLabel(p)}</p>
                      <p className="text-[11px] text-[#746e66]">
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
        <section className="rounded-[26px] border border-[#151515] bg-[#fbf8f2] p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[22px] font-extrabold tracking-[-0.07em]">미리보기</h2>
            <span className="rounded-full border border-[#d8cfbf] px-2.5 py-1 text-[11px] text-[#746e66]">{ordered.length}/4</span>
          </div>
          <FourPhotoWall photos={ordered} onOpen={openArtwork} />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-[#746e66]">선택된 사진</h3>
          {ordered.length === 0 && <p className="text-xs text-[#9a948b]">아래에서 사진을 골라 추가하세요.</p>}
          {ordered.map((art, index) => (
            <article key={art.id} className="flex items-center gap-3 rounded-[22px] bg-[#fbf8f2] p-2.5 shadow-[0_0_0_1px_#e4dccd]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#151515] text-[11px] font-semibold text-white">{index + 1}</span>
              <button type="button" onClick={() => openArtwork(art.id)} className="h-16 w-16 shrink-0 overflow-hidden rounded-[14px]">
                <ImageBox src={art.imageUrl} alt={art.title} className="h-full w-full" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold tracking-[-0.04em]">{art.title || '제목 없음'}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(index, -1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d8cfbf]"><Icon name="chevronLeft" size={15} /></button>
                <button type="button" onClick={() => move(index, 1)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d8cfbf]"><Icon name="chevronRight" size={15} /></button>
                <button type="button" onClick={() => remove(art.id)} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d8cfbf] text-xs">×</button>
              </div>
            </article>
          ))}
        </section>

        {remaining.length > 0 && ordered.length < 4 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-[#746e66]">추가할 사진</h3>
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
          className="w-full rounded-full bg-[#151515] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
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
        <section className="rounded-[24px] bg-[#fbf8f2] p-4 shadow-[0_0_0_1px_#e4dccd]">
          <div className="mb-5 flex items-center justify-between">
            <button type="button" onClick={goPrev} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4dccd]"><Icon name="chevronLeft" size={18} /></button>
            <h2 className="text-[22px] font-extrabold tracking-[-0.07em]">{year}년 {month}월</h2>
            <button type="button" onClick={goNext} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4dccd]"><Icon name="chevronRight" size={18} /></button>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] text-[#746e66]">
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
                  className="relative aspect-[0.78] overflow-hidden rounded-[12px] bg-[#eee6d8]"
                >
                  {art && <img src={art.imageUrl} alt={art.title} className="h-full w-full object-cover" />}
                  <span className={`absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] ${art ? 'bg-white/85 text-[#151515]' : 'text-[#9a948b]'}`}>
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
              <button type="button" onClick={() => setScreen('twentyFive')} className="text-xs text-[#746e66]">
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
    <section className="rounded-[24px] bg-[#fbf8f2] p-3 shadow-[0_0_0_1px_#e4dccd]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#746e66]">
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
                className={`overflow-hidden rounded-[14px] ${selectedId === art.id ? 'ring-2 ring-[#151515]' : ''}`}
              >
                <ImageBox src={art.imageUrl} alt={art.title} className="aspect-square" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !selectedId}
            className="w-full rounded-full bg-[#151515] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
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
    <div className="flex min-h-screen items-center justify-center bg-[#f4efe6] p-6 text-center text-sm text-[#746e66]">
      {message}
    </div>
  );
}

function MainApp() {
  const [screen, setScreen] = useState('home');
  const [selectedArtworkId, setSelectedArtworkId] = useState(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const openArtwork = (id) => { setSelectedArtworkId(id); setScreen('detail'); };
  const openPlace = (id) => { setSelectedPlaceId(id); setScreen('place'); };
  const openPerson = (id) => { setSelectedUserId(id); setScreen('person'); };

  let content = null;
  if (screen === 'home') content = <HomeScreen setScreen={setScreen} openArtwork={openArtwork} openPlace={openPlace} />;
  if (screen === 'search') content = <SearchScreen openArtwork={openArtwork} openPerson={openPerson} openPlace={openPlace} />;
  if (screen === 'space') content = <SpaceScreen openPlace={openPlace} openArtwork={openArtwork} />;
  if (screen === 'record') content = <RecordScreen setScreen={setScreen} />;
  if (screen === 'detail') content = <ArtworkDetail artworkId={selectedArtworkId} setScreen={setScreen} openArtwork={openArtwork} openPlace={openPlace} />;
  if (screen === 'person') content = <PersonExhibition userId={selectedUserId} setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'profile') content = <PersonExhibitionMe setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'profileEdit') content = <ProfileEditScreen setScreen={setScreen} />;
  if (screen === 'curate') content = <CurateScreen setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'place') content = <PlaceExhibition placeId={selectedPlaceId} setScreen={setScreen} openArtwork={openArtwork} />;
  if (screen === 'archive') content = <CalendarScreen openArtwork={openArtwork} setScreen={setScreen} />;
  if (screen === 'twentyFive') content = <TwentyFiveScreen setScreen={setScreen} />;

  return <Shell screen={screen} setScreen={setScreen}>{content}</Shell>;
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
    <div className="min-h-screen bg-[#f4efe6] p-6">
      <div className="mx-auto max-w-[430px] space-y-4 rounded-[24px] bg-[#fbf8f2] p-6 shadow-[0_0_0_1px_#e4dccd]">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#746e66]">시선집</p>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.07em]">
          먼저 Supabase를<br />연결해야 해요
        </h1>
        <p className="text-sm leading-6 text-[#4d4943]">
          백엔드(데이터베이스/사진 저장/로그인)가 비어있어 앱이 작동하지 않습니다.
          <br />프로젝트 루트의 <code className="rounded bg-[#eee6d8] px-1">SETUP.md</code> 가이드를 따라
          <code className="ml-1 rounded bg-[#eee6d8] px-1">.env.local</code> 두 줄을 채운 뒤 개발 서버를 다시 시작하세요.
        </p>
        <div className="rounded-[16px] bg-[#151515] p-4 text-xs leading-6 text-white/90">
          <p>VITE_SUPABASE_URL=...</p>
          <p>VITE_SUPABASE_ANON_KEY=...</p>
        </div>
        <p className="text-xs leading-5 text-[#746e66]">
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
        <MainApp />
      </DataGate>
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
