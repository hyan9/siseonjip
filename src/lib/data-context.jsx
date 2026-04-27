import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchProfiles,
  fetchPlaces,
  fetchArtworks,
  fetchComments,
  fetchHypes,
  fetchCurateSlots,
  fetchFollows,
  fetchCommentReactions,
  fetchSaves,
  fetchCollections,
  fetchCollectionItems,
  fetchMessagesFor,
  fetchBlocks,
  publicPhotoUrl,
} from './db';
import { useAuth } from './auth-context';
import { buildBotMemoryGraph } from './bot-seed';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { session } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [places, setPlaces] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [comments, setComments] = useState([]);
  const [hypes, setHypes] = useState([]);
  const [curateSlots, setCurateSlots] = useState([]);
  const [follows, setFollows] = useState([]);
  const [commentReactions, setCommentReactions] = useState([]);
  const [saves, setSaves] = useState([]);
  const [collections, setCollections] = useState([]);
  const [collectionItems, setCollectionItems] = useState([]);
  const [messages, setMessages] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userIdRef = session?.user?.id ?? null;

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [p, pl, a, c, h, cs, f, cr, sv, col, ci, msgs, bl] = await Promise.all([
        fetchProfiles(),
        fetchPlaces(),
        fetchArtworks(),
        fetchComments(),
        fetchHypes(),
        fetchCurateSlots(),
        fetchFollows().catch(() => []),
        fetchCommentReactions().catch(() => []),
        userIdRef ? fetchSaves(userIdRef).catch(() => []) : Promise.resolve([]),
        fetchCollections().catch(() => []),
        fetchCollectionItems().catch(() => []),
        userIdRef ? fetchMessagesFor(userIdRef).catch(() => []) : Promise.resolve([]),
        userIdRef ? fetchBlocks(userIdRef).catch(() => []) : Promise.resolve([]),
      ]);
      setProfiles(p);
      setPlaces(pl);
      setArtworks(a);
      setComments(c);
      setHypes(h);
      setCurateSlots(cs);
      setFollows(f);
      setCommentReactions(cr);
      setSaves(sv);
      setCollections(col);
      setCollectionItems(ci);
      setMessages(msgs);
      setBlocks(bl);
    } catch (err) {
      console.error('[data] refresh 실패', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userIdRef]);

  useEffect(() => {
    refresh();
  }, [refresh, session?.user?.id]);

  const value = useMemo(() => {
    const userId = session?.user?.id ?? null;

    // 데모 봇 시드 — 실제 DB는 그대로 두고 메모리에서만 머지
    // (팔로우/팔로잉, 추천 피드가 처음에도 비어있지 않게)
    const bot = buildBotMemoryGraph(userId);
    const mergedProfiles = [...profiles, ...bot.profiles];
    const mergedArtworks = [...artworks, ...bot.artworks];
    const mergedFollows = [...follows, ...bot.follows];
    const mergedHypes = [...hypes, ...bot.hypes];
    const mergedComments = [...comments, ...bot.comments];

    const enrichedArtworks = mergedArtworks.map((art) => ({
      ...art,
      imageUrl: art.image_url || publicPhotoUrl(art.storage_path),
    }));

    const getProfile = (id) => mergedProfiles.find((p) => p.id === id) || null;
    const getPlace = (id) => places.find((p) => p.id === id) || null;
    const getArtwork = (id) => enrichedArtworks.find((a) => a.id === id) || null;
    const getUserArtworks = (uid) => enrichedArtworks.filter((a) => a.user_id === uid);
    const getPlaceArtworks = (pid) =>
      enrichedArtworks.filter((a) => a.place_id === pid && a.location_mode !== '숨김');
    const getCommentsFor = (artworkId) => mergedComments.filter((c) => c.artwork_id === artworkId);
    const getHypeCount = (artworkId) => mergedHypes.filter((h) => h.artwork_id === artworkId).length;
    const isHypedByMe = (artworkId) =>
      userId != null && mergedHypes.some((h) => h.artwork_id === artworkId && h.user_id === userId);

    const getCurateForUser = (uid) => {
      const slots = curateSlots
        .filter((s) => s.user_id === uid)
        .sort((a, b) => a.position - b.position);
      if (slots.length > 0) {
        return slots.map((s) => getArtwork(s.artwork_id)).filter(Boolean);
      }
      return getUserArtworks(uid).slice(0, 4);
    };

    // 답글 처리: parent_id 있는 건 자식, 없는 건 최상위
    const getRootCommentsFor = (artworkId) =>
      mergedComments.filter((c) => c.artwork_id === artworkId && !c.parent_id);
    const getRepliesFor = (commentId) =>
      mergedComments
        .filter((c) => c.parent_id === commentId)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const getCommentReactionCount = (commentId) =>
      commentReactions.filter((r) => r.comment_id === commentId).length;
    const isCommentLikedByMe = (commentId) =>
      userId != null && commentReactions.some(
        (r) => r.comment_id === commentId && r.user_id === userId
      );

    const getFollowers = (uid) => mergedFollows.filter((f) => f.followee_id === uid);
    const getFollowing = (uid) => mergedFollows.filter((f) => f.follower_id === uid);
    const isFollowing = (targetId) =>
      userId != null && mergedFollows.some(
        (f) => f.follower_id === userId && f.followee_id === targetId
      );

    // 추천 알고리즘: 최신성 + 인기 + 팔로잉 보너스 + 키워드 친화도
    const myFollowingSet = new Set(getFollowing(userId).map((f) => f.followee_id));
    const myHypedArtworks = mergedHypes.filter((h) => h.user_id === userId).map((h) => h.artwork_id);
    const myKeywordCounts = new Map();
    for (const aid of myHypedArtworks) {
      const art = enrichedArtworks.find((a) => a.id === aid);
      if (art?.daily_vision) {
        myKeywordCounts.set(art.daily_vision, (myKeywordCounts.get(art.daily_vision) ?? 0) + 1);
      }
    }
    const myTopKeywords = new Set(
      Array.from(myKeywordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k]) => k)
    );
    const now = Date.now();

    const scoreArtwork = (art) => {
      const ageDays = (now - new Date(art.created_at).getTime()) / 86400000;
      const recency = Math.max(0, 1 - ageDays / 30);
      const hypeCount = getHypeCount(art.id);
      const hypeScore = Math.log(1 + hypeCount) / Math.log(11); // 0~1, hype 10에서 ~1.0
      const followBonus = myFollowingSet.has(art.user_id) ? 0.4 : 0;
      const keywordBonus = art.daily_vision && myTopKeywords.has(art.daily_vision) ? 0.25 : 0;
      const selfPenalty = art.user_id === userId ? -0.5 : 0;
      return recency * 0.5 + hypeScore * 0.6 + followBonus + keywordBonus + selfPenalty;
    };

    const getRecommendedArtworks = (limit = 12) => {
      const candidates = enrichedArtworks
        .filter((a) => a.location_mode !== '숨김')
        .filter((a) => !blockedSet.has(a.user_id))
        .map((art) => ({ art, score: scoreArtwork(art) }))
        .sort((a, b) => b.score - a.score);

      // 다양성: 같은 작가 연속 노출 방지
      const result = [];
      const perUser = new Map();
      for (const { art } of candidates) {
        const used = perUser.get(art.user_id) ?? 0;
        if (used >= 2) continue;
        result.push(art);
        perUser.set(art.user_id, used + 1);
        if (result.length >= limit) break;
      }
      return result;
    };

    const getRecommendedCreators = (limit = 6) => {
      // 작가 점수 = 받은 hype 합 + 최근 작품 보너스 + 자기 자신 제외 + 차단 제외
      return mergedProfiles
        .filter((p) => p.id !== userId && !blockedSet.has(p.id))
        .map((p) => {
          const works = enrichedArtworks.filter((a) => a.user_id === p.id);
          const totalHype = works.reduce((sum, art) => sum + getHypeCount(art.id), 0);
          const recentBoost = works.some(
            (a) => (now - new Date(a.created_at).getTime()) < 7 * 86400000
          ) ? 1 : 0;
          const followingBonus = myFollowingSet.has(p.id) ? 0 : 1; // 아직 팔로잉 안 한 사람 우선
          return { profile: p, score: totalHype + recentBoost * 2 + followingBonus, totalHype };
        })
        .filter((entry) => entry.totalHype > 0 || enrichedArtworks.some((a) => a.user_id === entry.profile.id))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    };

    const blockedSet = new Set(blocks.filter((b) => b.blocker_id === userId).map((b) => b.blocked_id));
    const isBlocked = (otherId) => userId != null && blockedSet.has(otherId);

    const isSavedByMe = (artworkId) =>
      userId != null && saves.some((s) => s.artwork_id === artworkId && s.user_id === userId);

    const getCollectionsByUser = (uid) => collections.filter((c) => c.user_id === uid);
    const getCollection = (id) => collections.find((c) => c.id === id) || null;
    const getCollectionArtworks = (collectionId) =>
      collectionItems
        .filter((ci) => ci.collection_id === collectionId)
        .sort((a, b) => a.position - b.position)
        .map((ci) => getArtwork(ci.artwork_id))
        .filter(Boolean);
    const isInCollection = (collectionId, artworkId) =>
      collectionItems.some((ci) => ci.collection_id === collectionId && ci.artwork_id === artworkId);

    // DM helpers
    const getConversations = () => {
      if (!userId) return [];
      const map = new Map();
      for (const m of messages) {
        const other = m.sender_id === userId ? m.recipient_id : m.sender_id;
        if (!other) continue;
        const existing = map.get(other);
        const isUnread = m.recipient_id === userId && !m.read_at;
        if (!existing || new Date(m.created_at) > new Date(existing.lastAt)) {
          map.set(other, {
            otherId: other,
            lastText: m.text,
            lastAt: m.created_at,
            lastFromMe: m.sender_id === userId,
            unread: existing?.unread ?? 0,
          });
        }
        if (isUnread) {
          const e = map.get(other);
          if (e) e.unread = (e.unread ?? 0) + 1;
        }
      }
      return Array.from(map.values()).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
    };
    const getThread = (otherId) => {
      if (!userId || !otherId) return [];
      return messages
        .filter(
          (m) =>
            (m.sender_id === userId && m.recipient_id === otherId) ||
            (m.sender_id === otherId && m.recipient_id === userId)
        )
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    };
    const totalUnreadMessages = messages.filter((m) => m.recipient_id === userId && !m.read_at).length;

    // 차단 필터: 차단한 사람의 콘텐츠는 보지 않음
    const visible = (uid) => !isBlocked(uid);

    const getSavedArtworks = () => {
      const ids = saves
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((s) => s.artwork_id);
      return ids.map((id) => getArtwork(id)).filter(Boolean);
    };

    const getMyActivity = (limit = 50) => {
      if (!userId) return [];
      const myHypes = mergedHypes
        .filter((h) => h.user_id === userId)
        .map((h) => ({ kind: 'hype', artwork_id: h.artwork_id, created_at: h.created_at }));
      const myComments = comments
        .filter((c) => c.user_id === userId)
        .map((c) => ({ kind: c.parent_id ? 'reply' : 'comment', artwork_id: c.artwork_id, comment_id: c.id, text: c.text, created_at: c.created_at }));
      const mySaves = saves
        .filter((s) => s.user_id === userId)
        .map((s) => ({ kind: 'save', artwork_id: s.artwork_id, created_at: s.created_at }));
      const myFollows = mergedFollows
        .filter((f) => f.follower_id === userId)
        .map((f) => ({ kind: 'follow', followee_id: f.followee_id, created_at: f.created_at }));
      const myReactions = commentReactions
        .filter((r) => r.user_id === userId)
        .map((r) => {
          const c = comments.find((cc) => cc.id === r.comment_id);
          return { kind: 'comment_reaction', comment_id: r.comment_id, artwork_id: c?.artwork_id, created_at: r.created_at };
        });

      return [...myHypes, ...myComments, ...mySaves, ...myFollows, ...myReactions]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
    };

    const getStats = (uid) => {
      const userArts = getUserArtworks(uid);
      let totalHype = 0;
      let topArtwork = null;
      let topCount = -1;
      for (const art of userArts) {
        const count = getHypeCount(art.id);
        totalHype += count;
        if (count > topCount) {
          topCount = count;
          topArtwork = art;
        }
      }
      const totalComments = comments.filter(
        (c) => userArts.some((a) => a.id === c.artwork_id) && c.user_id !== uid
      ).length;
      return {
        artworkCount: userArts.length,
        totalHype,
        totalComments,
        topArtwork,
        followerCount: getFollowers(uid).length,
        followingCount: getFollowing(uid).length,
      };
    };

    return {
      loading,
      error,
      refresh,
      userId,
      profiles: mergedProfiles,
      places,
      artworks: enrichedArtworks,
      comments: mergedComments,
      hypes: mergedHypes,
      curateSlots,
      follows: mergedFollows,
      commentReactions,
      getProfile,
      getPlace,
      getArtwork,
      getUserArtworks,
      getPlaceArtworks,
      getCommentsFor,
      getRootCommentsFor,
      getRepliesFor,
      getHypeCount,
      isHypedByMe,
      getCurateForUser,
      getCommentReactionCount,
      isCommentLikedByMe,
      getFollowers,
      getFollowing,
      isFollowing,
      getStats,
      getRecommendedArtworks,
      getRecommendedCreators,
      saves,
      isSavedByMe,
      getSavedArtworks,
      getMyActivity,
      // 컬렉션
      collections,
      collectionItems,
      getCollectionsByUser,
      getCollection,
      getCollectionArtworks,
      isInCollection,
      // DM
      messages,
      getConversations,
      getThread,
      totalUnreadMessages,
      // 차단
      blocks,
      isBlocked,
      visible,
    };
  }, [profiles, places, artworks, comments, hypes, curateSlots, follows, commentReactions, saves, collections, collectionItems, messages, blocks, session?.user?.id, loading, error, refresh]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
