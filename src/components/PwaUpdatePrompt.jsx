// PWA 새 버전 알림 — 새 service worker가 설치되면 토스트로 알리고,
// "업데이트" 누르면 SW가 즉시 활성화 + 페이지 리로드.
// vite.config.js의 registerType: 'prompt'와 짝.
import { useRegisterSW } from 'virtual:pwa-register/react';

const HOUR_MS = 60 * 60 * 1000;

export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // PWA를 며칠씩 켜놓은 사용자도 새 빌드 받을 수 있게 매시간 SW 갱신 체크
    onRegisteredSW(swUrl, r) {
      if (!r) return;
      setInterval(async () => {
        if (r.installing || !navigator) return;
        if ('connection' in navigator && !navigator.onLine) return;
        try {
          const resp = await fetch(swUrl, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } });
          if (resp?.status === 200) await r.update();
        } catch {
          // 오프라인 등 — 무시
        }
      }, HOUR_MS);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-[80] flex justify-center px-3">
      <div className="pointer-events-auto flex w-full max-w-[400px] items-center gap-3 rounded-[18px] bg-[var(--ink)] px-4 py-3 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
        <div className="flex-1">
          <p className="text-sm font-bold">새 버전이 있어요</p>
          <p className="text-[11px] text-white/70">업데이트하면 바로 적용됩니다</p>
        </div>
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[var(--ink)]"
        >
          업데이트
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          aria-label="나중에"
          className="text-white/60 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
