import { useState } from 'react';
import { useData } from '../lib/data-context';
import {
  Header,
  ImageBox,
  EmptyState,
} from '../components/ui';
import { CatStarlit } from '../components/Mascot';
import {
  setTwentyFive,
} from '../lib/db';









export default function TwentyFiveScreen({ setScreen }) {
  const { userId, getUserArtworks, refresh } = useData();
  const works = getUserArtworks(userId);
  const current = works.find((a) => a.is_twenty_five);
  const [selectedId, setSelectedId] = useState(current?.id || works[0]?.id || null);
  const [busy, setBusy] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const selected = works.find((a) => a.id === selectedId);

  const handleSave = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await setTwentyFive(userId, selectedId);
      await refresh();
      // 마스코트가 등장하는 짧은 축하 모먼트
      setCelebrating(true);
      setTimeout(() => {
        setCelebrating(false);
        setScreen('archive');
      }, 1600);
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
          {/* 월터 인용 — 의례감 부여 */}
          <section className="rounded-[18px] border-l-2 border-[var(--accent)] bg-[var(--surface-2)] px-4 py-3.5">
            <p className="font-display text-[13px] italic leading-[1.65] text-[var(--text-body)]">
              "The most beautiful things… don't need to be captured."
            </p>
            <p className="mt-1.5 text-[10px] font-semibold tracking-[0.16em] text-[var(--text-faint)]">
              SEAN O'CONNELL · 월터의 상상은 현실이 된다
            </p>
          </section>

          {/* 선택된 한 장 — ★ 라벨로 의례감 */}
          {selected && (
            <div className="relative">
              <ImageBox src={selected.imageUrl} alt={selected.title} className="h-[420px] rounded-[26px]" />
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 backdrop-blur-sm">
                <span className="text-[12px] text-[var(--accent)]">★</span>
                <span className="font-display text-[11px] italic text-white">그 한 장</span>
              </div>
            </div>
          )}

          <p className="px-1 text-[11px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">
            한 롤의 24장 — 그중 한 장만
          </p>
          <div className="grid grid-cols-4 gap-2">
            {works.slice(0, 16).map((art, i) => {
              const isSelected = selectedId === art.id;
              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => setSelectedId(art.id)}
                  className={`relative overflow-hidden rounded-[14px] transition ${
                    isSelected ? 'ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--bg)]' : ''
                  }`}
                >
                  <ImageBox src={art.imageUrl} alt={art.title} className="aspect-square" />
                  <span className="font-display absolute bottom-1 right-1.5 text-[11px] font-black italic leading-none text-white/85 mix-blend-difference">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !selectedId}
            className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-extrabold tracking-[-0.04em] text-white disabled:opacity-50"
          >
            {busy ? '한 롤을 봉인하는 중…' : '이 한 장으로 결정 →'}
          </button>
        </div>
      )}

      {celebrating && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="relative w-full max-w-[340px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1f2436] via-[#191b2a] to-[#0d0e16] px-7 py-8 text-center text-white shadow-[0_24px_48px_rgba(0,0,0,0.45)]">
            <div className="flex justify-center">
              <CatStarlit size={140} />
            </div>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
              25번째 사진 결정
            </p>
            <h3 className="font-display mt-2 text-[22px] font-extrabold tracking-[-0.06em]">
              한 롤이 완성됐어요
            </h3>
            <p className="font-display mt-3 text-[12px] italic leading-[1.7] text-white/85">
              "정말 아름다운 순간은<br />카메라 뒤에 머무르지 않는 거야."
            </p>
            <p className="mt-4 text-[11px] leading-[1.7] text-white/70">
              이 한 장이 당신의 프로필이 됩니다.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
