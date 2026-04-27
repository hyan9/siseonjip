import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({ theme: 'paper', toggle: () => {}, setTheme: () => {} });

const STORAGE_KEY = 'kadennyang:theme';

// 카든냥 테마 — 고양이 모티브로 5종.
// id는 data-theme 값 (CSS 변수가 index.css의 [data-theme="..."]에 매칭)
export const THEMES = [
  {
    id: 'paper',
    label: '도화지',
    hint: '흰 종이 위, 일상의 빛',
    swatch: ['#f1f2ee', '#1a1d1f', '#d97757'],
    color: '#f1f2ee',
  },
  {
    id: 'night',
    label: '야간',
    hint: '깊은 새벽, 가로등의 외로움',
    swatch: ['#0e1014', '#ecedef', '#f08461'],
    color: '#0e1014',
  },
  {
    id: 'bread',
    label: '식빵',
    hint: '오븐에서 갓 나온 따뜻한 톤',
    swatch: ['#f6ecdc', '#4a3a26', '#d97757'],
    color: '#f6ecdc',
  },
  {
    id: 'cheese',
    label: '치즈',
    hint: '체다와 노른자, 햇살의 노랑',
    swatch: ['#fbf2dc', '#50331a', '#e57e2c'],
    color: '#fbf2dc',
  },
  {
    id: 'mackerel',
    label: '고등어',
    hint: '은빛 줄무늬와 차가운 차콜',
    swatch: ['#e7e9ec', '#1f2429', '#2eb6c6'],
    color: '#e7e9ec',
  },
];

const VALID_IDS = new Set(THEMES.map((t) => t.id));

function getInitialTheme() {
  if (typeof window === 'undefined') return 'paper';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && VALID_IDS.has(saved)) return saved;
  // 시스템 다크 선호 → 야간
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'night';
  return 'paper';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const t = THEMES.find((x) => x.id === theme);
      if (t) meta.setAttribute('content', t.color);
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (!VALID_IDS.has(next)) return;
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage 사용 불가 (Safari private mode 등) — 무시
    }
  }, []);

  // 호환: 기존 toggle()은 paper ↔ night 사이 토글
  const toggle = useCallback(() => {
    setTheme(theme === 'night' ? 'paper' : 'night');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme, themes: THEMES }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
