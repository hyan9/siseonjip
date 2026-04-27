import { useEffect } from 'react';
import { useTheme } from '../lib/theme-context';

export default function SettingsSheet({ onClose, onMessages, onLogout, extraItems = [] }) {
  const { theme, setTheme } = useTheme();

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

  const isDark = theme === 'dark';

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
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex w-full items-center justify-between rounded-[14px] px-3 py-3 text-left hover:bg-[var(--surface-2)]"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
              {isDark ? '라이트 모드' : '다크 모드'}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">{isDark ? '환하게' : '어둡게'}</span>
          </button>

          <button
            type="button"
            onClick={onMessages}
            className="flex w-full items-center justify-between rounded-[14px] px-3 py-3 text-left hover:bg-[var(--surface-2)]"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <span className="text-lg">💬</span>
              메시지
            </span>
            <span className="text-[var(--text-faint)]">›</span>
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
                <span className="text-lg">{item.icon}</span>
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
              <span className="text-lg">🚪</span>
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
