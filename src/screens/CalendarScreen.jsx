import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../lib/data-context';
import {
  Header,
  ImageBox,
  EmptyState,
} from '../components/ui';
import Icon from '../components/Icon';
import PhotoZoomModal from '../components/PhotoZoomModal';
import { CatPhotographer } from '../components/Mascot';


import {
  getMonthDays,
} from '../lib/utils';







export default function CalendarScreen({ setScreen, openArtwork }) {
  const { userId, getUserArtworks } = useData();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const myWorks = getUserArtworks(userId);
  const days = useMemo(() => getMonthDays(myWorks, year, month), [myWorks, year, month]);
  const activeDays = days.filter((d) => d.artworkIds.length > 0);

  // 25번째 진행률 — 이 달의 사진 24장 + 25번째 결정 = 한 롤
  const monthArtworks = useMemo(
    () =>
      myWorks.filter((a) => {
        const d = new Date(a.created_at);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }),
    [myWorks, year, month]
  );
  const monthCount = monthArtworks.length;
  const filled24 = Math.min(24, monthCount);
  const has25 = monthArtworks.some((a) => a.is_twenty_five);
  const rollComplete = filled24 >= 24 && has25;

  // 그날의 4장을 위아래 스크롤로 보는 zoom
  const [zoomDay, setZoomDay] = useState(null); // { photos, initialIndex }
  const openDayZoom = (photos, initialIndex = 0) => {
    if (!photos || photos.length === 0) return;
    setZoomDay({ photos, initialIndex });
  };

  // 일주일 뷰: 14일치 (오늘 중앙), 위/아래 페이드 마스크
  const todayStr = now.toDateString();
  const weekDays = useMemo(() => {
    const arr = [];
    for (let i = -7; i <= 6; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const photos = myWorks.filter((a) => {
        // 업로드 일자 기준 (카든냥은 매일 4장 일기 컨셉)
        const t = new Date(a.created_at);
        return t.toDateString() === d.toDateString();
      }).slice(0, 4);
      arr.push({ date: d, photos });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myWorks]);

  // 오늘 위치를 가운데로 — 첫 진입은 즉시, 그 후는 부드럽게
  const weekScrollerRef = useRef(null);
  const didInitialScroll = useRef(false);
  useEffect(() => {
    const el = weekScrollerRef.current;
    if (!el) return;
    const todayEl = el.querySelector('[data-today="true"]');
    if (!todayEl) return;
    const offset = todayEl.offsetTop - el.clientHeight / 2 + todayEl.clientHeight / 2;
    el.scrollTo({ top: offset, behavior: didInitialScroll.current ? 'smooth' : 'instant' });
    didInitialScroll.current = true;
  }, [weekDays]);

  const goPrev = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); } else setMonth(month - 1);
  };
  const goNext = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); } else setMonth(month + 1);
  };

  const monthShort = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][now.getMonth()];

  // 상단 탭 — 롤(25칸 진행률) / 일주일 / 월별
  const [filmView, setFilmView] = useState('roll');

  return (
    <>
      {/* 탭 — TopBar 바로 아래에 sticky */}
      <div className="sticky top-11 z-30 -mx-3 flex items-center gap-1 border-b border-[var(--border)] bg-[var(--bg)] px-3">
        {[
          { id: 'roll', label: '롤' },
          { id: 'week', label: '일주일' },
          { id: 'month', label: '월별' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilmView(t.id)}
            className={`border-b-2 px-3 py-2 text-[13px] font-bold transition ${
              filmView === t.id
                ? 'border-[var(--ink)] text-[var(--text)]'
                : 'border-transparent text-[var(--text-muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Header
        title={`필름 · ${myWorks.length}장`}
        subtitle="매일 네 장. 25번째는 그중 가장 오래 남은 한 장."
        kicker={`ROLL · ${monthShort} ${now.getFullYear()}`}
      />
      <div className="space-y-5">
        {/* 25칸 진행률 — 게이미피케이션 (이번 달 한 롤) */}
        {filmView === 'roll' && (
        <section className={`rounded-[20px] p-4 transition ${
          rollComplete
            ? 'bg-[var(--ink)] text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]'
            : 'bg-[var(--surface)] shadow-[0_0_0_1px_var(--border)]'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[10px] font-semibold tracking-[0.16em] ${rollComplete ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                {monthShort} {now.getFullYear()} ROLL
              </p>
              <p className="mt-0.5 text-[20px] font-extrabold tracking-[-0.06em]">
                {rollComplete
                  ? '완성된 한 롤'
                  : has25
                  ? `24장까지 ${filled24}/24`
                  : filled24 < 24
                  ? `${filled24}/24장 · 25번째는 다 채운 뒤`
                  : '25번째를 골라주세요'}
              </p>
            </div>
            {rollComplete ? (
              <CatPhotographer size={36} />
            ) : filled24 >= 24 && !has25 ? (
              <button
                type="button"
                onClick={() => setScreen('twentyFive')}
                className="rounded-full bg-[var(--ink)] px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                25번째 고르기 →
              </button>
            ) : null}
          </div>
          {/* 25칸 그리드 — 24개는 사진 채움 / 25번째는 별도 슬롯 */}
          <div className="mt-3 grid grid-cols-[repeat(12,1fr)_auto] items-center gap-[3px]">
            {Array.from({ length: 24 }).map((_, i) => {
              const filled = i < filled24;
              return (
                <span
                  key={i}
                  className={`aspect-square rounded-[2px] ${
                    filled
                      ? rollComplete ? 'bg-white' : 'bg-[var(--ink)]'
                      : rollComplete ? 'bg-white/20' : 'bg-[var(--surface-2)]'
                  }`}
                />
              );
            })}
            {/* 25번째 — 별도로 살짝 떨어진 칸 */}
            <span
              className={`ml-1 flex h-3 w-3 items-center justify-center rounded-full text-[8px] font-bold ${
                has25
                  ? rollComplete ? 'bg-[var(--accent)] text-white' : 'bg-[var(--accent)] text-white'
                  : 'border border-dashed border-[var(--border-strong)]'
              }`}
              title={has25 ? '25번째 결정됨' : '25번째 미정'}
            >
              {has25 ? '★' : ''}
            </span>
          </div>
        </section>
        )}

        {/* 일주일 뷰 — 블록별 거리 기반 투명도 (객체지향) */}
        {filmView === 'week' && (
        <section>
          <div
            ref={weekScrollerRef}
            className="relative h-[280px] overflow-x-hidden overflow-y-auto"
            style={{ scrollbarWidth: 'none', scrollSnapType: 'y proximity', scrollBehavior: 'smooth' }}
          >
            {/* 필름 스트립 — 행끼리 붙어 흐르듯 */}
            <div className="flex flex-col gap-[2px] py-[110px]">
              {weekDays.map((wd, i) => {
                const isToday = wd.date.toDateString() === todayStr;
                const todayIdx = weekDays.findIndex((w) => w.date.toDateString() === todayStr);
                const distance = Math.abs(i - (todayIdx >= 0 ? todayIdx : 7));
                const blockOpacity = isToday ? 1 : Math.max(0.22, 1 - distance * 0.14);
                return (
                  <div
                    key={wd.date.toISOString()}
                    data-today={isToday}
                    style={{ opacity: blockOpacity, scrollSnapAlign: 'center' }}
                    className={`flex w-full min-w-0 shrink-0 items-center gap-1.5 px-1 py-[3px] transition-opacity ${
                      isToday
                        ? 'rounded-[8px] bg-[var(--ink)] text-white shadow-[0_6px_18px_rgba(0,0,0,0.18)]'
                        : 'bg-[var(--surface)]'
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
                    {/* 사진 4컷 — 칸 사이 간격 0. 누르면 그날 사진들이 위아래 스크롤 zoom */}
                    <div className="grid min-w-0 flex-1 grid-cols-4 gap-0">
                      {[0,1,2,3].map((slot) => {
                        const art = wd.photos[slot];
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => art && openDayZoom(wd.photos, slot)}
                            disabled={!art}
                            className={`relative aspect-square overflow-hidden ${
                              art
                                ? ''
                                : isToday
                                ? 'border border-dashed border-white/15'
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
        )}

        {/* 월별 그리드 */}
        {filmView === 'month' && (
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
              const dayPhotos = day.artworkIds
                .map((id) => myWorks.find((a) => a.id === id))
                .filter(Boolean);
              const art = dayPhotos[0] || null;
              const count = dayPhotos.length;
              return (
                <button
                  key={day.day}
                  type="button"
                  onClick={() => count > 0 && openDayZoom(dayPhotos, 0)}
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
        )}

        {/* 날짜별 보기 — 월별 탭에 같이 (작품이 있을 때만) */}
        {filmView === 'month' && activeDays.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[22px] font-extrabold tracking-[-0.07em]">날짜별 보기</h2>
              <button type="button" onClick={() => setScreen('twentyFive')} className="text-xs text-[var(--text-muted)]">
                25번째 사진 고르기
              </button>
            </div>
            {activeDays.map((day) => (
              <FilmDayGrid
                key={day.day}
                year={year}
                month={month}
                day={day.day}
                artworkIds={day.artworkIds}
                works={myWorks}
                onOpenDay={openDayZoom}
              />
            ))}
          </section>
        )}

        {myWorks.length === 0 && (
          <EmptyState title="아직 필름이 비어있어요" hint="첫 사진을 올려보세요." onAction={() => setScreen('record')} actionLabel="사진 올리기" />
        )}
      </div>

      {zoomDay && (
        <PhotoZoomModal
          photos={zoomDay.photos}
          initialIndex={zoomDay.initialIndex}
          onClose={() => setZoomDay(null)}
        />
      )}
    </>
  );
}
function FilmDayGrid({ year, month, day, artworkIds, works, onOpenDay }) {
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
        {photos.slice(0, 6).map((art, i) => (
          <button
            key={art.id}
            type="button"
            onClick={() => onOpenDay(photos, i)}
            className="overflow-hidden rounded-[16px]"
          >
            <ImageBox src={art.imageUrl} alt={art.title} className="h-32" />
          </button>
        ))}
      </div>
    </section>
  );
}
