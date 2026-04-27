export default function Icon({ name, size = 20, className = '', strokeWidth = 1.8 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': true,
  };

  const icons = {
    eye: <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>,
    map: <svg {...common}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15" /><path d="M15 6v15" /></svg>,
    plus: <svg {...common}><path d="M12 5v14" /><path d="M5 12h14" /></svg>,
    archive: <svg {...common}><path d="M4 7h16" /><path d="M5 7l1 13h12l1-13" /><path d="M8 4h8l1 3H7l1-3Z" /><path d="M9 12h6" /></svg>,
    user: <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.4-4 4.2-6 8-6s6.6 2 8 6" /></svg>,
    camera: <svg {...common}><path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3l-1.5-2Z" /><circle cx="12" cy="13" r="3" /></svg>,
    back: <svg {...common}><path d="m15 18-6-6 6-6" /></svg>,
    bell: <svg {...common}><path d="M10 21h4" /><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /></svg>,
    search: <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
    chevronLeft: <svg {...common}><path d="m15 18-6-6 6-6" /></svg>,
    chevronRight: <svg {...common}><path d="m9 18 6-6-6-6" /></svg>,
    pin: <svg {...common}><path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>,
    share: <svg {...common}><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /></svg>,
    logout: <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>,
    heart: <svg {...common}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" /></svg>,
    heartFilled: <svg {...common} fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" /></svg>,
    reply: <svg {...common}><path d="M9 17l-4-4 4-4" /><path d="M5 13h11a4 4 0 0 1 4 4v3" /></svg>,
    sparkle: <svg {...common}><path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></svg>,
    plusFollow: <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>,
    checkFollow: <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m17 11 2 2 4-4" /></svg>,
    sun: <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>,
    bookmark: <svg {...common}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
    bookmarkFilled: <svg {...common} fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
    download: <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>,
    activity: <svg {...common}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
    moon: <svg {...common}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></svg>,
    layers: <svg {...common}><path d="m12 2 10 6-10 6L2 8l10-6Z" /><path d="m2 16 10 6 10-6" /><path d="m2 12 10 6 10-6" /></svg>,
    edit: <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" /></svg>,
    check: <svg {...common}><path d="M20 6 9 17l-5-5" /></svg>,
    x: <svg {...common}><path d="M18 6 6 18M6 6l12 12" /></svg>,
  };

  return icons[name] || icons.eye;
}
