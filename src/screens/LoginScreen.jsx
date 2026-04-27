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

export default function LoginScreen() {
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
