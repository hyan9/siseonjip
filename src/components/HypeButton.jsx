import { useState } from 'react';
import { useData } from '../lib/data-context';
import { toggleHype } from '../lib/db';

export default function HypeButton({ artwork, compact = false, large = false }) {
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

  if (large) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || !userId}
        aria-label="Hype"
        className={`flex w-full flex-col items-center justify-center gap-1 rounded-[18px] py-4 transition-transform active:scale-[0.98] disabled:opacity-50 ${
          hyped
            ? 'bg-[var(--ink)] text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)]'
            : 'border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]'
        }`}
      >
        <span className="text-[28px] leading-none">{hyped ? '🔥' : '↑'}</span>
        <span className="text-[11px] font-semibold tracking-[0.16em]">
          {hyped ? `HYPED · ${count}` : `추천 ${count}`}
        </span>
      </button>
    );
  }

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
