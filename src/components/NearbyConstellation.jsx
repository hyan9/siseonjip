import { CatStarlit } from './Mascot';
import { formatDistance } from '../lib/utils';
import { distanceMeters } from '../lib/geocoding';
import { transformedPhotoUrl } from '../lib/db';

// 내 위치 = 가운데 카든냥, 주변 = 사진들. 지도 대신 별자리.
// 거리는 로그 스케일로 반지름에 매핑, 방위는 그대로.
export default function NearbyConstellation({
  center,
  points,
  onPhotoClick,
  size = 340,
  maxItems = 10,
}) {
  if (!center || !points?.length) return null;

  const items = points
    .map((p) => {
      const distance = distanceMeters(center.lat, center.lng, p.lat, p.lng);
      // 화면상 방위 (북쪽이 위). 동=오른쪽
      const dy = p.lat - center.lat; // 북이 +
      const dx = (p.lng - center.lng) * Math.cos((center.lat * Math.PI) / 180);
      const bearing = Math.atan2(dx, dy); // 북=0, 동=π/2
      return { ...p, distance, bearing };
    })
    .filter((p) => Number.isFinite(p.distance))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxItems);

  const half = size / 2;
  const minR = 72; // 고양이 바로 옆
  const maxR = half - 36; // 사진 28px + 안전 8px (라벨이 사진 안쪽으로 옮겨져서 더 가능)
  const minD = 50; // 50m 이내는 최소 반지름
  const maxD = 5000; // 5km 이상은 최대 반지름

  const radiusFor = (d) => {
    if (d <= minD) return minR;
    if (d >= maxD) return maxR;
    const t = Math.log(d / minD) / Math.log(maxD / minD);
    return minR + t * (maxR - minR);
  };

  // 겹침 회피 — 각도가 너무 가까운 형제는 살짝 비껴
  const placed = [];
  const positioned = items.map((p, i) => {
    let r = radiusFor(p.distance);
    let bearing = p.bearing;
    // 각거리 ≤ 0.35rad (≈20°) & 반지름 차 ≤ 30px이면 약간 회전
    for (const q of placed) {
      const angDiff = Math.abs(((bearing - q.bearing + Math.PI) % (2 * Math.PI)) - Math.PI);
      if (angDiff < 0.35 && Math.abs(r - q.r) < 30) {
        bearing += (i % 2 === 0 ? 1 : -1) * 0.45;
        r = Math.min(maxR, r + 14);
      }
    }
    const x = half + Math.sin(bearing) * r;
    const y = half - Math.cos(bearing) * r;
    placed.push({ bearing, r });
    return { ...p, x, y };
  });

  // 별 흩뿌림 — 배경 장식 (deterministic 위치)
  const stars = [
    [size * 0.10, size * 0.18, 1.4, 0.7, '0s'],
    [size * 0.86, size * 0.12, 2, 0.85, '0.4s'],
    [size * 0.92, size * 0.40, 1.2, 0.6, '0.8s'],
    [size * 0.06, size * 0.55, 1.8, 0.7, '1.2s'],
    [size * 0.18, size * 0.88, 1.4, 0.6, '1.6s'],
    [size * 0.78, size * 0.92, 1.6, 0.7, '2.0s'],
    [size * 0.95, size * 0.78, 1.1, 0.5, '0.6s'],
    [size * 0.04, size * 0.30, 1.3, 0.6, '1.4s'],
  ];

  return (
    <div
      className="relative mx-auto select-none overflow-hidden rounded-[24px]"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 50% 35%, #232a3e 0%, #161927 55%, #0a0c14 100%)',
      }}
    >
      <style>{`
        @keyframes kadennyang-twinkle {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes kadennyang-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.08); }
        }
        @keyframes kadennyang-photo-glow {
          0%, 100% { box-shadow: 0 0 0 2px rgba(255,255,255,0.85), 0 0 12px rgba(255,220,150,0.18); }
          50% { box-shadow: 0 0 0 2px rgba(255,255,255,0.95), 0 0 22px rgba(255,220,150,0.45); }
        }
      `}</style>

      {/* 별 흩뿌림 */}
      {stars.map(([sx, sy, sr, opacity, delay], i) => (
        <span
          key={i}
          className="pointer-events-none absolute rounded-full bg-white"
          style={{
            left: sx - sr,
            top: sy - sr,
            width: sr * 2,
            height: sr * 2,
            opacity,
            animation: `kadennyang-twinkle 3.6s ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      ))}

      {/* 거리 링 */}
      <svg width={size} height={size} className="pointer-events-none absolute inset-0">
        <g stroke="rgba(255,255,255,0.18)" fill="none" strokeDasharray="2 5">
          <circle cx={half} cy={half} r={radiusFor(500)} />
          <circle cx={half} cy={half} r={radiusFor(2000)} />
          <circle cx={half} cy={half} r={maxR} />
        </g>
        <g fill="rgba(255,255,255,0.55)" fontSize="9.5" fontWeight="600" letterSpacing="0.04em">
          <text x={half + 4} y={half - radiusFor(500) - 3}>500m</text>
          <text x={half + 4} y={half - radiusFor(2000) - 3}>2km</text>
          <text x={half + 4} y={half - maxR - 3}>5km+</text>
        </g>
      </svg>

      {/* 가운데 카든냥 = 내 위치 — 글로우 펄스 */}
      <span
        className="pointer-events-none absolute z-10 rounded-full"
        style={{
          left: half - 60,
          top: half - 60,
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, rgba(255,220,150,0.45) 0%, rgba(255,220,150,0) 70%)',
          animation: 'kadennyang-glow 3.2s ease-in-out infinite',
        }}
      />
      <div
        className="absolute z-20 flex items-center justify-center"
        style={{ left: half - 50, top: half - 50, width: 100, height: 100 }}
        aria-label="내 위치"
      >
        <CatStarlit size={100} />
      </div>

      {/* 주변 사진 — 별처럼 반짝임. 거리 라벨은 사진 우측 하단 배지 (이웃 사진과 안 겹침) */}
      {positioned.map((p, i) => {
        const photoSize = 56;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onPhotoClick?.(p)}
            className="absolute z-10"
            style={{ left: p.x - photoSize / 2, top: p.y - photoSize / 2 }}
          >
            <div
              className="relative overflow-hidden rounded-full bg-white/10"
              style={{
                width: photoSize,
                height: photoSize,
                animation: `kadennyang-photo-glow ${3.2 + (i % 4) * 0.4}s ease-in-out infinite`,
                animationDelay: `${(i * 0.3) % 1.6}s`,
              }}
            >
              {p.imageUrl ? (
                <img
                  src={transformedPhotoUrl(p.imageUrl, { width: 160 })}
                  alt={p.label || ''}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="h-full w-full" />
              )}
              {/* 거리 배지 — 사진 우측 하단에 겹쳐서. 이웃 사진에 가려질 일 없음 */}
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/85 px-1.5 py-[1px] text-[9px] font-bold leading-none text-white shadow">
                {formatDistance(p.distance)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
