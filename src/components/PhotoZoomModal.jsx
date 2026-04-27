import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

// 사진 캐러셀 — scroll-snap 기반 부드러운 좌우 스와이프
// 위/아래 바 없음, 사진만 풀스크린
export default function PhotoZoomModal({ photos, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const scrollerRef = useRef(null);
  const photo = photos[index];

  // 초기 위치로 스크롤
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: initialIndex * el.clientWidth, behavior: 'instant' });
  }, [initialIndex]);

  // body 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // 키보드: Esc 닫기, 좌우 화살표 이동
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTo({ left: Math.max(0, (index - 1) * el.clientWidth), behavior: 'smooth' });
      } else if (e.key === 'ArrowRight') {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTo({ left: Math.min((photos.length - 1) * el.clientWidth, (index + 1) * el.clientWidth), behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, index, photos.length]);

  // 스크롤 → 인덱스 동기화
  const handleScroll = (e) => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        <style>{`
          .siseonjip-zoom-scroller::-webkit-scrollbar { display: none; }
        `}</style>
        <div className="flex h-full">
          {photos.map((p) => (
            <div
              key={p.id}
              className="flex h-full w-full shrink-0 snap-center items-center justify-center"
              style={{ scrollSnapAlign: 'center' }}
            >
              <img
                src={p.imageUrl}
                alt={p.title || ''}
                className="max-h-full max-w-full select-none object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur-sm hover:bg-black/50"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
