import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

export default function PhotoZoomModal({ photos, initialIndex = 0, onClose, autoplay: initialAutoplay = false }) {
  const [index, setIndex] = useState(initialIndex);
  const [autoplay, setAutoplay] = useState(initialAutoplay);
  const [idle, setIdle] = useState(false);
  const idleTimerRef = useRef(null);
  const touchRef = useRef(null);
  const swipedRef = useRef(false);
  const photo = photos[index];

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(photos.length - 1, i + 1));

  const wakeUp = () => {
    setIdle(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIdle(true), 2500);
  };

  useEffect(() => {
    wakeUp();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [index]);

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
      touchRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    } else {
      touchRef.current = null;
    }
  };

  const handleTouchEnd = (event) => {
    if (!touchRef.current) return;
    const dx = event.changedTouches[0].clientX - touchRef.current.x;
    const dy = event.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goPrev();
      else goNext();
      swipedRef.current = true;
      setTimeout(() => { swipedRef.current = false; }, 300);
    }
    touchRef.current = null;
  };

  const handleClick = () => {
    if (swipedRef.current) return;
    if (idle) wakeUp();
    else setIdle(true);
  };

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black text-white" onMouseMove={wakeUp}>
      <div
        className="absolute inset-0 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        style={{ touchAction: 'pinch-zoom' }}
      >
        <img
          src={photo.imageUrl}
          alt={photo.title || ''}
          className="max-h-full max-w-full select-none object-contain"
          draggable={false}
        />
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className={`absolute right-2 top-2 flex h-10 w-10 items-center justify-center text-white transition-opacity hover:opacity-100 ${idle ? 'opacity-30' : 'opacity-80'}`}
      >
        <Icon name="x" size={18} />
      </button>

      {index > 0 && (
        <button
          type="button"
          onClick={goPrev}
          aria-label="이전"
          className={`absolute left-1 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl font-light transition-opacity hover:opacity-100 sm:flex ${idle ? 'opacity-20' : 'opacity-60'}`}
        >
          ‹
        </button>
      )}
      {index < photos.length - 1 && (
        <button
          type="button"
          onClick={goNext}
          aria-label="다음"
          className={`absolute right-1 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-3xl font-light transition-opacity hover:opacity-100 sm:flex ${idle ? 'opacity-20' : 'opacity-60'}`}
        >
          ›
        </button>
      )}

      <div
        className={`pointer-events-none absolute left-4 top-4 text-[11px] font-medium tracking-wide text-white/70 transition-opacity ${idle ? 'opacity-0' : 'opacity-100'}`}
      >
        {index + 1} / {photos.length}
      </div>

      {photo.title && (
        <p
          className={`pointer-events-none absolute bottom-4 left-4 max-w-[60%] truncate text-[11px] font-medium text-white/70 transition-opacity ${idle ? 'opacity-0' : 'opacity-100'}`}
        >
          {photo.title}
        </p>
      )}

      <button
        type="button"
        onClick={() => setAutoplay((v) => !v)}
        title="슬라이드쇼 (스페이스)"
        className={`absolute bottom-3 right-3 text-[11px] font-medium text-white/70 transition-opacity hover:opacity-100 ${idle ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        {autoplay ? '⏸ 정지' : '▶ 슬라이드쇼'}
      </button>
    </div>
  );
}
