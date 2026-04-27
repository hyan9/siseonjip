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
  };

  return icons[name] || icons.eye;
}
