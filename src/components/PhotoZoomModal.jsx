import { useEffect, useState } from 'react';
import Icon from './Icon';

export default function PhotoZoomModal({ photos, initialIndex = 0, onClose, autoplay: initialAutoplay = false }) {
  const [index, setIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(null);
  const [autoplay, setAutoplay] = useState(initialAutoplay);
  const photo = photos[index];

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(photos.length - 1, i + 1));

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') goPrev();
      else if (event.key === 'ArrowRight') goNext();
      else if (event.key === ' ') {
        event.preventDefault();
        setAutoplay((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!autoplay) return undefined;
    const timer = setInterval(() => {
      setIndex((i) => {
        if (i >= photos.length - 1) {
          setAutoplay(false);
          return i;
        }
        return i + 1;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [autoplay, photos.length]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleTouchStart = (event) => {
    if (event.touches.length === 1) {
      setTouchStart({ x: event.touches[0].clientX, y: event.touches[0].clientY });
    } else {
      setTouchStart(null);
    }
  };

  const handleTouchEnd = (event) => {
    if (!touchStart) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goPrev();
      else goNext();
    }
    setTouchStart(null);
  };

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-xs text-white/70">{index + 1} / {photos.length}</p>
          <p className="mt-0.5 text-sm font-semibold tracking-[-0.04em]">{photo.title || '제목 없음'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoplay((v) => !v)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${autoplay ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
            title="슬라이드쇼 (스페이스)"
          >
            {autoplay ? '⏸ 정지' : '▶ 슬라이드쇼'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
            aria-label="닫기"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-auto"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'pinch-zoom' }}
      >
        <img
          src={photo.imageUrl}
          alt={photo.title || ''}
          className="block min-h-full w-full max-w-none object-contain"
          draggable={false}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold disabled:opacity-30"
        >
          ← 이전
        </button>
        <p className="text-xs text-white/70">스와이프 또는 ←/→</p>
        <button
          type="button"
          onClick={goNext}
          disabled={index === photos.length - 1}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold disabled:opacity-30"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
