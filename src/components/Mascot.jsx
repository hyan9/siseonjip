// 시선집 마스코트 — 사진 찍는 고양이 (시선집 자아)
// currentColor 기반이라 light/dark 자동 반응

const SPIN_KEYFRAMES = `
@keyframes siseonjip-spin { to { transform: rotate(360deg); } }
@keyframes siseonjip-tail-wag { 0%,100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
@keyframes siseonjip-blink { 0%, 92%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
`;

// 카메라를 들고 셔터를 누르려는 고양이 — 메인 마스코트
export function CatPhotographer({ size = 100, animate = false, className = '' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="사진 찍는 고양이"
      className={className}
    >
      <style>{SPIN_KEYFRAMES}</style>
      {/* 꼬리 */}
      <g style={animate ? { transformOrigin: '60px 105px', animation: 'siseonjip-tail-wag 1.8s ease-in-out infinite' } : undefined}>
        <path d="M 86 100 Q 102 88 96 72" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none"/>
      </g>
      {/* 몸 */}
      <ellipse cx="60" cy="92" rx="32" ry="20" fill="currentColor"/>
      {/* 발 */}
      <ellipse cx="46" cy="108" rx="5" ry="3" fill="currentColor"/>
      <ellipse cx="74" cy="108" rx="5" ry="3" fill="currentColor"/>
      {/* 머리 */}
      <circle cx="60" cy="48" r="30" fill="currentColor"/>
      {/* 귀 */}
      <path d="M 36 36 L 40 18 L 52 32 Z" fill="currentColor"/>
      <path d="M 84 36 L 80 18 L 68 32 Z" fill="currentColor"/>
      {/* 귀 안쪽 (밝은 면) */}
      <path d="M 41 30 L 43 22 L 48 30 Z" fill="var(--bg)" opacity="0.9"/>
      <path d="M 79 30 L 77 22 L 72 30 Z" fill="var(--bg)" opacity="0.9"/>

      {/* 카메라 — 머리 앞 */}
      <rect x="32" y="40" width="56" height="26" rx="3" fill="var(--bg)" stroke="currentColor" strokeWidth="2.5"/>
      {/* 카메라 상단 셔터 */}
      <rect x="46" y="34" width="14" height="6" rx="1" fill="var(--bg)" stroke="currentColor" strokeWidth="2"/>
      <circle cx="76" cy="38" r="2.5" fill="currentColor"/>
      {/* 렌즈 — 회전 가능 */}
      <g style={animate ? { transformOrigin: '60px 53px', animation: 'siseonjip-spin 1.8s linear infinite' } : undefined}>
        <circle cx="60" cy="53" r="11" fill="currentColor" stroke="var(--bg)" strokeWidth="2"/>
        <circle cx="60" cy="53" r="7" fill="var(--bg)"/>
        <circle cx="60" cy="53" r="3" fill="currentColor"/>
        {/* 셔터 날개 표시 */}
        <line x1="60" y1="46" x2="60" y2="48" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="60" y1="58" x2="60" y2="60" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="53" y1="53" x2="55" y2="53" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="65" y1="53" x2="67" y2="53" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
      {/* 입 (카메라 아래 살짝 보임) */}
      <path d="M 56 72 Q 60 75 64 72" stroke="var(--bg)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* 수염 */}
      <line x1="20" y1="56" x2="32" y2="58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="62" x2="32" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="100" y1="58" x2="88" y2="58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="100" y1="62" x2="88" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// 카메라 옆에 잠든 고양이 + 떨어진 폴라로이드 4장 — 4장 채움 안내용
// 정면 얼굴 + 뾰족 귀 + 수염 명확 — 사진가 고양이가 하루를 마치고 잠든 모습
export function CatSleepyFour({ size = 220 }) {
  return (
    <svg
      viewBox="0 0 260 220"
      width={size}
      height={(size * 220) / 260}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="필름 4장을 다 쓰고 잠든 사진가 고양이"
    >
      {/* 떨어진 폴라로이드 4장 */}
      <g>
        <g transform="translate(16 18) rotate(-14)">
          <rect width="40" height="48" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="4" y="4" width="32" height="30" fill="currentColor" opacity="0.18"/>
        </g>
        <g transform="translate(70 14) rotate(8)">
          <rect width="40" height="48" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="4" y="4" width="32" height="30" fill="currentColor" opacity="0.12"/>
        </g>
        <g transform="translate(160 24) rotate(-6)">
          <rect width="40" height="48" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="4" y="4" width="32" height="30" fill="currentColor" opacity="0.18"/>
        </g>
        <g transform="translate(208 60) rotate(22)">
          <rect width="40" height="48" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="4" y="4" width="32" height="30" fill="currentColor" opacity="0.12"/>
        </g>
      </g>

      {/* 옆에 놓인 카메라 (사진가 신원 단서) */}
      <g transform="translate(34 158)">
        <rect x="0" y="6" width="46" height="22" rx="2.5" fill="var(--bg)" stroke="currentColor" strokeWidth="2"/>
        <rect x="14" y="0" width="14" height="6" rx="1" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="22" cy="17" r="7" fill="currentColor"/>
        <circle cx="22" cy="17" r="3.5" fill="var(--bg)"/>
        <circle cx="38" cy="11" r="1.5" fill="currentColor"/>
      </g>

      {/* 잠든 고양이 — 정면 얼굴, 카메라에 머리 기댐 */}
      <g transform="translate(96 120)">
        {/* 둥글게 말린 몸 (옆모습) */}
        <path d="M 8 60 Q -8 56 -8 36 Q -8 18 14 14 L 70 14 Q 90 18 92 38 Q 92 56 78 60 Z" fill="currentColor"/>

        {/* 꼬리 — 몸 위로 둥글게 */}
        <path d="M 84 40 Q 102 24 92 14 Q 86 10 78 18" stroke="currentColor" strokeWidth="9" fill="none" strokeLinecap="round"/>

        {/* 머리 (정면, 살짝 옆으로 기울어짐) */}
        <g transform="rotate(-10 30 8)">
          {/* 귀 (뾰족, 명확) */}
          <path d="M 8 -4 L 14 -22 L 22 -4 Z" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
          <path d="M 38 -4 L 44 -22 L 50 -4 Z" fill="currentColor" stroke="currentColor" strokeWidth="1"/>
          {/* 귀 안쪽 분홍/밝은 면 */}
          <path d="M 13 -4 L 16 -16 L 20 -4 Z" fill="var(--bg)" opacity="0.85"/>
          <path d="M 41 -4 L 44 -16 L 48 -4 Z" fill="var(--bg)" opacity="0.85"/>
          {/* 얼굴 — 정면 둥근 */}
          <ellipse cx="29" cy="10" rx="22" ry="20" fill="currentColor"/>
          {/* 잠든 눈 — U자 곡선 (감김) */}
          <path d="M 17 8 Q 21 13 25 8" stroke="var(--bg)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <path d="M 33 8 Q 37 13 41 8" stroke="var(--bg)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          {/* 코 (작은 삼각) */}
          <path d="M 27 16 L 31 16 L 29 19 Z" fill="var(--bg)"/>
          {/* 입 — 작은 미소 */}
          <path d="M 25 21 Q 29 24 33 21" stroke="var(--bg)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          {/* 수염 — 명확하게 양쪽 3가닥씩 */}
          <line x1="2" y1="14" x2="14" y2="15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <line x1="2" y1="18" x2="14" y2="18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <line x1="2" y1="22" x2="14" y2="20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <line x1="56" y1="15" x2="44" y2="15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <line x1="56" y1="18" x2="44" y2="18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          <line x1="56" y1="22" x2="44" y2="20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </g>

        {/* 발 두 개 (몸 아래로 살짝 보임) */}
        <ellipse cx="20" cy="62" rx="6" ry="3" fill="currentColor"/>
        <ellipse cx="40" cy="62" rx="6" ry="3" fill="currentColor"/>
      </g>

      {/* z z z 잠 표시 */}
      <g fill="currentColor" opacity="0.6">
        <text x="178" y="112" fontFamily="ui-monospace, monospace" fontSize="16" fontWeight="800">z</text>
        <text x="194" y="128" fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700">z</text>
        <text x="206" y="142" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="600">z</text>
      </g>
    </svg>
  );
}

// 로더 — 고양이가 셔터 돌리는 중
export function CatLoader({ size = 80, message }) {
  return (
    <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
      <div className="text-[var(--ink)]">
        <CatPhotographer size={size} animate />
      </div>
      {message && <p className="text-[12px]">{message}</p>}
    </div>
  );
}

// 호환용 alias
export const MascotSleepyFour = CatSleepyFour;
