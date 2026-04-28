// 카든냥 마스코트 — 사진 찍는 고양이 (카든냥 자아)
// currentColor 기반이라 light/dark 자동 반응

const SPIN_KEYFRAMES = `
@keyframes siseonjip-spin { to { transform: rotate(360deg); } }
@keyframes siseonjip-tail-wag { 0%,100% { transform: rotate(-14deg); } 50% { transform: rotate(14deg); } }
@keyframes siseonjip-tail-sleepy { 0%,100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
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
      {/* 꼬리 — animate일 때 살랑살랑 */}
      <g style={animate ? { transformBox: 'fill-box', transformOrigin: '0% 100%', animation: 'siseonjip-tail-wag 1.4s ease-in-out infinite' } : undefined}>
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
export function CatSleepyFour({ size = 240, animate = true }) {
  return (
    <svg
      viewBox="0 0 280 220"
      width={size}
      height={(size * 220) / 280}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="필름 4장을 다 쓰고 잠든 사진가 고양이"
    >
      <style>{SPIN_KEYFRAMES}</style>
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
        {/* 꼬리 — 몸 뒤로 살짝 말려 올라감. 자면서도 살랑살랑 */}
        <g style={animate ? { transformBox: 'fill-box', transformOrigin: '0% 100%', animation: 'siseonjip-tail-sleepy 2.4s ease-in-out infinite' } : undefined}>
          <path d="M 168 60 Q 196 42 178 22 Q 170 14 158 22"
                stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round"/>
        </g>

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

// 식빵 자세 + 카메라 — 발 모으고 앉은 고양이가 카메라를 응시
export function CatLoaf({ size = 100, className = '' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="식빵 자세 고양이"
      className={className}
    >
      {/* 식빵 — 발이 안 보이게 둥글게 모은 몸 */}
      <path
        d="M 24 92 Q 24 64 60 64 Q 96 64 96 92 L 96 100 L 24 100 Z"
        fill="currentColor"
      />
      {/* 머리 */}
      <circle cx="60" cy="56" r="22" fill="currentColor" />
      {/* 귀 */}
      <path d="M 42 46 L 44 32 L 54 44 Z" fill="currentColor"/>
      <path d="M 78 46 L 76 32 L 66 44 Z" fill="currentColor"/>
      <path d="M 45 42 L 47 36 L 51 42 Z" fill="var(--bg)" opacity="0.9"/>
      <path d="M 75 42 L 73 36 L 69 42 Z" fill="var(--bg)" opacity="0.9"/>
      {/* 눈 — 가는 선 */}
      <path d="M 51 56 L 55 56" stroke="var(--bg)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M 65 56 L 69 56" stroke="var(--bg)" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* 코 */}
      <path d="M 58 62 L 62 62 L 60 65 Z" fill="var(--bg)"/>
      {/* 입 — 옴므 */}
      <path d="M 56 68 Q 60 71 64 68" stroke="var(--bg)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* 카메라 — 식빵 위에 살짝 놓임 (작게) */}
      <rect x="48" y="80" width="24" height="14" rx="2" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="60" cy="87" r="4" fill="currentColor"/>
      <circle cx="60" cy="87" r="2" fill="var(--bg)"/>
      <rect x="55" y="76" width="6" height="4" rx="0.5" fill="var(--bg)" stroke="currentColor" strokeWidth="1"/>
      {/* 수염 */}
      <line x1="32" y1="60" x2="48" y2="60" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="32" y1="64" x2="48" y2="63" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="88" y1="60" x2="72" y2="60" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="88" y1="64" x2="72" y2="63" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

// 셔터 누르는 순간 — 눈 감고 카메라 누름 (찰칵!)
export function CatShutter({ size = 100, className = '' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="셔터 누르는 고양이"
      className={className}
    >
      {/* 몸 */}
      <ellipse cx="60" cy="92" rx="32" ry="20" fill="currentColor"/>
      <ellipse cx="46" cy="108" rx="5" ry="3" fill="currentColor"/>
      <ellipse cx="74" cy="108" rx="5" ry="3" fill="currentColor"/>
      {/* 머리 */}
      <circle cx="60" cy="48" r="30" fill="currentColor"/>
      {/* 귀 */}
      <path d="M 36 36 L 40 18 L 52 32 Z" fill="currentColor"/>
      <path d="M 84 36 L 80 18 L 68 32 Z" fill="currentColor"/>
      <path d="M 41 30 L 43 22 L 48 30 Z" fill="var(--bg)" opacity="0.9"/>
      <path d="M 79 30 L 77 22 L 72 30 Z" fill="var(--bg)" opacity="0.9"/>

      {/* 카메라 + 셔터 누르는 순간 효과 */}
      <rect x="32" y="40" width="56" height="26" rx="3" fill="var(--bg)" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="46" y="34" width="14" height="6" rx="1" fill="var(--bg)" stroke="currentColor" strokeWidth="2"/>
      {/* 셔터 버튼 — 눌린 상태 (작게) */}
      <circle cx="76" cy="38" r="2" fill="currentColor"/>
      {/* 렌즈 — 셔터 닫힌 상태 (날개 모양) */}
      <circle cx="60" cy="53" r="11" fill="currentColor" stroke="var(--bg)" strokeWidth="2"/>
      <path d="M 53 46 L 60 53 L 53 60 Z M 67 46 L 60 53 L 67 60 Z" fill="var(--bg)" opacity="0.9"/>
      {/* 플래시 효과 — 별 모양 */}
      <g transform="translate(96 22)">
        <path d="M 0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z" fill="currentColor" opacity="0.85"/>
      </g>
      {/* 입 */}
      <path d="M 56 72 Q 60 74 64 72" stroke="var(--bg)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* 수염 */}
      <line x1="20" y1="56" x2="32" y2="58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="62" x2="32" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="100" y1="56" x2="88" y2="58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="100" y1="62" x2="88" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// 별빛 실루엣 냥이 — 빛나는 흰 실루엣 + 카메라
// 홈 hero / 로딩 / 빈 상태에 큼지막하게. 그라데이션 배경 위에 글로우.
export function CatStarlit({ size = 220, className = '' }) {
  return (
    <svg
      viewBox="0 0 240 240"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="별빛 카든냥"
      className={className}
    >
      <defs>
        <radialGradient id="starlit-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <filter id="starlit-blur">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      {/* 큰 글로우 — 뒤에서 빛나듯 */}
      <circle cx="120" cy="120" r="110" fill="url(#starlit-glow)" />
      {/* 작은 별 — 주변에 흩뿌림 */}
      <g fill="rgba(255,255,255,0.9)">
        <circle cx="40" cy="55" r="2" />
        <circle cx="200" cy="65" r="1.5" />
        <circle cx="55" cy="180" r="2.2" />
        <circle cx="195" cy="175" r="1.8" />
        <circle cx="30" cy="120" r="1.2" />
        <circle cx="215" cy="130" r="1.4" />
        <circle cx="120" cy="25" r="1.6" />
        <circle cx="115" cy="220" r="1.3" />
      </g>
      {/* 카든냥 실루엣 — 흰색 발광 */}
      <g fill="rgba(255,255,255,0.98)" filter="url(#starlit-blur)">
        {/* 꼬리 */}
        <path d="M 172 200 Q 204 176 192 144 Q 184 132 168 138" />
        {/* 몸 */}
        <ellipse cx="120" cy="184" rx="64" ry="40" />
        {/* 발 */}
        <ellipse cx="92" cy="216" rx="10" ry="6" />
        <ellipse cx="148" cy="216" rx="10" ry="6" />
        {/* 머리 */}
        <circle cx="120" cy="96" r="60" />
        {/* 귀 */}
        <path d="M 72 72 L 80 36 L 104 64 Z" />
        <path d="M 168 72 L 160 36 L 136 64 Z" />
        {/* 카메라 — 머리 앞 */}
        <rect x="64" y="80" width="112" height="52" rx="6" />
        <rect x="92" y="68" width="28" height="12" rx="2" />
        {/* 렌즈 — 가운데 큰 동그라미 (실루엣 더 강조) */}
        <circle cx="120" cy="106" r="22" />
      </g>
      {/* 렌즈 안쪽 — 어둡게 (실루엣 안 카메라처럼) */}
      <g fill="rgba(120, 180, 255, 0.4)">
        <circle cx="120" cy="106" r="14" />
      </g>
      {/* 렌즈 셔터 표시 */}
      <circle cx="120" cy="106" r="6" fill="rgba(255,255,255,0.95)" />
    </svg>
  );
}

// === 카든냥 10가지 페르소나 (자아) ===
// 각 페르소나마다 자세·장식·색이 고정된 미니 초상화.
// SettingsSheet 테마 picker, GuideScreen 페르소나 그리드에 사용.
// currentColor 의존 X — 테마와 무관하게 페르소나 정체성 유지.
// imgScale — PNG 캔버스 활용도가 페르소나마다 달라서(보라냥 ~50%, 점박이 ~90%) 같은
// % 사이즈로 그리면 어떤 건 작게, 어떤 건 잘린 듯 보임. 타일 안에서 시각적으로 비슷한
// 크기로 보이도록 페르소나별로 0.62~1.0 사이의 스케일 박음.
export const PERSONA_VARIANTS = {
  paper:       { label: '도화지',     pose: 'camera', bg: '#f1f2ee', ink: '#1a1d1f', accent: '#d97757', imgScale: 0.92 },
  night:       { label: '야간',       pose: 'curl',   bg: '#3d434b', ink: '#ecedef', accent: '#f5d28a', extra: 'moon', imgScale: 1.0 },
  bread:       { label: '식빵',       pose: 'loaf',   bg: '#f6ecdc', ink: '#7a5a36', accent: '#d97757', imgScale: 0.85 },
  cheese:      { label: '치즈',       pose: 'stand',  bg: '#fbf2dc', ink: '#c98c2e', accent: '#50331a', imgScale: 0.8 },
  mackerel:    { label: '고등어',     pose: 'camera', bg: '#e7e9ec', ink: '#5a6168', accent: '#2eb6c6', extra: 'stripes', imgScale: 0.7 },
  spotted:     { label: '점박이',     pose: 'stand',  bg: '#fafafa', ink: '#e8e8e8', accent: '#141414', extra: 'spots', imgScale: 0.65 },
  lavender:    { label: '보라냥',     pose: 'curl',   bg: '#efebf6', ink: '#a890c8', accent: '#8b5cf6', imgScale: 1.0 },
  chlorophyll: { label: '엽록소',     pose: 'stand',  bg: '#eef3e9', ink: '#3a6e44', accent: '#7ab875', extra: 'leaf', imgScale: 0.82 },
  cyberpunk:   { label: '사이버펑크', pose: 'stand',  bg: '#0a0814', ink: '#f0f0ff', accent: '#ff2d92', extra: 'glitch', imgScale: 0.62 },
  alien:       { label: '외계냥이',   pose: 'stand',  bg: '#0e1a14', ink: '#a3ff57', accent: '#7c5cff', extra: 'antennae', imgScale: 0.68 },
};

export const PERSONA_KEYS = Object.keys(PERSONA_VARIANTS);

// 새 PersonaCat — NotebookLM이 만든 PDF 6페이지 일러스트 PNG 사용.
// 기존 SVG 버전은 PersonaCatSvg로 보존 (의도적 기괴함이 살아있음).
export function PersonaCat({ persona = 'paper', size = 80, withFrame = true, className = '' }) {
  const v = PERSONA_VARIANTS[persona] || PERSONA_VARIANTS.paper;
  const imgPx = Math.round(size * (v.imgScale ?? 0.8));
  return (
    <span
      role="img"
      aria-label={`${v.label} 카든냥`}
      className={`inline-flex items-center justify-center overflow-hidden ${withFrame ? 'rounded-[12%]' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        background: withFrame ? v.bg : 'transparent',
      }}
    >
      <img
        src={`/personas/${persona}.png`}
        alt=""
        loading="lazy"
        // 페르소나별 imgScale로 픽셀 단위 사이즈 고정 — PNG 캔버스 활용도 차이를 보정.
        // 보라냥(curl·작음)은 1.0, 사이버펑크(가장자리까지 차있음)는 0.62 등.
        style={{ width: imgPx, height: imgPx }}
        className="block object-contain"
        draggable={false}
      />
    </span>
  );
}

// 기존 SVG 페르소나 — 의도적 기괴함, 백업용. 추후 다른 화면에서 활용 가능.
export function PersonaCatSvg({ persona = 'paper', size = 80, withFrame = true, className = '' }) {
  const v = PERSONA_VARIANTS[persona] || PERSONA_VARIANTS.paper;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${v.label} 카든냥`}
      className={className}
    >
      {withFrame && <rect width="120" height="120" rx="18" fill={v.bg} />}
      {v.pose === 'camera' && <PersonaCameraPose v={v} />}
      {v.pose === 'curl'   && <PersonaCurlPose v={v} />}
      {v.pose === 'loaf'   && <PersonaLoafPose v={v} />}
      {v.pose === 'stand'  && <PersonaStandPose v={v} />}
    </svg>
  );
}

function PersonaCameraPose({ v }) {
  return (
    <g>
      <path d="M 86 100 Q 102 88 96 72" stroke={v.ink} strokeWidth="5" strokeLinecap="round" fill="none"/>
      <ellipse cx="60" cy="92" rx="32" ry="20" fill={v.ink}/>
      <circle cx="60" cy="48" r="30" fill={v.ink}/>
      <path d="M 36 36 L 40 18 L 52 32 Z" fill={v.ink}/>
      <path d="M 84 36 L 80 18 L 68 32 Z" fill={v.ink}/>
      {v.extra === 'stripes' && (
        <g stroke={v.bg} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.6">
          <path d="M 36 80 Q 60 86 84 80" />
          <path d="M 32 92 Q 60 100 88 92" />
          <path d="M 40 102 Q 60 108 80 102" />
        </g>
      )}
      <rect x="32" y="40" width="56" height="26" rx="3" fill={v.bg} stroke={v.ink} strokeWidth="2.5"/>
      <rect x="46" y="34" width="14" height="6" rx="1" fill={v.bg} stroke={v.ink} strokeWidth="2"/>
      <circle cx="76" cy="38" r="2.5" fill={v.accent}/>
      <circle cx="60" cy="53" r="11" fill={v.ink} stroke={v.bg} strokeWidth="2"/>
      <circle cx="60" cy="53" r="6" fill={v.accent}/>
      <circle cx="60" cy="53" r="2.5" fill={v.bg}/>
      <path d="M 56 72 Q 60 75 64 72" stroke={v.bg} strokeWidth="2" fill="none" strokeLinecap="round"/>
    </g>
  );
}

function PersonaCurlPose({ v }) {
  return (
    <g>
      {v.extra === 'moon' && (
        <g>
          <circle cx="32" cy="30" r="9" fill={v.accent} opacity="0.9"/>
          <circle cx="35" cy="28" r="7.5" fill={v.bg}/>
          <circle cx="20" cy="50" r="1.5" fill={v.ink} opacity="0.85"/>
          <circle cx="48" cy="20" r="1.2" fill={v.ink} opacity="0.85"/>
          <circle cx="100" cy="36" r="1.4" fill={v.ink} opacity="0.85"/>
          <circle cx="92" cy="22" r="1" fill={v.ink} opacity="0.7"/>
        </g>
      )}
      <ellipse cx="60" cy="82" rx="42" ry="22" fill={v.ink}/>
      <path d="M 22 88 Q 14 70 30 60 Q 42 56 50 66" stroke={v.ink} strokeWidth="9" strokeLinecap="round" fill="none"/>
      <ellipse cx="80" cy="62" rx="22" ry="20" fill={v.ink}/>
      <path d="M 66 50 L 64 36 L 76 48 Z" fill={v.ink}/>
      <path d="M 92 50 L 94 38 L 86 50 Z" fill={v.ink}/>
      <path d="M 70 60 Q 74 64 78 60" stroke={v.bg} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 84 60 Q 88 64 92 60" stroke={v.bg} strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 78 68 L 84 68 L 81 71 Z" fill={v.bg}/>
      <path d="M 76 74 Q 81 77 86 74" stroke={v.bg} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </g>
  );
}

function PersonaLoafPose({ v }) {
  return (
    <g>
      <path d="M 24 92 Q 24 64 60 64 Q 96 64 96 92 L 96 100 L 24 100 Z" fill={v.ink}/>
      <circle cx="60" cy="56" r="24" fill={v.ink}/>
      <path d="M 42 46 L 44 30 L 54 44 Z" fill={v.ink}/>
      <path d="M 78 46 L 76 30 L 66 44 Z" fill={v.ink}/>
      <path d="M 50 56 L 54 56" stroke={v.bg} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M 66 56 L 70 56" stroke={v.bg} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M 58 62 L 62 62 L 60 65 Z" fill={v.bg}/>
      <path d="M 56 68 Q 60 71 64 68" stroke={v.bg} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <line x1="32" y1="60" x2="46" y2="60" stroke={v.bg} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <line x1="32" y1="64" x2="46" y2="63" stroke={v.bg} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <line x1="88" y1="60" x2="74" y2="60" stroke={v.bg} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <line x1="88" y1="64" x2="74" y2="63" stroke={v.bg} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    </g>
  );
}

function PersonaStandPose({ v }) {
  const isSpotted = v.extra === 'spots';
  return (
    <g>
      <path d="M 88 80 Q 102 60 92 38" stroke={v.ink} strokeWidth="6" strokeLinecap="round" fill="none"/>
      <ellipse cx="60" cy="86" rx="22" ry="26" fill={v.ink} stroke={isSpotted ? v.accent : 'none'} strokeWidth={isSpotted ? 0.8 : 0}/>
      <ellipse cx="48" cy="108" rx="6" ry="5" fill={v.ink}/>
      <ellipse cx="72" cy="108" rx="6" ry="5" fill={v.ink}/>
      <circle cx="60" cy="42" r="24" fill={v.ink} stroke={isSpotted ? v.accent : 'none'} strokeWidth={isSpotted ? 0.8 : 0}/>
      <path d="M 40 32 L 42 16 L 54 30 Z" fill={v.ink}/>
      <path d="M 80 32 L 78 16 L 66 30 Z" fill={v.ink}/>
      {v.extra === 'antennae' && (
        <g>
          <line x1="46" y1="14" x2="42" y2="3" stroke={v.accent} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="42" cy="3" r="3" fill={v.accent}/>
          <line x1="74" y1="14" x2="78" y2="3" stroke={v.accent} strokeWidth="2" strokeLinecap="round"/>
          <circle cx="78" cy="3" r="3" fill={v.accent}/>
        </g>
      )}
      {v.extra === 'leaf' && (
        <g>
          <path d="M 60 18 Q 50 8 48 16 Q 50 24 60 22 Q 70 24 72 16 Q 70 8 60 18 Z" fill={v.accent}/>
          <line x1="60" y1="22" x2="60" y2="14" stroke={v.ink} strokeWidth="1.4" strokeLinecap="round"/>
        </g>
      )}
      {/* 눈 */}
      <ellipse cx="51" cy="42" rx="2.5" ry="3.5" fill={v.bg}/>
      <ellipse cx="69" cy="42" rx="2.5" ry="3.5" fill={v.bg}/>
      <circle cx="51" cy="43" r="1.4" fill={v.ink}/>
      <circle cx="69" cy="43" r="1.4" fill={v.ink}/>
      <path d="M 57 50 L 63 50 L 60 54 Z" fill={v.bg}/>
      <path d="M 56 56 Q 60 59 64 56" stroke={v.bg} strokeWidth="1.6" fill="none" strokeLinecap="round"/>
      <line x1="40" y1="50" x2="50" y2="51" stroke={v.bg} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <line x1="40" y1="54" x2="50" y2="54" stroke={v.bg} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <line x1="80" y1="50" x2="70" y2="51" stroke={v.bg} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <line x1="80" y1="54" x2="70" y2="54" stroke={v.bg} strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>

      {v.extra === 'spots' && (
        <g fill={v.accent}>
          <circle cx="48" cy="36" r="2.4"/>
          <circle cx="68" cy="32" r="1.8"/>
          <circle cx="72" cy="46" r="1.6"/>
          <circle cx="42" cy="46" r="1.8"/>
          <circle cx="50" cy="76" r="3"/>
          <circle cx="68" cy="78" r="2.4"/>
          <circle cx="58" cy="92" r="3.4"/>
          <circle cx="44" cy="94" r="2.2"/>
          <circle cx="72" cy="96" r="2"/>
          <circle cx="56" cy="68" r="1.6"/>
          <circle cx="52" cy="102" r="1.8"/>
          <circle cx="68" cy="104" r="1.4"/>
        </g>
      )}

      {v.extra === 'glitch' && (
        <g opacity="0.85">
          <rect x="36" y="40" width="48" height="2" fill="#00f5ff"/>
          <rect x="38" y="44" width="44" height="1.5" fill={v.accent}/>
          <rect x="42" y="76" width="36" height="2" fill="#00f5ff"/>
          <rect x="40" y="92" width="40" height="1.5" fill={v.accent}/>
        </g>
      )}
    </g>
  );
}

// 외계 냥이 — 더듬이 + 카메라
export function CatAlien({ size = 100, className = '' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="외계 냥이"
      className={className}
    >
      {/* 몸 */}
      <ellipse cx="60" cy="92" rx="32" ry="20" fill="currentColor"/>
      <ellipse cx="46" cy="108" rx="5" ry="3" fill="currentColor"/>
      <ellipse cx="74" cy="108" rx="5" ry="3" fill="currentColor"/>
      {/* 머리 */}
      <circle cx="60" cy="48" r="30" fill="currentColor"/>
      {/* 귀 — 일반 + 더듬이 */}
      <path d="M 36 36 L 40 18 L 52 32 Z" fill="currentColor"/>
      <path d="M 84 36 L 80 18 L 68 32 Z" fill="currentColor"/>
      {/* 더듬이 — 머리 위에 동그라미 두 개 */}
      <line x1="50" y1="20" x2="46" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="46" cy="5" r="3" fill="currentColor"/>
      <line x1="70" y1="20" x2="74" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="74" cy="5" r="3" fill="currentColor"/>
      {/* 카메라 (눈 역할) */}
      <rect x="32" y="40" width="56" height="26" rx="3" fill="var(--bg)" stroke="currentColor" strokeWidth="2.5"/>
      <rect x="46" y="34" width="14" height="6" rx="1" fill="var(--bg)" stroke="currentColor" strokeWidth="2"/>
      <circle cx="76" cy="38" r="2.5" fill="currentColor"/>
      {/* 렌즈 — 외계의 동공 */}
      <circle cx="60" cy="53" r="11" fill="currentColor" stroke="var(--bg)" strokeWidth="2"/>
      <ellipse cx="60" cy="53" rx="3" ry="7" fill="var(--bg)"/>
      {/* 입 — 작게 */}
      <path d="M 56 72 Q 60 75 64 72" stroke="var(--bg)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* 수염 */}
      <line x1="20" y1="56" x2="32" y2="58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="62" x2="32" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="100" y1="56" x2="88" y2="58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="100" y1="62" x2="88" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
