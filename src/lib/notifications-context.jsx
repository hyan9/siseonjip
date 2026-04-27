import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { useData } from './data-context';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from './db';

const NotificationsContext = createContext(null);

const TOAST_TTL_MS = 4500;

export function NotificationsProvider({ children }) {
  const { userId, getArtwork, getProfile, refresh } = useData();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [error, setError] = useState(null);

  const dataRef = useRef({ getArtwork, getProfile, refresh });
  useEffect(() => {
    dataRef.current = { getArtwork, getProfile, refresh };
  });

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const reloadNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await fetchNotifications(userId);
      setNotifications(list);
    } catch (err) {
      // 003 마이그레이션 안 돌렸으면 notifications 테이블 없음
      console.warn('[notifications] fetch 실패 (마이그레이션 003 실행 필요):', err.message);
      setError(err);
    }
  }, [userId]);

  const pushToast = useCallback((toast) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `t-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_TTL_MS);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markRead = useCallback(
    async (notificationId) => {
      if (!userId) return;
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n))
      );
      try {
        await markNotificationRead(notificationId, userId);
      } catch (err) {
        console.warn('markRead 실패', err);
      }
    },
    [userId]
  );

  const clearUnread = useCallback(async () => {
    if (!userId) return;
    setNotifications((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    try {
      await markAllNotificationsRead(userId);
    } catch (err) {
      console.warn('clearUnread 실패', err);
    }
  }, [userId]);

  // 초기 로드
  useEffect(() => {
    reloadNotifications();
  }, [reloadNotifications]);

  // Realtime: 새 알림 구독 + 토스트
  useEffect(() => {
    if (!userId) return undefined;

    const channel = supabase
      .channel(`user-notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new;
          setNotifications((prev) => [n, ...prev]);

          const { getProfile, getArtwork, refresh } = dataRef.current;
          const source = getProfile(n.source_user_id);
          const sourceName = source?.nickname ?? '누군가';
          const art = n.artwork_id ? getArtwork(n.artwork_id) : null;
          const artTitle = art?.title || '제목 없는 사진';

          let title = '';
          let body = null;
          switch (n.kind) {
            case 'hype':
              title = `${sourceName}이(가) 🔥 Hype!`;
              body = artTitle;
              break;
            case 'comment':
              title = `${sourceName}이(가) 댓글을 남겼어요`;
              body = artTitle;
              break;
            case 'comment_reply':
              title = `${sourceName}이(가) 답글을 남겼어요`;
              body = artTitle;
              break;
            case 'comment_reaction':
              title = `${sourceName}이(가) 내 댓글에 ❤`;
              break;
            case 'mention':
              title = `${sourceName}이(가) 댓글에서 @멘션했어요`;
              body = artTitle;
              break;
            case 'follow':
              title = `${sourceName}이(가) 팔로우했어요`;
              break;
            case 'message':
              title = `${sourceName}이(가) 메시지를 보냈어요`;
              break;
            default:
              title = '새 알림';
          }
          pushToast({ id: n.id, kind: n.kind, title, body, artworkId: n.artwork_id });
          refresh(); // 데이터도 갱신 (새 댓글/hype을 화면에 반영)
        }
      )
      // 다른 사람이 새 사진 올리면 데이터 자동 갱신 (토스트 X)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'artworks' },
        () => {
          dataRef.current.refresh?.();
        }
      )
      // 새 DM 도착 시 데이터 갱신 (notifications.kind='message'에서 토스트는 이미 처리됨)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` },
        () => {
          dataRef.current.refresh?.();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` },
        () => {
          dataRef.current.refresh?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, pushToast]);

  const value = {
    notifications,
    unreadCount,
    toasts,
    pushToast,
    dismissToast,
    markRead,
    clearUnread,
    reloadNotifications,
    error,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
