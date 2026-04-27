// PWA 설치 안내 — beforeinstallprompt 이벤트 잡고 SettingsSheet/홈에서 노출
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'kadennyang:install_dismissed';

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    // 이미 standalone 모드면 설치된 상태
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) {
      setInstalled(true);
      return undefined;
    }

    const onBefore = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return null;
    deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome; // 'accepted' | 'dismissed'
  };

  return { canInstall: !!deferred && !installed, installed, install };
}

// SettingsSheet에서 노출하는 한 줄 버튼
export function InstallButton({ onAfter }) {
  const { canInstall, installed, install } = useInstallPrompt();
  const [busy, setBusy] = useState(false);

  if (installed) {
    return (
      <div className="flex w-full items-center justify-between rounded-[14px] px-3 py-3 text-left text-[var(--text-muted)]">
        <span className="flex items-center gap-3 text-sm font-semibold">
          <span aria-hidden>✓</span>
          이미 홈 화면에 설치됨
        </span>
      </div>
    );
  }

  if (!canInstall) {
    // iOS Safari는 beforeinstallprompt 미지원 — 안내 문구만
    const isIOS = /iphone|ipad|ipod/i.test(typeof navigator !== 'undefined' ? navigator.userAgent : '');
    return (
      <div className="rounded-[14px] px-3 py-3 text-left">
        <p className="text-sm font-semibold">홈 화면에 설치</p>
        <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
          {isIOS
            ? 'Safari 하단 공유 버튼 → "홈 화면에 추가"'
            : '브라우저 주소창의 설치 아이콘을 누르거나, 메뉴에서 "앱 설치"를 선택하세요.'}
        </p>
      </div>
    );
  }

  const handleClick = async () => {
    setBusy(true);
    const outcome = await install();
    setBusy(false);
    if (outcome === 'dismissed') {
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch {
        // localStorage 사용 불가 (Safari private mode 등) — 무시
      }
    }
    if (onAfter) onAfter(outcome);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="flex w-full items-center justify-between rounded-[14px] bg-[var(--ink)] px-3 py-3 text-left text-white disabled:opacity-50"
    >
      <span className="text-sm font-bold">📱 홈 화면에 설치하기</span>
      <span className="text-[11px] opacity-80">{busy ? '…' : '한 번 누르면 끝'}</span>
    </button>
  );
}
