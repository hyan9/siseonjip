import { useEffect } from 'react';
import { useTheme } from '../lib/theme-context';
import { IconMessage, IconLogout, IconShare } from './icons/AppIcons';

async function inviteFriend() {
  const url = (typeof window !== 'undefined' && window.location.origin) || 'https://kadennyang.app';
  const text = '카든냥 — 카메라 든 냥이의 하루 네 장. 너도 와서 셔터 눌러봐.';
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: '카든냥', text, url });
      return;
    } catch {
      // 사용자가 취소했으면 그대로 넘어감
      return;
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      alert('초대 링크를 복사했어요. 친구에게 붙여넣기로 보내세요.');
      return;
    } catch {
      // fallthrough
    }
  }
  alert(`초대 링크: ${url}`);
}

export default function SettingsSheet({ onClose, onMessages, onLogout, extraItems = [] }) {
  const { theme, setTheme, themes } = useTheme();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[400px] rounded-t-[24px] bg-[var(--surface)] p-2 shadow-xl sm:rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 mt-2 h-1 w-10 rounded-full bg-[var(--border)] sm:hidden" />
        <div className="space-y-1 p-2">
          {/* 카든냥 테마 picker — 5개 고양이 모티브 */}
          <div className="rounded-[14px] px-3 py-3">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-[12px] font-bold tracking-[-0.04em]">털 색깔</p>
              <p className="text-[10px] text-[var(--text-muted)]">테마</p>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {themes.map((t) => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    title={`${t.label} — ${t.hint}`}
                    className={`flex flex-col items-center gap-1 rounded-[10px] p-1.5 transition ${
                      active ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]/60'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ${
                        active ? 'ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--surface)]' : ''
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${t.swatch[0]} 0% 50%, ${t.swatch[1]} 50% 100%)`,
                      }}
                    >
                      <span
                        className="block h-3 w-3 rounded-full"
                        style={{ background: t.swatch[2] }}
                      />
                    </span>
                    <span className={`text-[10px] font-bold tracking-[-0.04em] ${active ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] leading-4 text-[var(--text-faint)]">
              {themes.find((t) => t.id === theme)?.hint || ''}
            </p>
          </div>

          <hr className="my-1 border-[var(--border)]" />

          <button
            type="button"
            onClick={onMessages}
            className="flex w-full items-center justify-between rounded-[14px] px-3 py-3 text-left hover:bg-[var(--surface-2)]"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <IconMessage size={18} />
              메시지
            </span>
            <span className="text-[var(--text-faint)]">›</span>
          </button>

          <button
            type="button"
            onClick={inviteFriend}
            className="flex w-full items-center justify-between rounded-[14px] px-3 py-3 text-left hover:bg-[var(--surface-2)]"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <IconShare size={18} />
              친구 초대
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">링크 공유</span>
          </button>

          {extraItems.length > 0 && <hr className="my-1 border-[var(--border)]" />}
          {extraItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              disabled={item.busy}
              className="flex w-full items-center justify-between rounded-[14px] px-3 py-3 text-left hover:bg-[var(--surface-2)] disabled:opacity-50"
            >
              <span className="flex items-center gap-3 text-sm font-semibold">
                {item.iconNode || <span className="text-base">{item.icon}</span>}
                {item.busy ? '만드는 중…' : item.label}
              </span>
              <span className="text-[var(--text-faint)]">›</span>
            </button>
          ))}

          <hr className="my-1 border-[var(--border)]" />

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-between rounded-[14px] px-3 py-3 text-left text-red-600 hover:bg-red-50"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <IconLogout size={18} />
              로그아웃
            </span>
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="m-2 mt-1 w-[calc(100%-1rem)] rounded-full border border-[var(--border-strong)] py-2.5 text-sm font-semibold"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
