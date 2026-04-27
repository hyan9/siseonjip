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
  publicPhotoUrl,
} from './db';
import { useAuth } from './auth-context';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [p, pl, a, c, h, cs, f, cr] = await Promise.all([
        fetchProfiles(),
        fetchPlaces(),
        fetchArtworks(),
        fetchComments(),
        fetchHypes(),
        fetchCurateSlots(),
        fetchFollows().catch(() => []),
        fetchCommentReactions().catch(() => []),
      ]);
      setProfiles(p);
      setPlaces(pl);
      setArtworks(a);
      setComments(c);
      setHypes(h);
      setCurateSlots(cs);
      setFollows(f);
      setCommentReactions(cr);
    } catch (err) {
      console.error('[data] refresh 실패', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, session?.user?.id]);

  const value = useMemo(() => {
    const userId = session?.user?.id ?? null;

    const enrichedArtworks = artworks.map((art) => ({
      ...art,
      imageUrl: art.image_url || publicPhotoUrl(art.storage_path),
    }));

    const getProfile = (id) => profiles.find((p) => p.id === id) || null;
    const getPlace = (id) => places.find((p) => p.id === id) || null;
    const getArtwork = (id) => enrichedArtworks.find((a) => a.id === id) || null;
    const getUserArtworks = (uid) => enrichedArtworks.filter((a) => a.user_id === uid);
    const getPlaceArtworks = (pid) =>
      enrichedArtworks.filter((a) => a.place_id === pid && a.location_mode !== '숨김');
    const getCommentsFor = (artworkId) => comments.filter((c) => c.artwork_id === artworkId);
    const getHypeCount = (artworkId) => hypes.filter((h) => h.artwork_id === artworkId).length;
    const isHypedByMe = (artworkId) =>
      userId != null && hypes.some((h) => h.artwork_id === artworkId && h.user_id === userId);

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
      comments.filter((c) => c.artwork_id === artworkId && !c.parent_id);
    const getRepliesFor = (commentId) =>
      comments
        .filter((c) => c.parent_id === commentId)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const getCommentReactionCount = (commentId) =>
      commentReactions.filter((r) => r.comment_id === commentId).length;
    const isCommentLikedByMe = (commentId) =>
      userId != null && commentReactions.some(
        (r) => r.comment_id === commentId && r.user_id === userId
      );

    const getFollowers = (uid) => follows.filter((f) => f.followee_id === uid);
    const getFollowing = (uid) => follows.filter((f) => f.follower_id === uid);
    const isFollowing = (targetId) =>
      userId != null && follows.some(
        (f) => f.follower_id === userId && f.followee_id === targetId
      );

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
      profiles,
      places,
      artworks: enrichedArtworks,
      comments,
      hypes,
      curateSlots,
      follows,
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
    };
  }, [profiles, places, artworks, comments, hypes, curateSlots, follows, commentReactions, session?.user?.id, loading, error, refresh]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
