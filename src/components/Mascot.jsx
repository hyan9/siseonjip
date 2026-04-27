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

// 잠든 고양이 + 떨어진 폴라로이드 4장 — 4장 채움 안내용
export function CatSleepyFour({ size = 220 }) {
  return (
    <svg
      viewBox="0 0 240 200"
      width={size}
      height={(size * 200) / 240}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="필름 4장을 다 쓰고 잠든 고양이"
    >
      {/* 떨어진 폴라로이드 4장 */}
      <g>
        <g transform="translate(20 22) rotate(-12)">
          <rect width="42" height="50" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="4" y="4" width="34" height="32" fill="currentColor" opacity="0.18"/>
        </g>
        <g transform="translate(74 16) rotate(7)">
          <rect width="42" height="50" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="4" y="4" width="34" height="32" fill="currentColor" opacity="0.12"/>
        </g>
        <g transform="translate(140 22) rotate(-5)">
          <rect width="42" height="50" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="4" y="4" width="34" height="32" fill="currentColor" opacity="0.18"/>
        </g>
        <g transform="translate(184 60) rotate(20)">
          <rect width="42" height="50" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="4" y="4" width="34" height="32" fill="currentColor" opacity="0.12"/>
        </g>
      </g>

      {/* 잠든 고양이 — 옆으로 누운 자세 */}
      <g transform="translate(80 110)">
        {/* 몸 (둥글게) */}
        <ellipse cx="40" cy="40" rx="48" ry="22" fill="currentColor"/>
        {/* 머리 */}
        <circle cx="14" cy="32" r="20" fill="currentColor"/>
        {/* 귀 */}
        <path d="M 0 26 L 4 14 L 14 22 Z" fill="currentColor"/>
        <path d="M 24 24 L 28 12 L 16 18 Z" fill="currentColor"/>
        {/* 잠든 눈 (감김) */}
        <path d="M 6 32 Q 9 30 12 32" stroke="var(--bg)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M 18 32 Q 21 30 24 32" stroke="var(--bg)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* 코+입 */}
        <circle cx="15" cy="38" r="1.8" fill="var(--bg)"/>
        <path d="M 13 41 Q 15 43 17 41" stroke="var(--bg)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* 수염 */}
        <line x1="-4" y1="38" x2="6" y2="40" stroke="var(--bg)" strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="24" y1="40" x2="32" y2="38" stroke="var(--bg)" strokeWidth="1.2" strokeLinecap="round"/>
        {/* 꼬리 (둥글게 말림) */}
        <path d="M 78 40 Q 96 30 88 50" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none"/>
      </g>

      {/* z z z 잠 표시 */}
      <g fill="currentColor" opacity="0.55">
        <text x="160" y="120" fontFamily="ui-monospace, monospace" fontSize="14" fontWeight="800">z</text>
        <text x="174" y="135" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700">z</text>
        <text x="186" y="148" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="600">z</text>
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
