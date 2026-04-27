import { useState } from 'react';
import { useData } from '../lib/data-context';
import { toggleHype } from '../lib/db';

export default function HypeButton({ artwork, compact = false }) {
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
