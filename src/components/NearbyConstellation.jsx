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
  const minR = 56; // 카든냥 반지름 24 + 사진 반지름 ~26. 안쪽까지 사진 배치
  const maxR = half - 46; // 사진 ~24 + 라벨 14 + 여유 8
  const minD = 50;
  // 사진들의 실제 최대 거리 기반 동적 mapping. 가까운 사진만 있으면 좁게, 먼 사진까지 있으면 넓게.
  const maxObserved = allItems.length > 0 ? allItems[allItems.length - 1].distance : 1000;
  const maxD = Math.max(maxObserved * 1.1, minD * 6);

  const radiusFor = (d) => {
    if (d <= minD) return minR;
    if (d >= maxD) return maxR;
    const t = Math.log(d / minD) / Math.log(maxD / minD);
    return minR + t * (maxR - minR);
  };

  // 거리 ring 단계 — 사진 분포에 맞춰 자동. 라벨 3개 (4개는 너무 많아 겹침).
  function pickRingDistances(maxDist) {
    if (maxDist < 200) return [50, 100, 200];
    if (maxDist < 500) return [100, 250, 500];
    if (maxDist < 1000) return [200, 500, 1000];
    if (maxDist < 3000) return [500, 1500, 3000];
    if (maxDist < 7000) return [1000, 3000, 7000];
    if (maxDist < 15000) return [2000, 7000, 15000];
    if (maxDist < 30000) return [5000, 15000, 30000];
    return [10000, 30000, 60000];
  }
  const ringDistances = pickRingDistances(maxObserved);

  // 별자리 각도 분산 — GPS 방위는 한쪽으로 몰릴 수 있어 시각적으로 별 같지 않음.
  // Golden angle(137.5°) 기반 sunflower-style 분산 — 자연스럽게 사방에 흩뿌려짐.
  // 거리(반지름)는 GPS 그대로, 방위만 인덱스 기반으로 분산.
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  // 시작 각도에 약간의 deterministic offset (center.lat 기반) — 매번 같은 패턴이지만
  // 사용자별로 약간 다른 회전. 정수 모듈러로 안정적
  const startAngle = ((Math.abs(Math.round((center?.lat ?? 0) * 1000)) % 360) / 360) * Math.PI * 2;
  const positioned = items.map((p, i) => {
    const r = radiusFor(p.distance);
    const bearing = startAngle + i * GOLDEN;
    const x = half + Math.sin(bearing) * r;
    const y = half - Math.cos(bearing) * r;
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

      {/* 거리 링 — 사진 거리 분포에 맞춘 동적 단계. 라벨은 ring별 다른 시계 각도에 분산 */}
      <svg width={size} height={size} className="pointer-events-none absolute inset-0">
        <g stroke="rgba(255,255,255,0.18)" fill="none" strokeDasharray="2 5">
          {ringDistances.map((d) => (
            <circle key={d} cx={half} cy={half} r={radiusFor(d)} />
          ))}
        </g>
        <g fill="rgba(255,255,255,0.55)" fontSize="9.5" fontWeight="600" letterSpacing="0.04em">
          {ringDistances.map((d, i) => {
            // 라벨 분산: ring별 다른 각도 (10시 / 1시 / 2시 / 11시 ...)
            const offsets = [-Math.PI * 0.65, -Math.PI * 0.32, -Math.PI * 1.4, -Math.PI * 0.18];
            const angle = offsets[i % offsets.length];
            const r = radiusFor(d) + 2;
            const lx = half + Math.sin(angle) * r;
            const ly = half - Math.cos(angle) * r - 4;
            // SVG text는 좌측 정렬 기본. 좌측 시계 각도면 우측 정렬, 우측이면 좌측 정렬
            const anchor = Math.sin(angle) < 0 ? 'end' : 'start';
            const dx = anchor === 'end' ? -3 : 3;
            return (
              <text key={d} x={lx + dx} y={ly} textAnchor={anchor}>
                {formatDistance(d)}
              </text>
            );
          })}
        </g>
      </svg>

      {/* 가운데 = 내 위치 (위치 핀 + 카든냥 발자국 단순 아이콘) */}
      <span
        className="pointer-events-none absolute z-10 rounded-full"
        style={{
          left: half - 42,
          top: half - 42,
          width: 84,
          height: 84,
          background: 'radial-gradient(circle, rgba(255,220,150,0.4) 0%, rgba(255,220,150,0) 70%)',
          animation: 'kadennyang-glow 3.2s ease-in-out infinite',
        }}
      />
      <div
        className="absolute z-20 flex items-center justify-center"
        style={{ left: half - 24, top: half - 24, width: 48, height: 48 }}
      >
        <MyLocationIcon size={48} />
      </div>

      {/* 주변 사진 — 별처럼 반짝임. 가까울수록 큰 동그라미 (실제 별이 가까울수록 밝고 크게 보이듯).
          크기 줄여 안쪽 공간에도 사진이 들어갈 수 있게. */}
      {positioned.map((p, i) => {
        // 거리에 따라 크기 차등 — 가까운 사진: 54px, 먼 사진(maxD+): 36px
        const photoSize = Math.round(54 - (p.distance / maxD) * 18);
        const safePhotoSize = Math.max(36, Math.min(54, photoSize));
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
