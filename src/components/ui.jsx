// 공용 UI 프리미티브
import { useNotifications } from '../lib/notifications-context';
import { useTheme } from '../lib/theme-context';
import Icon from './Icon';

export function Shell({ children, screen, setScreen, showNav = true }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto min-h-screen max-w-[430px] bg-[var(--bg)]">
        <main className="min-h-[calc(100vh-70px)] px-4 pb-7 pt-4">{children}</main>
        {showNav && <BottomNav screen={screen} setScreen={setScreen} />}
      </div>
    </div>
  );
}

export function BottomNav({ screen, setScreen }) {
  const { unreadCount } = useNotifications();
  const tabs = [
    { id: 'home', label: '홈', icon: 'eye' },
    { id: 'space', label: '지도', icon: 'map' },
    { id: 'record', label: '기록', icon: 'plus', primary: true },
    { id: 'archive', label: '필름', icon: 'archive' },
    { id: 'profile', label: '내 전시', icon: 'user', dot: unreadCount > 0 },
  ];
  return (
    <nav className="sticky bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/95 px-3 py-2 backdrop-blur">
      <div className="grid grid-cols-5 items-end gap-1">
        {tabs.map((tab) => {
          const active = screen === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => setScreen(tab.id)} className="flex flex-col items-center gap-1 text-[11px]">
              <span className={`relative flex items-center justify-center rounded-full ${tab.primary ? 'h-11 w-11 bg-[var(--ink)] text-white' : active ? 'h-8 w-8 bg-[var(--surface-2)] text-[var(--text)]' : 'h-8 w-8 text-[var(--text-muted)]'}`}>
                <Icon name={tab.icon} size={tab.primary ? 20 : 17} />
                {tab.dot && (
                  <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-red-500" />
                )}
              </span>
              <span className={active ? 'font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function ToastStack() {
  const { toasts, dismissToast } = useNotifications();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-3">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismissToast(toast.id)}
          className="pointer-events-auto w-full max-w-[400px] rounded-[18px] bg-[var(--ink)] px-4 py-3 text-left text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition"
        >
          <p className="text-[13px] font-bold tracking-[-0.04em]">{toast.title}</p>
          {toast.body && <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-white/80">{toast.body}</p>}
        </button>
      ))}
    </div>
  );
}

export function Header({ title, subtitle, kicker = '시선집', onBack, right }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {onBack && <button type="button" onClick={onBack} className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]"><Icon name="back" size={18} /></button>}
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">{kicker}</p>
          <h1 className="text-[30px] font-extrabold leading-none tracking-[-0.08em]">{title}</h1>
          {subtitle && <p className="mt-3 max-w-[31ch] text-[14px] leading-6 text-[var(--text-muted)]">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}

export function ImageBox({ src, alt, className = '', fit = 'cover', priority = false }) {
  return (
    <div className={`overflow-hidden bg-[var(--image-bg)] ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt || ''}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
        />
      ) : null}
    </div>
  );
}

export function SearchBar({ query, setQuery, onFocus }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <Icon name="search" size={17} className="text-[var(--text-muted)]" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={onFocus} placeholder="사진, 사람, 위치 검색" className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-faint)]" />
    </div>
  );
}

export function GpsStatusBadge({ status, source }) {
  const baseLabel = {
    idle: '사진 선택 전',
    reading: '위치 정보 확인 중',
    found: source === 'manual' ? '내 위치로 설정됨' : '사진의 위치 정보 발견',
    empty: '사진에 위치 정보 없음',
    error: '위치 정보 확인 실패',
  }[status] || '위치 정보 없음';
  const dark = status === 'found' || status === 'reading';
  return <span className={`rounded-full px-3 py-1 text-[11px] ${dark ? 'bg-[var(--ink)]/85 text-white' : 'bg-white/90 text-[var(--text)]'}`}>{baseLabel}</span>;
}

export function EmptyState({ title, hint, onAction, actionLabel }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8 text-center">
      <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
      {hint && <p className="mt-2 whitespace-pre-line text-xs leading-5 text-[var(--text-muted)]">{hint}</p>}
      {onAction && (
        <button type="button" onClick={onAction} className="mt-4 rounded-full bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-white">
          {actionLabel || '시작하기'}
        </button>
      )}
    </div>
  );
}

export function Splash({ message = '불러오는 중…' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6 text-center text-sm text-[var(--text-muted)]">
      {message}
    </div>
  );
}

export function ThemeToggleButton() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]"
      title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
    </button>
  );
}

export function StatCell({ label, value }) {
  return (
    <div>
      <p className="text-[18px] font-extrabold tracking-[-0.04em] text-[var(--text)]">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold tracking-[0.08em] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

export function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.2 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.8-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C40.6 35.6 44 30.2 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
