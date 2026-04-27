import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { useData } from './data-context';

const NotificationsContext = createContext({
  toasts: [],
  unreadCount: 0,
  clearUnread: () => {},
});

const TOAST_TTL_MS = 4500;

export function NotificationsProvider({ children }) {
  const { userId, getArtwork, getProfile, refresh } = useData();
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // useEffect 안에서 최신 getter들을 참조하기 위한 ref
  const dataRef = useRef({ getArtwork, getProfile, refresh });
  useEffect(() => {
    dataRef.current = { getArtwork, getProfile, refresh };
  });

  const pushToast = useCallback((toast) => {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `t-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, ...toast }]);
    setUnreadCount((prev) => prev + 1);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_TTL_MS);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  useEffect(() => {
    if (!userId) return undefined;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
          const c = payload.new;
          const { getArtwork, getProfile, refresh } = dataRef.current;
          const art = getArtwork(c.artwork_id);
          if (!art || art.user_id !== userId) return;
          if (c.user_id === userId) return;
          const author = getProfile(c.user_id);
          pushToast({
            kind: 'comment',
            title: `${author?.nickname ?? '누군가'}가 댓글을 남겼어요`,
            body: c.text?.length > 60 ? c.text.slice(0, 60) + '…' : c.text,
            artworkId: c.artwork_id,
          });
          refresh();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'hypes' },
        (payload) => {
          const h = payload.new;
          const { getArtwork, getProfile, refresh } = dataRef.current;
          const art = getArtwork(h.artwork_id);
          if (!art || art.user_id !== userId) return;
          if (h.user_id === userId) return;
          const fan = getProfile(h.user_id);
          pushToast({
            kind: 'hype',
            title: `${fan?.nickname ?? '누군가'}가 🔥 Hype!`,
            body: art.title || '제목 없는 사진',
            artworkId: h.artwork_id,
          });
          refresh();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'artworks' },
        (payload) => {
          const a = payload.new;
          if (a.user_id === userId) return;
          if (a.location_mode === '숨김' || a.location_mode === '개인전만') return;
          const { refresh } = dataRef.current;
          // 다른 사람의 새 사진이 올라오면 데이터만 갱신, 토스트는 안 띄움(시끄러움 방지)
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, pushToast]);

  return (
    <NotificationsContext.Provider value={{ toasts, unreadCount, clearUnread, dismissToast }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
