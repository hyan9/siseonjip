import { useMemo } from 'react';
import { useData } from '../lib/data-context';
import {
  Header,
  ImageBox,
  EmptyState,
  Splash,
} from '../components/ui';


import {
  timeAgo,
} from '../lib/utils';







export default function ActivityScreen({ setScreen, openArtwork, openPerson }) {
  const { userId, getMyActivity, getProfile, getArtwork, getUserArtworks, getHypeCount } = useData();
  const items = getMyActivity(80);

  // 최근 14일 일별 통계 — 활동 적은 사용자도 잘 보이는 기간
  const dailyStats = useMemo(() => {
    if (!userId) return [];
    const works = getUserArtworks(userId);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const buckets = [];
    for (let i = 13; i >= 0; i--) {
      const start = today.getTime() - i * 86400000;
      const end = start + 86400000;
      const d = new Date(start);
      const dayArts = works.filter((a) => {
        const t = new Date(a.created_at).getTime();
        return t >= start && t < end;
      });
      const hype = dayArts.reduce((sum, a) => sum + getHypeCount(a.id), 0);
      buckets.push({
        date: d,
        day: d.getDate(),
        weekday: ['일', '월', '화', '수', '목', '금', '토'][d.getDay()],
        photos: dayArts.length,
        hype,
        isToday: i === 0,
      });
    }
    return buckets;
  }, [userId, getUserArtworks, getHypeCount]);

  // 시간대 통계 — 0~23시 어느 시간대에 셔터를 누르나
  const hourlyStats = useMemo(() => {
    if (!userId) return Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    const works = getUserArtworks(userId);
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    for (const a of works) {
      const h = new Date(a.created_at).getHours();
      buckets[h].count += 1;
    }
    return buckets;
  }, [userId, getUserArtworks]);

  const maxDailyPhotos = Math.max(1, ...dailyStats.map((m) => m.photos));
  const maxDailyHype = Math.max(1, ...dailyStats.map((m) => m.hype));
  const maxHourly = Math.max(1, ...hourlyStats.map((h) => h.count));
  const totalPhotos = dailyStats.reduce((s, d) => s + d.photos, 0);
  const peakHour = hourlyStats.reduce((best, h) => h.count > best.count ? h : best, hourlyStats[0]);

  if (!userId) return <Splash />;

  const labelFor = (item) => {
    switch (item.kind) {
      case 'hype': return '🔥 Hype';
      case 'comment': return '💬 댓글';
      case 'reply': return '↳ 답글';
      case 'comment_reaction': return '❤ 댓글 좋아요';
      case 'save': return '🔖 저장';
      case 'follow': return '👋 팔로우';
      default: return '활동';
    }
  };

  return (
    <>
      <Header
        title="내 활동"
        subtitle="내가 남긴 흔적을 시간순으로 모아봅니다."
        kicker="활동"
        onBack={() => setScreen('profile')}
      />

      {/* 최근 14일 일별 그래프 */}
      <section className="mb-3 rounded-[20px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">최근 2주</p>
          <span className="text-[10px] text-[var(--text-faint)]">{totalPhotos}장</span>
        </div>
        <h2 className="font-display mt-1 text-[18px] font-extrabold tracking-[-0.06em]">일별 셔터</h2>
        <div className="mt-4 flex items-end justify-between gap-1">
          {dailyStats.map((d, i) => {
            const photoH = d.photos > 0 ? Math.max(8, (d.photos / maxDailyPhotos) * 56) : 2;
            const hypeH = d.hype > 0 ? Math.max(4, (d.hype / maxDailyHype) * 28) : 0;
            return (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div className="flex h-[64px] w-full items-end justify-center">
                  <div className="flex w-full flex-col-reverse items-center gap-px">
                    <div
                      className={`w-full rounded-t ${d.isToday ? 'bg-[var(--accent)]' : 'bg-[var(--ink)]'}`}
                      style={{
                        height: `${photoH}px`,
                        opacity: d.photos > 0 ? 1 : 0.18,
                      }}
                      title={`${d.day}일 · 사진 ${d.photos}장`}
                    />
                    {hypeH > 0 && (
                      <div
                        className="w-full bg-orange-400"
                        style={{ height: `${hypeH}px` }}
                        title={`🔥 ${d.hype}`}
                      />
                    )}
                  </div>
                </div>
                <span className={`text-[8px] ${d.isToday ? 'font-bold text-[var(--accent)]' : 'text-[var(--text-faint)]'}`}>
                  {d.weekday}
                </span>
                <span className={`text-[9px] font-semibold ${d.isToday ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-[var(--ink)]" /> 사진</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-orange-400" /> 받은 🔥</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-[var(--accent)]" /> 오늘</span>
        </div>
      </section>

      {/* 시간대별 — 어느 시간에 셔터를 누르나 */}
      <section className="mb-5 rounded-[20px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">시간대</p>
          {peakHour.count > 0 && (
            <span className="text-[10px] text-[var(--text-faint)]">
              주로 <strong className="text-[var(--text)]">{peakHour.hour}시</strong>
            </span>
          )}
        </div>
        <h2 className="font-display mt-1 text-[18px] font-extrabold tracking-[-0.06em]">언제 셔터를 누르나</h2>
        <div className="mt-4 flex items-end justify-between gap-px">
          {hourlyStats.map((h, i) => {
            const barH = h.count > 0 ? Math.max(3, (h.count / maxHourly) * 48) : 2;
            return (
              <div
                key={i}
                className="group relative flex min-w-0 flex-1 flex-col items-center"
                title={`${h.hour}시 · ${h.count}장`}
              >
                <div className="flex h-[52px] w-full items-end">
                  <div
                    className="w-full rounded-t bg-[var(--ink)]"
                    style={{
                      height: `${barH}px`,
                      opacity: h.count > 0 ? 1 : 0.12,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[8px] text-[var(--text-faint)]">
          <span>0시</span>
          <span>6시</span>
          <span>12시</span>
          <span>18시</span>
          <span>24시</span>
        </div>
      </section>

      {items.length === 0 ? (
        <EmptyState title="아직 활동이 없어요" hint="다른 사람 사진에 🔥/💬/🔖 남겨보세요." />
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const art = item.artwork_id ? getArtwork(item.artwork_id) : null;
            const target = item.followee_id ? getProfile(item.followee_id) : null;
            const onClick = () => {
              if (art) openArtwork(art.id);
              else if (target) openPerson(target.id);
            };
            return (
              <button
                key={`${item.kind}-${item.created_at}-${index}`}
                type="button"
                onClick={onClick}
                className="flex w-full items-center gap-3 rounded-[18px] bg-[var(--surface)] p-3 text-left shadow-[0_0_0_1px_var(--border)]"
              >
                {art ? (
                  <ImageBox src={art.imageUrl} alt={art.title} className="h-12 w-12 shrink-0 rounded-[10px]" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-2)] text-lg">
                    {labelFor(item).slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-[-0.04em]">{labelFor(item)}</p>
                  {art?.title && <p className="truncate text-[11px] text-[var(--text-muted)]">{art.title}</p>}
                  {target && <p className="truncate text-[11px] text-[var(--text-muted)]">{target.nickname}</p>}
                  {item.text && <p className="truncate text-[11px] text-[var(--text-muted)]">"{item.text}"</p>}
                  <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">{timeAgo(item.created_at)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
