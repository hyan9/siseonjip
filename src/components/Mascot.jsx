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

// 카메라 옆에 잠든 고양이 + 떨어진 폴라로이드 4장
// CatPhotographer와 동일한 머리 모양 (정면) — 같은 캐릭터의 잠든 모습
export function CatSleepyFour({ size = 220 }) {
  return (
    <svg
      viewBox="0 0 240 200"
      width={size}
      height={(size * 200) / 240}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="필름 4장을 다 쓰고 잠든 사진가 고양이"
    >
      {/* 떨어진 폴라로이드 4장 — 위쪽 */}
      <g>
        <g transform="translate(8 8) rotate(-16)">
          <rect width="36" height="44" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="3" width="30" height="28" fill="currentColor" opacity="0.16"/>
        </g>
        <g transform="translate(180 6) rotate(14)">
          <rect width="36" height="44" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="3" width="30" height="28" fill="currentColor" opacity="0.16"/>
        </g>
        <g transform="translate(2 138) rotate(8)">
          <rect width="36" height="44" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="3" width="30" height="28" fill="currentColor" opacity="0.16"/>
        </g>
        <g transform="translate(196 142) rotate(-12)">
          <rect width="36" height="44" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="3" width="30" height="28" fill="currentColor" opacity="0.16"/>
        </g>
      </g>

      {/* 카메라 — 가운데 아래에 놓임 */}
      <g transform="translate(80 132)">
        <rect x="0" y="8" width="60" height="28" rx="3" fill="var(--bg)" stroke="currentColor" strokeWidth="2"/>
        <rect x="20" y="0" width="18" height="8" rx="1.5" fill="var(--bg)" stroke="currentColor" strokeWidth="2"/>
        <circle cx="30" cy="22" r="9" fill="currentColor"/>
        <circle cx="30" cy="22" r="5" fill="var(--bg)"/>
        <circle cx="30" cy="22" r="2" fill="currentColor"/>
        <circle cx="50" cy="14" r="2" fill="currentColor"/>
      </g>

      {/* 카메라 위에 머리 얹고 자는 고양이 — CatPhotographer와 동일한 정면 머리 */}
      <g transform="translate(78 56)">
        {/* 귀 — 뾰족하게 (CatPhotographer와 동일 비율) */}
        <path d="M 8 24 L 14 4 L 26 22 Z" fill="currentColor"/>
        <path d="M 76 24 L 70 4 L 58 22 Z" fill="currentColor"/>
        {/* 귀 안쪽 밝은 면 */}
        <path d="M 13 22 L 16 10 L 22 22 Z" fill="var(--bg)" opacity="0.9"/>
        <path d="M 71 22 L 68 10 L 62 22 Z" fill="var(--bg)" opacity="0.9"/>
        {/* 얼굴 — 둥근 정면 */}
        <circle cx="42" cy="36" r="30" fill="currentColor"/>
        {/* 감은 눈 — 옆으로 휘어진 U */}
        <path d="M 26 36 Q 31 42 36 36" stroke="var(--bg)" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
        <path d="M 48 36 Q 53 42 58 36" stroke="var(--bg)" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
        {/* 코 — 작은 분홍 삼각 */}
        <path d="M 38 47 L 46 47 L 42 52 Z" fill="var(--bg)"/>
        {/* 입 — 작은 ㅅ */}
        <path d="M 36 56 Q 42 60 48 56" stroke="var(--bg)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* 수염 — 양쪽 3가닥씩 명확 */}
        <line x1="-2" y1="40" x2="14" y2="42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="-2" y1="46" x2="14" y2="46" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="-2" y1="52" x2="14" y2="50" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="86" y1="42" x2="70" y2="42" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="86" y1="46" x2="70" y2="46" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="86" y1="52" x2="70" y2="50" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </g>

      {/* z z z */}
      <g fill="currentColor" opacity="0.55">
        <text x="170" y="60" fontFamily="ui-monospace, monospace" fontSize="16" fontWeight="800">z</text>
        <text x="184" y="76" fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700">z</text>
        <text x="196" y="90" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="600">z</text>
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
