import { CatPhotographer } from './Mascot';
import { formatDistance } from '../lib/utils';
import { distanceMeters } from '../lib/geocoding';

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
  const maxR = half - 44; // 가장자리
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

  return (
    <div className="relative mx-auto select-none" style={{ width: size, height: size }}>
      {/* 거리 링 */}
      <svg width={size} height={size} className="absolute inset-0 pointer-events-none">
        <g stroke="var(--border)" fill="none" strokeDasharray="2 5">
          <circle cx={half} cy={half} r={radiusFor(500)} />
          <circle cx={half} cy={half} r={radiusFor(2000)} />
          <circle cx={half} cy={half} r={maxR} />
        </g>
        <g fill="var(--text-faint)" fontSize="9.5" fontWeight="600" letterSpacing="0.04em">
          <text x={half + 4} y={half - radiusFor(500) - 3}>500m</text>
          <text x={half + 4} y={half - radiusFor(2000) - 3}>2km</text>
          <text x={half + 4} y={half - maxR - 3}>5km+</text>
        </g>
      </svg>

      {/* 가운데 카든냥 = 내 위치 */}
      <div
        className="absolute z-20 flex items-center justify-center rounded-full bg-[var(--ink)] text-[var(--bg)] shadow-[0_6px_18px_rgba(0,0,0,0.18)]"
        style={{ left: half - 40, top: half - 40, width: 80, height: 80 }}
        aria-label="내 위치"
      >
        <CatPhotographer size={54} />
      </div>

      {/* 주변 사진 */}
      {positioned.map((p) => {
        const photoSize = 56;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onPhotoClick?.(p)}
            className="absolute z-10 flex flex-col items-center"
            style={{ left: p.x - photoSize / 2, top: p.y - photoSize / 2 }}
          >
            <div
              className="overflow-hidden rounded-full bg-[var(--surface-2)]"
              style={{
                width: photoSize,
                height: photoSize,
                boxShadow: '0 0 0 2px var(--bg), 0 4px 10px rgba(0,0,0,0.2)',
              }}
            >
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.label || ''}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="h-full w-full" />
              )}
            </div>
            <span className="mt-1 whitespace-nowrap rounded-full bg-[var(--ink)] px-1.5 py-[2px] text-[9px] font-bold leading-none text-[var(--bg)]">
              {formatDistance(p.distance)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
