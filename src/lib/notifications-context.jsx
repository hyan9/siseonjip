import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabase';
import { useData } from './data-context';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from './db';
import { buildBotNotifications } from './bot-seed';

const NotificationsContext = createContext(null);

const TOAST_TTL_MS = 4500;

// 봇 알림(client-side 시뮬)은 DB에 없으므로 읽음 상태를 localStorage에 저장.
// 알림 화면을 닫거나 알림을 클릭하면 해당 봇 알림 ID가 누적되어,
// 새로고침 후에도 🔥/빨간 점이 다시 켜지지 않게 함.
const BOT_READ_STORAGE_PREFIX = 'kadennyang:bot-noti-read:v1:';

function loadBotReadIds(userId) {
  if (!userId || typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(BOT_READ_STORAGE_PREFIX + userId);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function saveBotReadIds(userId, set) {
  if (!userId || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BOT_READ_STORAGE_PREFIX + userId, JSON.stringify([...set]));
  } catch {
    // 용량 초과 등 — 무시
  }
}

export function NotificationsProvider({ children }) {
  const { userId, getArtwork, getProfile, getUserArtworks, refresh } = useData();
  const [dbNotifications, setDbNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [error, setError] = useState(null);
  // 봇 알림 읽음 ID — userId 바뀌면 다시 로드 (render-and-set 패턴)
  const [botReadIds, setBotReadIds] = useState(() => loadBotReadIds(userId));
  const [botReadUserId, setBotReadUserId] = useState(userId);
  if (botReadUserId !== userId) {
    setBotReadUserId(userId);
    setBotReadIds(loadBotReadIds(userId));
  }

  const dataRef = useRef({ getArtwork, getProfile, refresh });
  useEffect(() => {
    dataRef.current = { getArtwork, getProfile, refresh };
  });

  // 봇 활동 알림(client-side 시뮬레이션) — 사용자 작품과 함께 변화
  const userArtworks = userId ? getUserArtworks(userId) : [];
  const botNotificationsRaw = useMemo(
    () => buildBotNotifications({ userId, userArtworks }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, userArtworks.length]
  );
  // 저장된 읽음 상태 적용 — 한 번 클릭한 봇 알림은 read_at이 채워져 빨간 점 사라짐
  const botNotifications = useMemo(
    () =>
      botNotificationsRaw.map((n) =>
        botReadIds.has(n.id) ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n
      ),
    [botNotificationsRaw, botReadIds]
  );
  const notifications = useMemo(
    () =>
      [...botNotifications, ...dbNotifications].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      ),
    [botNotifications, dbNotifications]
  );

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const reloadNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await fetchNotifications(userId);
      setDbNotifications(list);
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
      // 봇 알림 — DB 대신 localStorage 기반 set에 기록
      if (typeof notificationId === 'string' && notificationId.startsWith('bot-noti:')) {
        setBotReadIds((prev) => {
          if (prev.has(notificationId)) return prev;
          const next = new Set(prev);
          next.add(notificationId);
          saveBotReadIds(userId, next);
          return next;
        });
        return;
      }
      setDbNotifications((prev) =>
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
    setDbNotifications((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    // 현재 보이는 봇 알림 모두 읽음으로
    setBotReadIds((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const n of botNotificationsRaw) {
        if (!next.has(n.id)) { next.add(n.id); changed = true; }
      }
      if (changed) saveBotReadIds(userId, next);
      return changed ? next : prev;
    });
    try {
      await markAllNotificationsRead(userId);
    } catch (err) {
      console.warn('clearUnread 실패', err);
    }
  }, [userId, botNotificationsRaw]);

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
          setDbNotifications((prev) => [n, ...prev]);

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
            case 'milestone':
              title = '🔥 개념글 등극!';
              body = `${artTitle} — 추천 5+`;
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
