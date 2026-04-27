// 시선집 마스코트 — 작은 미니멀 캐릭터 + 폴라로이드 4장
// 컨셉: 오늘 4장을 모두 떨어뜨린 후 잠든 모습

export function MascotSleepyFour({ size = 200 }) {
  return (
    <svg
      viewBox="0 0 240 200"
      width={size}
      height={(size * 200) / 240}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="필름 카드 4장을 떨어뜨리고 잠든 캐릭터"
    >
      {/* 떨어진 폴라로이드 4장 */}
      <g>
        <g transform="translate(20 20) rotate(-12)">
          <rect x="0" y="0" width="48" height="58" rx="3" fill="#fff" stroke="currentColor" strokeWidth="1.5" opacity="0.9"/>
          <rect x="4" y="4" width="40" height="40" fill="#e9e3d6"/>
          <circle cx="24" cy="24" r="10" fill="#cfc6b8"/>
          <text x="24" y="54" textAnchor="middle" fontSize="6" fill="currentColor" opacity="0.7">DAY 1</text>
        </g>
        <g transform="translate(80 12) rotate(8)">
          <rect x="0" y="0" width="48" height="58" rx="3" fill="#fff" stroke="currentColor" strokeWidth="1.5" opacity="0.9"/>
          <rect x="4" y="4" width="40" height="40" fill="#dfe8e3"/>
          <path d="M 4 32 L 16 22 L 28 30 L 44 18 L 44 44 L 4 44 Z" fill="#a8b8b0"/>
          <text x="24" y="54" textAnchor="middle" fontSize="6" fill="currentColor" opacity="0.7">DAY 2</text>
        </g>
        <g transform="translate(150 22) rotate(-6)">
          <rect x="0" y="0" width="48" height="58" rx="3" fill="#fff" stroke="currentColor" strokeWidth="1.5" opacity="0.9"/>
          <rect x="4" y="4" width="40" height="40" fill="#f0e0d8"/>
          <rect x="14" y="20" width="20" height="24" fill="#c89c8a"/>
          <text x="24" y="54" textAnchor="middle" fontSize="6" fill="currentColor" opacity="0.7">DAY 3</text>
        </g>
        <g transform="translate(178 70) rotate(18)">
          <rect x="0" y="0" width="48" height="58" rx="3" fill="#fff" stroke="currentColor" strokeWidth="1.5" opacity="0.9"/>
          <rect x="4" y="4" width="40" height="40" fill="#e0e0e8"/>
          <circle cx="14" cy="14" r="3" fill="#888"/>
          <path d="M 4 38 L 16 28 L 26 34 L 36 24 L 44 30 L 44 44 L 4 44 Z" fill="#9090a0"/>
          <text x="24" y="54" textAnchor="middle" fontSize="6" fill="currentColor" opacity="0.7">DAY 4</text>
        </g>
      </g>

      {/* 캐릭터 — 카메라 모양 머리 */}
      <g transform="translate(95 105)">
        {/* 몸 (옷) */}
        <path
          d="M 12 60 L 12 88 Q 12 92 16 92 L 56 92 Q 60 92 60 88 L 60 60 Z"
          fill="currentColor"
          opacity="0.85"
        />
        {/* 머리 (카메라 바디) */}
        <rect x="6" y="22" width="60" height="42" rx="6" fill="currentColor"/>
        {/* 카메라 상단 — 뷰파인더 */}
        <rect x="22" y="14" width="28" height="10" rx="2" fill="currentColor"/>
        {/* 렌즈 (얼굴) */}
        <circle cx="36" cy="44" r="14" fill="#fff" stroke="currentColor" strokeWidth="2"/>
        <circle cx="36" cy="44" r="9" fill="currentColor"/>
        {/* 잠든 눈 (렌즈 안) */}
        <path d="M 31 43 Q 33 41 35 43" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        <path d="M 37 43 Q 39 41 41 43" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        {/* 셔터 버튼 */}
        <circle cx="58" cy="20" r="3" fill="#fff" opacity="0.6"/>
      </g>

      {/* Z Z Z — 잠 표시 */}
      <g fill="currentColor" opacity="0.6">
        <text x="170" y="120" fontFamily="ui-monospace, monospace" fontSize="14" fontWeight="800">z</text>
        <text x="184" y="135" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700">z</text>
        <text x="195" y="148" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="600">z</text>
      </g>
    </svg>
  );
}
