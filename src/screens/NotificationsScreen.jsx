import { useEffect, useMemo, useState } from 'react';
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
  const { notifications, markRead, error } = useNotifications();
  const { getProfile, getArtwork } = useData();

  // 매 30초마다 강제 리렌더 — timeAgo("3분 전")가 자연스럽게 갱신
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const grouped = useMemo(
    () => groupNotifications(notifications, getProfile),
    [notifications, getProfile]
  );

  // 펼쳐진 그룹 key 모음 — 다중 알림 그룹 안의 개별 알림을 보고 싶을 때
  const [expanded, setExpanded] = useState(() => new Set());
  const toggleExpand = (key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // 단일 알림 클릭 — 해당 객체 1개만 읽음 처리 + 적절한 화면으로
  const handleSingleClick = async (notif, group) => {
    if (!notif.read_at) await markRead(notif.id);
    if (group.kind === 'follow') {
      if (notif.source_user_id) openPerson(notif.source_user_id);
    } else if (group.artwork_id) {
      openArtwork(group.artwork_id);
    }
  };

  // 그룹 헤더 클릭 — 단일 항목 그룹은 즉시 이동, 다중 그룹은 펼치기
  const handleGroupClick = async (group) => {
    if (group.items.length === 1) {
      await handleSingleClick(group.items[0], group);
      return;
    }
    toggleExpand(group.key);
  };

  // 한글 마지막 음절 받침 유무로 주격조사(이/가) 결정
  const subjectParticle = (name) => {
    if (!name) return '';
    const last = name.charCodeAt(name.length - 1);
    if (last >= 0xAC00 && last <= 0xD7A3) {
      const hasJongseong = (last - 0xAC00) % 28 !== 0;
      return hasJongseong ? '이' : '가';
    }
    return ''; // 영문 등은 조사 생략
  };

  const renderHeadline = (g) => {
    const first = g.actors[0];
    const more = g.items.length - 1;
    // 여러 명: "이끼 외 2명이". 한 명: "이끼가" / "리넨이"
    const subj = more > 0
      ? `${first} 외 ${more}명이`
      : `${first}${subjectParticle(first)}`;
    switch (g.kind) {
      case 'hype': return `${subj} 🔥를 보냈어요`;
      case 'comment': return `${subj} 댓글을 남겼어요`;
      case 'comment_reply': return `${subj} 답글을 남겼어요`;
      case 'comment_reaction': return `${subj} 댓글에 반응했어요`;
      case 'mention': return `${subj} 나를 멘션했어요`;
      case 'follow': return `${subj} 팔로우했어요`;
      case 'message': return `${subj} 메시지를 보냈어요`;
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
            const isMulti = g.items.length > 1;
            const isExpanded = expanded.has(g.key);
            // 그룹의 actor 아바타들 (최대 3개 stack)
            const actors = g.items.slice(0, 3).map((n) => getProfile(n.source_user_id)).filter(Boolean);
            return (
              <div key={g.key} className="border-b border-[var(--border)] last:border-b-0">
                <button
                  type="button"
                  onClick={() => handleGroupClick(g)}
                  className={`flex w-full items-center gap-2.5 py-2.5 text-left transition ${
                    g.read_at
                      ? 'pl-1'
                      : 'border-l-[3px] border-l-[var(--accent)] bg-[var(--surface-2)]/40 pl-2.5'
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
                    <p className="line-clamp-2 text-[13px] leading-snug font-bold">
                      {headline}
                    </p>
                    {art?.title && <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">"{art.title}"</p>}
                    <p className="mt-0.5 text-[10px] text-[var(--text-faint)]">{timeAgo(g.latest)}</p>
                  </div>
                  {art && (
                    <ImageBox src={art.imageUrl} alt={art.title} className="h-10 w-10 shrink-0 rounded-[8px]" />
                  )}
                  {isMulti ? (
                    <span
                      className={`shrink-0 text-[var(--text-faint)] transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                      aria-hidden
                    >
                      ›
                    </span>
                  ) : !g.read_at ? (
                    <span className="mt-2 h-2 w-2 shrink-0 self-start rounded-full bg-red-500" />
                  ) : null}
                </button>

                {/* 다중 그룹 펼친 상태 — 개별 알림을 따로 클릭/읽음 처리 */}
                {isMulti && isExpanded && (
                  <div className="ml-12 space-y-0.5 border-l border-[var(--border)] py-1 pl-3">
                    {g.items.map((n) => {
                      const actor = getProfile(n.source_user_id);
                      const name = actor?.nickname || '누군가';
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => handleSingleClick(n, g)}
                          className={`flex w-full items-center gap-2 rounded-[8px] py-1.5 pl-1.5 pr-2 text-left transition hover:bg-[var(--surface-2)] ${
                            n.read_at ? 'text-[var(--text-muted)]' : 'text-[var(--text)]'
                          }`}
                        >
                          <Avatar profile={actor} size={22} />
                          <span className="flex-1 truncate text-[12px] font-semibold">
                            {name}
                            {!n.read_at && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />}
                          </span>
                          <span className="shrink-0 text-[10px] text-[var(--text-faint)]">
                            {timeAgo(n.created_at)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
