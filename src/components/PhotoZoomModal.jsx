import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { transformedPhotoUrl } from '../lib/db';

// 사진 캐러셀 — 위아래 스크롤 (오늘의 4컷을 한번에 감상)
// scroll-snap-y, 사진만 풀스크린
export default function PhotoZoomModal({ photos, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const scrollerRef = useRef(null);
  const photo = photos[index];

  // 초기 위치로 스크롤
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: initialIndex * el.clientHeight, behavior: 'instant' });
  }, [initialIndex]);

  // body 스크롤 잠금 + 모바일 back 버튼으로 모달만 닫히게 (앱 안 나가짐)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // history entry 추가 → back 누르면 popstate에서 모달 닫고 더 이상 전파 안 함
    let didPush = false;
    try {
      window.history.pushState({ kadennyangModal: true }, '', '');
      didPush = true;
    } catch {
      // 환경에 따라 실패 무시
    }
    const onPop = () => { onClose(); };
    window.addEventListener('popstate', onPop);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('popstate', onPop);
      // 모달이 코드로 닫혔을 때 history entry 제거
      if (didPush && window.history.state?.kadennyangModal) {
        try { window.history.back(); } catch {
          // 환경에 따라 실패 무시
        }
      }
    };
  }, [onClose]);

  // 키보드: Esc 닫기, 위아래 화살표 이동
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowUp') {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTo({ top: Math.max(0, (index - 1) * el.clientHeight), behavior: 'smooth' });
      } else if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTo({ top: Math.min((photos.length - 1) * el.clientHeight, (index + 1) * el.clientHeight), behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, index, photos.length]);

  // 스크롤 → 인덱스 동기화
  const handleScroll = (e) => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollTop / el.clientHeight);
    if (i !== index) setIndex(i);
  };

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-x-hidden overflow-y-auto"
        style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
      >
        {photos.map((p) => (
          <div
            key={p.id}
            className="flex h-screen w-full items-center justify-center"
            style={{ scrollSnapAlign: 'center' }}
          >
            <img
              src={transformedPhotoUrl(p.imageUrl, { width: 1600 })}
              alt={p.title || ''}
              className="max-h-full max-w-full select-none object-contain"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* 닫기 */}
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur-sm hover:bg-black/50"
      >
        <Icon name="x" size={16} />
      </button>

      {/* 인덱스 인디케이터 — 우측 세로 도트 */}
      {photos.length > 1 && (
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-1.5">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'h-4 bg-white' : 'h-1.5 w-1.5 bg-white/40'}`}
              style={{ width: 6 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
