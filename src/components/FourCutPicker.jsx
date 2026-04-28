// 4컷 카드 만들기 전 — 페르소나(워터마크 마스코트) + 프레임 유형 선택 모달.
// 사용자 피드백: "버튼 누르면 바로 작동되는데 그 전에 카드 유형이나 냥이 페르소나 고르는 거 있으면 좋을듯"
import { useEffect, useRef, useState } from 'react';
import { PersonaCat, PERSONA_KEYS, PERSONA_VARIANTS } from './Mascot';
import { FOURCUT_FRAMES } from '../lib/share-card';

const FRAME_LABELS = {
  grid: { name: '2×2 그리드', desc: '클래식, 정사각형 4컷' },
  filmstrip: { name: '필름 스트립', desc: '4장이 세로로 길게' },
  mosaic: { name: '모자이크', desc: '큰 1장 + 작은 3장' },
};

function FrameThumbnail({ frame }) {
  if (frame === 'filmstrip') {
    return (
      <div className="flex h-full w-full flex-col gap-[3px] p-1.5">
        <div className="flex-1 rounded-[3px] bg-current opacity-70" />
        <div className="flex-1 rounded-[3px] bg-current opacity-70" />
        <div className="flex-1 rounded-[3px] bg-current opacity-70" />
        <div className="flex-1 rounded-[3px] bg-current opacity-70" />
      </div>
    );
  }
  if (frame === 'mosaic') {
    return (
      <div className="flex h-full w-full gap-1 p-1.5">
        <div className="flex-1 rounded-[3px] bg-current opacity-70" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex-1 rounded-[3px] bg-current opacity-70" />
          <div className="flex-1 rounded-[3px] bg-current opacity-70" />
          <div className="flex-1 rounded-[3px] bg-current opacity-70" />
        </div>
      </div>
    );
  }
  // grid
  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-1 p-1.5">
      <div className="rounded-[3px] bg-current opacity-70" />
      <div className="rounded-[3px] bg-current opacity-70" />
      <div className="rounded-[3px] bg-current opacity-70" />
      <div className="rounded-[3px] bg-current opacity-70" />
    </div>
  );
}

export default function FourCutPicker({ defaultPersona = 'paper', defaultFrame, onConfirm, onClose, busy = false }) {
  const [persona, setPersona] = useState(defaultPersona);
  const [frame, setFrame] = useState(defaultFrame || FOURCUT_FRAMES[0]);

  // ESC + 안드로이드 뒤로가기로 닫기
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.(); };
    const onPop = () => onCloseRef.current?.();
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);
    window.history.pushState({ kdnFourCutPicker: true }, '');
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
      document.body.style.overflow = prev;
      if (window.history.state?.kdnFourCutPicker) window.history.back();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-[420px] flex-col overflow-y-auto overscroll-contain rounded-t-[24px] bg-[var(--surface)] p-4 shadow-xl sm:max-h-[85vh] sm:rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 mt-1 h-1 w-10 rounded-full bg-[var(--border)] sm:hidden" />
        <h3 className="font-display text-[20px] font-extrabold tracking-[-0.04em]">4컷 카드 만들기</h3>
        <p className="mt-1 text-[12px] text-[var(--text-muted)]">프레임과 마스코트를 골라주세요.</p>

        {/* 프레임 */}
        <p className="mt-4 text-[10px] font-bold tracking-[0.18em] text-[var(--text-muted)]">프레임</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {FOURCUT_FRAMES.map((f) => {
            const meta = FRAME_LABELS[f];
            const active = f === frame;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFrame(f)}
                className={`flex flex-col items-center rounded-[14px] p-2 text-left transition ${
                  active ? 'bg-[var(--surface-2)] ring-2 ring-[var(--ink)]' : 'bg-[var(--surface-2)]/40 hover:bg-[var(--surface-2)]/60'
                }`}
              >
                <div className={`aspect-square w-full overflow-hidden rounded-[10px] bg-[var(--bg)] text-[var(--ink)]`}>
                  <FrameThumbnail frame={f} />
                </div>
                <span className="mt-1.5 text-[11px] font-bold leading-tight tracking-[-0.04em]">{meta.name}</span>
                <span className="text-[9.5px] leading-tight text-[var(--text-muted)]">{meta.desc}</span>
              </button>
            );
          })}
        </div>

        {/* 페르소나 */}
        <p className="mt-4 text-[10px] font-bold tracking-[0.18em] text-[var(--text-muted)]">워터마크 마스코트</p>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {PERSONA_KEYS.map((id) => {
            const v = PERSONA_VARIANTS[id];
            const active = id === persona;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPersona(id)}
                className={`flex flex-col items-center gap-1 rounded-[12px] p-1.5 transition ${
                  active ? 'bg-[var(--surface-2)] ring-2 ring-[var(--ink)]' : 'hover:bg-[var(--surface-2)]/60'
                }`}
              >
                <PersonaCat persona={id} size={42} />
                <span className={`text-[9.5px] font-bold tracking-[-0.04em] ${active ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                  {v.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-full border border-[var(--border-strong)] py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ persona, frame })}
            disabled={busy}
            className="flex-[1.4] rounded-full bg-[var(--ink)] py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? '만드는 중…' : '만들기'}
          </button>
        </div>
      </div>
    </div>
  );
}
