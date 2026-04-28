import { formatDistance } from '../lib/utils';
import { distanceMeters } from '../lib/geocoding';
import { transformedPhotoUrl } from '../lib/db';

// 내 위치 상징 — 핀 + 카든냥 발자국. 톤: 시집 잉크 색, 별빛 위에서 깔끔히.
function MyLocationIcon({ size = 64 }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="내 위치"
    >
      {/* 외곽 글로우 */}
      <circle cx="32" cy="32" r="30" fill="rgba(255,255,255,0.06)" />
      {/* 위치 핀 본체 — 흰색 stroke */}
      <path
        d="M32 12 C 22 12, 16 19, 16 28 C 16 38, 32 52, 32 52 C 32 52, 48 38, 48 28 C 48 19, 42 12, 32 12 Z"
        fill="rgba(255,255,255,0.95)"
        stroke="rgba(255,220,150,0.6)"
        strokeWidth="1.5"
      />
      {/* 핀 안 — 카든냥 발자국 (단순화된 발 + 발가락 4개) */}
      <g fill="rgba(20,20,28,1)" transform="translate(32 28)">
        <ellipse cx="0" cy="3" rx="6.5" ry="5.5" />
        <ellipse cx="-7.5" cy="-5" rx="2.4" ry="3" />
        <ellipse cx="-3" cy="-9" rx="2.2" ry="2.8" />
        <ellipse cx="3" cy="-9" rx="2.2" ry="2.8" />
        <ellipse cx="7.5" cy="-5" rx="2.4" ry="3" />
      </g>
    </svg>
  );
}

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

  const allItems = points
    .map((p) => {
      const distance = distanceMeters(center.lat, center.lng, p.lat, p.lng);
      // 화면상 방위 (북쪽이 위). 동=오른쪽
      const dy = p.lat - center.lat; // 북이 +
      const dx = (p.lng - center.lng) * Math.cos((center.lat * Math.PI) / 180);
      const bearing = Math.atan2(dx, dy); // 북=0, 동=π/2
      return { ...p, distance, bearing };
    })
    .filter((p) => Number.isFinite(p.distance))
    .sort((a, b) => a.distance - b.distance);

  // 같은 구역 묶기 — 거리·방위가 비슷하면 첫 사진만 보여주고 "+N" 배지.
  // 사용자가 "다 보여줄 필요 없음. 깔끔히" 요청.
  const ANGLE_THRESHOLD = 0.26;   // ~15도
  const DISTANCE_RATIO = 0.25;    // 25% 이내 거리 차
  const groups = [];
  for (const it of allItems) {
    const found = groups.find((g) => {
      const angDiff = Math.abs(((it.bearing - g.bearing + Math.PI) % (2 * Math.PI)) - Math.PI);
      if (angDiff > ANGLE_THRESHOLD) return false;
      const distRatio = Math.abs(it.distance - g.distance) / Math.max(it.distance, g.distance, 100);
      return distRatio < DISTANCE_RATIO;
    });
    if (found) found.others.push(it);
    else groups.push({ ...it, others: [] });
  }
  const items = groups.slice(0, maxItems);

  const half = size / 2;
  const minR = 72; // 고양이 바로 옆
  // 라벨이 사진 아래로 빠져나오니 안전 여백 더 — 사진 28 + 라벨 14 + 여유 6 = 48
  const maxR = half - 50;
  const minD = 50;     // 50m 이내는 최소 반지름
  const maxD = 10000;  // 10km까지 분포. 5km/8km 사진이 다른 층으로 보이게

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

      {/* 거리 링 — 4층 (1km / 3km / 5km / 10km+) */}
      <svg width={size} height={size} className="pointer-events-none absolute inset-0">
        <g stroke="rgba(255,255,255,0.18)" fill="none" strokeDasharray="2 5">
          <circle cx={half} cy={half} r={radiusFor(1000)} />
          <circle cx={half} cy={half} r={radiusFor(3000)} />
          <circle cx={half} cy={half} r={radiusFor(5000)} />
          <circle cx={half} cy={half} r={maxR} />
        </g>
        <g fill="rgba(255,255,255,0.55)" fontSize="9.5" fontWeight="600" letterSpacing="0.04em">
          <text x={half + 4} y={half - radiusFor(1000) - 3}>1km</text>
          <text x={half + 4} y={half - radiusFor(3000) - 3}>3km</text>
          <text x={half + 4} y={half - radiusFor(5000) - 3}>5km</text>
          <text x={half + 4} y={half - maxR - 3}>10km+</text>
        </g>
      </svg>

      {/* 가운데 = 내 위치 (위치 핀 + 카든냥 발자국 단순 아이콘) */}
      <span
        className="pointer-events-none absolute z-10 rounded-full"
        style={{
          left: half - 50,
          top: half - 50,
          width: 100,
          height: 100,
          background: 'radial-gradient(circle, rgba(255,220,150,0.4) 0%, rgba(255,220,150,0) 70%)',
          animation: 'kadennyang-glow 3.2s ease-in-out infinite',
        }}
      />
      <div
        className="absolute z-20 flex items-center justify-center"
        style={{ left: half - 32, top: half - 32, width: 64, height: 64 }}
      >
        <MyLocationIcon size={64} />
      </div>

      {/* 주변 사진 — 별처럼 반짝임. 가까울수록 큰 동그라미 (실제 별이 가까울수록 밝고 크게 보이듯) */}
      {positioned.map((p, i) => {
        // 거리에 따라 크기 차등 — 가까운 사진(50m): 68px, 먼 사진(10km+): 40px
        const photoSize = Math.round(68 - (p.distance / maxD) * 28);
        const safePhotoSize = Math.max(40, Math.min(68, photoSize));
        const extraCount = p.others?.length || 0;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onPhotoClick?.(p)}
            className="absolute z-10 flex flex-col items-center"
            style={{ left: p.x - safePhotoSize / 2, top: p.y - safePhotoSize / 2 }}
          >
            <div
              className="relative overflow-hidden rounded-full bg-white/10"
              style={{
                width: safePhotoSize,
                height: safePhotoSize,
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
              {/* +N 배지 — 같은 구역에 사진 더 있을 때 (우측 상단) */}
              {extraCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 rounded-full bg-[var(--accent)] px-1.5 py-[1px] text-[9px] font-bold leading-none text-white shadow"
                  aria-label={`이 구역에 ${extraCount + 1}장`}
                >
                  +{extraCount}
                </span>
              )}
            </div>
            {/* 거리 라벨 — 사진 아래 (이전처럼 외부에. 사진 가리지 않음) */}
            <span className="mt-1 whitespace-nowrap rounded-full bg-white/95 px-1.5 py-[2px] text-[9px] font-bold leading-none text-[var(--ink)] shadow">
              {formatDistance(p.distance)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
