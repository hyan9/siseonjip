import { useEffect, useMemo } from 'react';
import { useData } from '../lib/data-context';
import { useNotifications } from '../lib/notifications-context';
import {
  Header,
  ImageBox,
  EmptyState,
} from '../components/ui';
import Avatar from '../components/Avatar';

import {
  timeAgo,
} from '../lib/utils';

// 같은 종류 + 같은 대상(작품/없음)의 알림을 묶음.
// 예: follow 5개 → 1개 그룹 ("이끼 외 4명이 팔로우했어요")
function groupNotifications(notifications, getProfile) {
  const groups = [];
  const seen = new Map(); // groupKey → group ref

  for (const n of notifications) {
    const groupKey = `${n.kind}:${n.artwork_id ?? ''}:${n.comment_id ?? ''}`;
    const existing = seen.get(groupKey);
    if (existing) {
      existing.items.push(n);
      // 가장 최근 시간 기준
      if (new Date(n.created_at) > new Date(existing.latest)) existing.latest = n.created_at;
      if (!n.read_at && existing.read_at) existing.read_at = null;
    } else {
      const g = {
        key: `${groupKey}:${n.id}`,
        kind: n.kind,
        artwork_id: n.artwork_id,
        items: [n],
        latest: n.created_at,
        read_at: n.read_at ?? null,
      };
      groups.push(g);
      seen.set(groupKey, g);
    }
  }
  // 시간순 정렬
  groups.sort((a, b) => new Date(b.latest) - new Date(a.latest));
  // 닉네임 미리 채움 (가장 최근 actor 우선)
  for (const g of groups) {
    g.items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    g.actors = g.items
      .map((n) => getProfile(n.source_user_id)?.nickname || '누군가');
  }
  return groups;
}

export default function NotificationsScreen({ setScreen, openArtwork, openPerson }) {
  const { notifications, markRead, clearUnread, error } = useNotifications();
  const { getProfile, getArtwork } = useData();

  useEffect(() => {
    // 화면 닫을 때 일괄 읽음 처리
    return () => { clearUnread(); };
  }, [clearUnread]);

  const grouped = useMemo(
    () => groupNotifications(notifications, getProfile),
    [notifications, getProfile]
  );

  const handleClick = async (group) => {
    // 그룹에 속한 모든 알림을 읽음 처리
    for (const n of group.items) if (!n.read_at) await markRead(n.id);
    // 단일 알림이고 follow면 그 사람에게, 그 외엔 작품으로
    if (group.items.length === 1 && group.kind === 'follow') {
      const sid = group.items[0].source_user_id;
      if (sid) openPerson(sid);
    } else if (group.artwork_id) {
      openArtwork(group.artwork_id);
    }
    // follow 그룹(여러 명)이면 별도 화면 없이 그대로
  };

  const renderHeadline = (g) => {
    const first = g.actors[0];
    const more = g.items.length - 1;
    const who = more > 0 ? `${first} 외 ${more}명` : first;
    switch (g.kind) {
      case 'hype': return `${who}이(가) 화염을 보냈어요`;
      case 'comment': return more > 0 ? `${who}이(가) 댓글을 남겼어요` : `${first}이(가) 댓글을 남겼어요`;
      case 'comment_reply': return `${who}이(가) 답글을 남겼어요`;
      case 'comment_reaction': return `${who}이(가) 댓글에 ❤`;
      case 'mention': return `${who}이(가) @멘션했어요`;
      case 'follow': return `${who}이(가) 팔로우했어요`;
      case 'message': return `${who}이(가) 메시지를 보냈어요`;
      case 'milestone': return '개념글 등극!';
      default: return '새 알림';
    }
  };

  const kindIcon = (kind) => {
    switch (kind) {
      case 'hype': case 'milestone': return '🔥';
      case 'comment': case 'comment_reply': case 'comment_reaction': case 'mention': return '💬';
      case 'follow': return '👋';
      case 'message': return '✉️';
      default: return '✨';
    }
  };

  return (
    <>
      <Header title="알림" subtitle="다른 사람의 반응을 모아봅니다." kicker="모아 보기" onBack={() => setScreen('home')} />

      {error && (
        <div className="mb-4 rounded-[16px] bg-yellow-50 p-3 text-xs leading-5 text-yellow-900">
          알림 테이블이 아직 없어요. <code>supabase/migrations/003_social_and_stats.sql</code>을 실행해주세요.
        </div>
      )}

      {grouped.length === 0 ? (
        <EmptyState title="아직 알림이 없어요" hint="다른 사람들이 내 사진에 반응하면 여기에 모아 보여드릴게요." />
      ) : (
        <div className="space-y-1">
          {grouped.map((g) => {
            const headline = renderHeadline(g);
            const icon = kindIcon(g.kind);
            const art = g.artwork_id ? getArtwork(g.artwork_id) : null;
            // 그룹의 actor 아바타들 (최대 3개 stack)
            const actors = g.items.slice(0, 3).map((n) => getProfile(n.source_user_id)).filter(Boolean);
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => handleClick(g)}
                className={`flex w-full items-center gap-2.5 border-b border-[var(--border)] px-1 py-2.5 text-left last:border-b-0 ${
                  g.read_at ? '' : 'bg-[var(--surface-2)]'
                }`}
              >
                <div className="relative shrink-0">
                  {actors.length > 1 ? (
                    <div className="flex -space-x-2">
                      {actors.map((p) => (
                        <Avatar key={p.id} profile={p} size={32} className="border-2 border-[var(--surface)]" />
                      ))}
                    </div>
                  ) : (
                    <Avatar profile={actors[0]} size={36} />
                  )}
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--surface)] text-[9px] shadow">{icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] leading-tight font-bold">
                    {headline}
                  </p>
                  {art?.title && <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">"{art.title}"</p>}
                  <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">{timeAgo(g.latest)}</p>
                </div>
                {art && (
                  <ImageBox src={art.imageUrl} alt={art.title} className="h-10 w-10 shrink-0 rounded-[8px]" />
                )}
                {!g.read_at && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
