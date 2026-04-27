// 카든냥 톤 stroke 아이콘 — currentColor + 1.6 strokeWidth
// 우상단 툴바, SettingsSheet 등에서 일관 톤 유지

const sw = 1.6;
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: sw,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconSaved({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z"/>
    </svg>
  );
}

export function IconCollections({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="4" y="6" width="16" height="13" rx="2"/>
      <path d="M7 4h10M5.5 9.5h13"/>
    </svg>
  );
}

export function IconActivity({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M3 12h4l3-7 4 14 3-7h4"/>
    </svg>
  );
}

export function IconEdit({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M14 4l6 6L9 21H3v-6L14 4Z"/>
      <path d="M14 4l3-3 6 6-3 3"/>
    </svg>
  );
}

export function IconSettings({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
    </svg>
  );
}

export function IconShare({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 4v12M7 9l5-5 5 5M5 21h14"/>
    </svg>
  );
}

export function IconStar({ size = 18, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 3l3 6 6 .9-4.5 4.4 1 6.2L12 17.8 6.5 20.5l1-6.2L3 9.9 9 9l3-6Z"/>
    </svg>
  );
}

export function IconTrash({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M5 6v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6"/>
      <path d="M10 11v6M14 11v6"/>
    </svg>
  );
}

export function IconReport({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M5 21V4M5 4h12l-2 4 2 4H5"/>
    </svg>
  );
}

export function IconBlock({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="9"/>
      <path d="M5.6 5.6l12.8 12.8"/>
    </svg>
  );
}

export function IconMessage({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4V6a1 1 0 0 1 1-1Z"/>
    </svg>
  );
}

export function IconBookmark({ size = 18, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} fill={filled ? 'currentColor' : 'none'}>
      <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1Z"/>
    </svg>
  );
}

export function IconAdd({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  );
}

export function IconMoon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>
    </svg>
  );
}

export function IconSun({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/>
    </svg>
  );
}

export function IconLogout({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 16l5-4-5-4M21 12H10"/>
    </svg>
  );
}

export function IconCard({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3" y="6" width="18" height="13" rx="2"/>
      <path d="M3 11h18"/>
    </svg>
  );
}

export function IconCalendar({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M3 9h18M8 3v4M16 3v4"/>
    </svg>
  );
}

export function IconLock({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <rect x="4" y="11" width="16" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
    </svg>
  );
}

// Hype — 카든냥 톤에 맞춘 자체 디자인 화염 (저챙도)
export function IconHype({ size = 18, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 3.5c1.6 2.4 3.7 4.1 3.7 6.7 0 1.4-.7 2.4-1.8 2.9.4-1 .3-2.1-.5-3.2-.6 2.1-2.4 3-2.4 5.4 0 1.4 1 2.6 2.5 2.6-2.7.5-5.5-1.5-5.5-4.7 0-3 2-4.3 2-7 0-1 .3-1.9 2-2.7Z"/>
      <path d="M9.5 18.6c1 1.4 2.5 1.9 4.6 1.9 3.6 0 6-2.4 6-5.7 0-2-1-3.6-2.5-4.7" opacity="0.55"/>
    </svg>
  );
}

// Comment — 위·아래 작은 말풍선
export function IconComment({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8l-4 4V6a1 1 0 0 1 0-1Z"/>
    </svg>
  );
}

// Bell — 알림
export function IconBell({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <path d="M6 17h12l-2-3v-4a4 4 0 0 0-8 0v4l-2 3Z"/>
      <path d="M10 20a2 2 0 0 0 4 0"/>
    </svg>
  );
}

// Search — 돋보기
export function IconSearch({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
      <circle cx="11" cy="11" r="6"/>
      <path d="M20 20l-4.3-4.3"/>
    </svg>
  );
}
