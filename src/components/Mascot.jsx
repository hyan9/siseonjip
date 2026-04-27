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

// 잠든 사진가 고양이 — 전신 (몸통 + 꼬리 + 다리 + 머리) + 4장 폴라로이드
export function CatSleepyFour({ size = 240 }) {
  return (
    <svg
      viewBox="0 0 280 220"
      width={size}
      height={(size * 220) / 280}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="필름 4장을 다 쓰고 잠든 사진가 고양이"
    >
      {/* 떨어진 폴라로이드 4장 — 모서리 사방 */}
      <g>
        <g transform="translate(6 8) rotate(-18)">
          <rect width="34" height="42" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="3" width="28" height="26" fill="currentColor" opacity="0.16"/>
        </g>
        <g transform="translate(232 12) rotate(16)">
          <rect width="34" height="42" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="3" width="28" height="26" fill="currentColor" opacity="0.16"/>
        </g>
        <g transform="translate(2 168) rotate(10)">
          <rect width="34" height="42" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="3" width="28" height="26" fill="currentColor" opacity="0.16"/>
        </g>
        <g transform="translate(244 162) rotate(-10)">
          <rect width="34" height="42" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="3" width="28" height="26" fill="currentColor" opacity="0.16"/>
        </g>
      </g>

      {/* 옆으로 누운 사진가 고양이 — 전신 */}
      <g transform="translate(48 80)">
        {/* 꼬리 — 몸 뒤로 살짝 말려 올라감 */}
        <path d="M 168 60 Q 196 42 178 22 Q 170 14 158 22"
              stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>

        {/* 몸통 — 옆에서 본 둥근 타원 (큰 덩어리) */}
        <ellipse cx="100" cy="68" rx="76" ry="32" fill="currentColor"/>

        {/* 뒷다리 (몸 뒤쪽 아래) */}
        <ellipse cx="148" cy="98" rx="20" ry="9" fill="currentColor"/>
        {/* 앞발 — 카메라 옆에 놓임 */}
        <ellipse cx="56" cy="100" rx="14" ry="7" fill="currentColor"/>
        <ellipse cx="80" cy="100" rx="14" ry="7" fill="currentColor"/>

        {/* 머리 — 몸 왼쪽으로 기댐, 정면 비스듬 */}
        <g transform="translate(0 0)">
          {/* 귀 (뾰족 + 안쪽 분홍) */}
          <path d="M 22 18 L 18 -2 L 36 14 Z" fill="currentColor"/>
          <path d="M 70 14 L 76 -4 L 60 12 Z" fill="currentColor"/>
          <path d="M 26 14 L 24 4 L 32 14 Z" fill="var(--bg)" opacity="0.9"/>
          <path d="M 68 12 L 70 4 L 64 12 Z" fill="var(--bg)" opacity="0.9"/>
          {/* 얼굴 (살짝 옆모습 — ellipse) */}
          <ellipse cx="48" cy="34" rx="30" ry="26" fill="currentColor"/>
          {/* 감은 눈 — U자 */}
          <path d="M 30 32 Q 34 38 38 32" stroke="var(--bg)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M 54 32 Q 58 38 62 32" stroke="var(--bg)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          {/* 코 */}
          <path d="M 44 44 L 52 44 L 48 49 Z" fill="var(--bg)"/>
          {/* 입 — 작은 ㅅ */}
          <path d="M 42 52 Q 48 56 54 52" stroke="var(--bg)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          {/* 수염 — 양쪽 3가닥 */}
          <line x1="6" y1="36" x2="20" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="4" y1="42" x2="20" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="6" y1="48" x2="20" y2="46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="90" y1="38" x2="76" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="92" y1="42" x2="76" y2="42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="90" y1="48" x2="76" y2="46" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </g>

        {/* 카메라 — 앞발 사이에 놓인 작은 카메라 */}
        <g transform="translate(50 75)">
          <rect x="0" y="6" width="42" height="20" rx="2.5" fill="var(--bg)" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="0" width="14" height="6" rx="1" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="21" cy="16" r="6" fill="currentColor"/>
          <circle cx="21" cy="16" r="3" fill="var(--bg)"/>
          <circle cx="34" cy="10" r="1.5" fill="currentColor"/>
        </g>
      </g>

      {/* z z z */}
      <g fill="currentColor" opacity="0.55">
        <text x="186" y="58" fontFamily="ui-monospace, monospace" fontSize="16" fontWeight="800">z</text>
        <text x="200" y="74" fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700">z</text>
        <text x="212" y="88" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="600">z</text>
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
