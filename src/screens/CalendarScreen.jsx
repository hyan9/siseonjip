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

export default function CalendarScreen({ setScreen, openArtwork }) {
  const { userId, getUserArtworks } = useData();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const myWorks = getUserArtworks(userId);
  const days = useMemo(() => getMonthDays(myWorks, year, month), [myWorks, year, month]);
  const activeDays = days.filter((d) => d.artworkIds.length > 0);

  // 일주일 뷰: 14일치 (오늘 중앙), 위/아래 페이드 마스크
  const todayStr = now.toDateString();
  const weekDays = useMemo(() => {
    const arr = [];
    for (let i = -7; i <= 6; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const photos = myWorks.filter((a) => {
        // 업로드 일자 기준 (시선집은 매일 4장 일기 컨셉)
        const t = new Date(a.created_at);
        return t.toDateString() === d.toDateString();
      }).slice(0, 4);
      arr.push({ date: d, photos });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myWorks]);

  // 오늘 위치를 가운데로 스크롤
  const weekScrollerRef = useRef(null);
  useEffect(() => {
    const el = weekScrollerRef.current;
    if (!el) return;
    const todayEl = el.querySelector('[data-today="true"]');
    if (!todayEl) return;
    const offset = todayEl.offsetTop - el.clientHeight / 2 + todayEl.clientHeight / 2;
    el.scrollTo({ top: offset, behavior: 'instant' });
  }, [weekDays]);

  const goPrev = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); } else setMonth(month - 1);
  };
  const goNext = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); } else setMonth(month + 1);
  };

  const monthShort = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][now.getMonth()];

  return (
    <>
      <Header
        title={`필름 · ${myWorks.length}장`}
        subtitle="매일 네 장. 25번째 자리는 가장 아름다운 사진을 위해 비어 있어요."
        kicker={`ROLL · ${monthShort} ${now.getFullYear()}`}
      />
      <div className="space-y-5">
        {/* 일주일 뷰 — 가운데 오늘 선명, 위/아래 강한 페이드 = 액자 느낌 */}
        <section>
          <div
            ref={weekScrollerRef}
            className="relative h-[260px] overflow-x-hidden overflow-y-auto"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 12%, black 38%, black 62%, rgba(0,0,0,0.15) 88%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 12%, black 38%, black 62%, rgba(0,0,0,0.15) 88%, transparent 100%)',
              scrollbarWidth: 'none',
            }}
          >
            <div className="flex flex-col gap-1 py-[100px]">
              {weekDays.map((wd) => {
                const isToday = wd.date.toDateString() === todayStr;
                return (
                  <div
                    key={wd.date.toISOString()}
                    data-today={isToday}
                    className={`flex w-full min-w-0 shrink-0 items-center gap-1.5 rounded-[8px] px-1.5 py-1 ${
                      isToday ? 'bg-[var(--ink)] text-white shadow-[0_6px_18px_rgba(0,0,0,0.18)]' : 'bg-[var(--surface)] shadow-[0_0_0_1px_var(--border)]'
                    }`}
                  >
                    <div className="w-[24px] shrink-0 text-center">
                      <p className={`text-[8px] font-semibold ${isToday ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                        {['일','월','화','수','목','금','토'][wd.date.getDay()]}
                      </p>
                      <p className="text-[13px] font-extrabold leading-tight tracking-[-0.05em]">
                        {wd.date.getDate()}
                      </p>
                    </div>
                    <div className="grid min-w-0 flex-1 grid-cols-4 gap-0.5">
                      {[0,1,2,3].map((slot) => {
                        const art = wd.photos[slot];
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => art && openArtwork(art.id)}
                            disabled={!art}
                            className={`relative aspect-square overflow-hidden rounded-[4px] ${
                              art
                                ? ''
                                : isToday
                                ? 'border border-dashed border-white/20 bg-white/5'
                                : 'border border-dashed border-[var(--border)] bg-[var(--bg)]'
                            }`}
                          >
                            {art && <img src={art.imageUrl} alt={art.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
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
              const count = day.artworkIds.length;
              return (
                <button
                  key={day.day}
                  type="button"
                  onClick={() => art && openArtwork(art.id)}
                  disabled={!art}
                  className={`relative aspect-[0.78] overflow-hidden rounded-[12px] bg-[var(--surface-2)] ${!art ? 'cursor-default opacity-60' : ''}`}
                >
                  {art && <img src={art.imageUrl} alt={art.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                  <span className={`absolute left-1 top-1 rounded-full px-1.5 py-0.5 text-[9px] ${art ? 'bg-white/85 text-[var(--text)]' : 'text-[var(--text-faint)]'}`}>
                    {day.day}
                  </span>
                  {count > 1 && (
                    <span className="absolute right-1 top-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      +{count - 1}
                    </span>
                  )}
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
