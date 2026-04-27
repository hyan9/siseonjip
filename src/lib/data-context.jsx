import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchProfiles,
  fetchPlaces,
  fetchArtworks,
  fetchComments,
  fetchHypes,
  fetchCurateSlots,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [p, pl, a, c, h, cs] = await Promise.all([
        fetchProfiles(),
        fetchPlaces(),
        fetchArtworks(),
        fetchComments(),
        fetchHypes(),
        fetchCurateSlots(),
      ]);
      setProfiles(p);
      setPlaces(pl);
      setArtworks(a);
      setComments(c);
      setHypes(h);
      setCurateSlots(cs);
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
      imageUrl: publicPhotoUrl(art.storage_path),
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
      getProfile,
      getPlace,
      getArtwork,
      getUserArtworks,
      getPlaceArtworks,
      getCommentsFor,
      getHypeCount,
      isHypedByMe,
      getCurateForUser,
      setProfiles,
      setPlaces,
      setArtworks,
      setComments,
      setHypes,
      setCurateSlots,
    };
  }, [profiles, places, artworks, comments, hypes, curateSlots, session?.user?.id, loading, error, refresh]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
