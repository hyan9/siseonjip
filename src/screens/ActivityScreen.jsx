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

  // 월별 통계 (최근 6개월)
  const monthlyStats = useMemo(() => {
    if (!userId) return [];
    const works = getUserArtworks(userId);
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthArts = works.filter((a) => {
        const t = new Date(a.created_at).getTime();
        return t >= d.getTime() && t < next.getTime();
      });
      const hype = monthArts.reduce((sum, a) => sum + getHypeCount(a.id), 0);
      buckets.push({
        label: `${d.getMonth() + 1}월`,
        photos: monthArts.length,
        hype,
      });
    }
    return buckets;
  }, [userId, getUserArtworks, getHypeCount]);

  const maxPhotos = Math.max(1, ...monthlyStats.map((m) => m.photos));
  const maxHype = Math.max(1, ...monthlyStats.map((m) => m.hype));

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

      <section className="mb-5 rounded-[20px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">최근 6개월</p>
        <h2 className="mt-1 text-[18px] font-extrabold tracking-[-0.06em]">월별 업로드 · 받은 추천</h2>
        <div className="mt-4 grid grid-cols-6 gap-2">
          {monthlyStats.map((m) => (
            <div key={m.label} className="flex flex-col items-center gap-1">
              <div className="flex h-[72px] w-full items-end justify-center gap-0.5">
                <div
                  className="w-2.5 rounded-t bg-[var(--ink)]"
                  style={{ height: `${(m.photos / maxPhotos) * 100}%`, minHeight: m.photos > 0 ? '6px' : '0' }}
                  title={`${m.photos}장`}
                />
                <div
                  className="w-2.5 rounded-t bg-orange-400"
                  style={{ height: `${(m.hype / maxHype) * 100}%`, minHeight: m.hype > 0 ? '6px' : '0' }}
                  title={`🔥 ${m.hype}`}
                />
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">{m.label}</span>
              <span className="text-[10px] font-semibold">{m.photos}/{m.hype}🔥</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-[var(--ink)]" /> 사진 업로드</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-orange-400" /> 받은 🔥</span>
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
