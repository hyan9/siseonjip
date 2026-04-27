import { useEffect, useState } from 'react';
import { useData } from '../lib/data-context';
import {
  Header,
  ImageBox,
  EmptyState,
} from '../components/ui';
import Icon from '../components/Icon';
import MapView from '../components/MapView';


import { getCurrentPosition, distanceMeters, searchPlaces } from '../lib/geocoding';
import {
  placeLabel,
} from '../lib/utils';







export default function SpaceScreen({ openPlace, openArtwork }) {
  const { artworks, places, getPlaceArtworks, getRecommendedArtworks } = useData();
  const [myLocation, setMyLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchPlaces(q);
      if (!cancelled) setSearchResults(results);
      setSearching(false);
    }, 350); // debounce
    return () => {
      cancelled = true;
      clearTimeout(timer);
      setSearching(false);
    };
  }, [searchQuery]);

  const flyToResult = (result) => {
    setFlyTarget({ lat: result.lat, lng: result.lng, zoom: 15, _ts: Date.now() });
    setSearchResults([]);
    setSearchQuery(result.shortName || '');
  };

  const placePoints = places
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => {
      const photo = getPlaceArtworks(p.id)[0];
      return {
        id: `place:${p.id}`,
        lat: p.lat,
        lng: p.lng,
        label: placeLabel(p),
        imageUrl: photo?.imageUrl,
        kind: 'place',
        ref: p,
      };
    });

  const exactArtPoints = artworks
    .filter((a) => a.location_mode === '정확한 위치' && a.lat != null && a.lng != null)
    .map((a) => ({
      id: `art:${a.id}`,
      lat: a.lat,
      lng: a.lng,
      label: a.title || '제목 없음',
      imageUrl: a.imageUrl,
      kind: 'artwork',
      ref: a,
    }));

  const points = [...placePoints, ...exactArtPoints];
  const center = myLocation || (points[0] ? { lat: points[0].lat, lng: points[0].lng } : null);

  const handleLocate = async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setMyLocation({ lat: pos.lat, lng: pos.lng });
      setFlyTarget({ lat: pos.lat, lng: pos.lng, zoom: 15, _ts: Date.now() });
    } catch (error) {
      console.warn('locate fail', error);
    } finally {
      setLocating(false);
    }
  };

  // 페이지 진입 시 권한이 이미 있으면 조용히 자동 위치 (denial은 무시)
  useEffect(() => {
    let cancelled = false;
    if (!myLocation && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((p) => {
        if (cancelled) return;
        if (p.state === 'granted') handleLocate();
      }).catch(() => {});
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nearbyPlaces = myLocation
    ? places
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({ ...p, distance: distanceMeters(myLocation.lat, myLocation.lng, p.lat, p.lng) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)
    : [];

  // 내 주변 1km 이내 사진들 (place 좌표 기반)
  const nearbyPhotos = myLocation
    ? artworks
        .filter((a) => a.location_mode !== '숨김')
        .map((a) => {
          let lat = a.lat, lng = a.lng;
          if (lat == null || lng == null) {
            const place = places.find((p) => p.id === a.place_id);
            if (!place || place.lat == null) return null;
            lat = place.lat; lng = place.lng;
          }
          return { ...a, distance: distanceMeters(myLocation.lat, myLocation.lng, lat, lng) };
        })
        .filter((a) => a && a.distance <= 2000)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 12)
    : [];

  return (
    <>
      <Header
        title="지도"
        subtitle="위치를 공유한 사진들이 여기에 걸립니다."
        kicker="공간"
        right={
          <button
            type="button"
            onClick={handleLocate}
            disabled={locating}
            className="rounded-full border border-[var(--ink)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            {locating ? '확인 중' : '내 위치'}
          </button>
        }
      />
      <div className="space-y-5">
        <div className="relative">
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <Icon name="search" size={17} className="text-[var(--text-muted)]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="동네/주소로 검색 (예: 망원동, 이태원)"
              className="w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
            />
            {searching && <span className="text-xs text-[var(--text-muted)]">검색 중…</span>}
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="text-[var(--text-muted)]"
                aria-label="지우기"
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-[18px] bg-[var(--surface)] shadow-[0_8px_24px_rgba(0,0,0,0.12),0_0_0_1px_var(--border)]">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => flyToResult(result)}
                  className="flex w-full items-start gap-2 border-b border-[var(--border)] p-3 text-left last:border-b-0"
                >
                  <Icon name="pin" size={14} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{result.shortName}</p>
                    <p className="truncate text-[11px] text-[var(--text-muted)]">{result.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {!myLocation && (
          <button
            type="button"
            onClick={handleLocate}
            disabled={locating}
            className="flex w-full items-center justify-between gap-3 rounded-[18px] border border-[var(--ink)] bg-[var(--surface)] p-4 text-left disabled:opacity-50"
          >
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">📍 내 위치</p>
              <p className="mt-0.5 text-[15px] font-bold tracking-[-0.04em]">
                {locating ? '위치 확인 중…' : '내 주변 사진 보기'}
              </p>
            </div>
            <span className="text-[var(--ink)]">›</span>
          </button>
        )}

        {myLocation && (
          <section className="rounded-[18px] bg-[var(--ink)] p-4 text-white">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-white/70">📍 내 주변 2km</p>
            <p className="mt-1 text-[20px] font-extrabold tracking-[-0.06em]">
              사진 {nearbyPhotos.length}장 · 동네 {nearbyPlaces.length}곳
            </p>
            {nearbyPhotos.length > 0 && (
              <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
                {nearbyPhotos.map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => openArtwork(art.id)}
                    className="shrink-0 text-left"
                  >
                    <ImageBox src={art.imageUrl} alt={art.title} className="h-[110px] w-[110px] rounded-[12px]" />
                    <p className="mt-1 truncate text-[10px] text-white/80">{Math.round(art.distance)}m</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {points.length === 0 ? (
          <EmptyState
            title="아직 지도에 표시할 사진이 없어요"
            hint="'정확한 위치' 또는 '동네'로 사진을 올리면 자동으로 지도에 표시됩니다."
          />
        ) : (
          <MapView
            points={points}
            center={center}
            flyTarget={flyTarget}
            onMarkerClick={(point) => {
              if (point.kind === 'place') openPlace(point.ref.id);
              else openArtwork(point.ref.id);
            }}
          />
        )}

        {myLocation && nearbyPlaces.length > 0 && (
          <section>
            <h2 className="mb-3 text-[20px] font-extrabold tracking-[-0.07em]">가장 가까운 공간</h2>
            <div className="space-y-2">
              {nearbyPlaces.map((p) => {
                const photos = getPlaceArtworks(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openPlace(p.id)}
                    className="flex w-full items-center gap-3 rounded-[18px] bg-[var(--surface)] p-3 text-left shadow-[0_0_0_1px_var(--border)]"
                  >
                    <ImageBox src={photos[0]?.imageUrl} alt={p.name} className="h-14 w-14 shrink-0 rounded-[12px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold tracking-[-0.04em]">{placeLabel(p)}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {Math.round(p.distance)}m · 사진 {photos.length}장
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 장소별 사진 모음 — 홈에서 옮겨온 "근방 네컷" 영역 */}
        {(() => {
          const placeGroups = places
            .map((p) => ({ place: p, photos: getPlaceArtworks(p.id).slice(0, 4) }))
            .filter((g) => g.photos.length > 0)
            .sort((a, b) => b.photos.length - a.photos.length)
            .slice(0, 12);
          if (placeGroups.length === 0) return null;
          return (
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[20px] font-extrabold tracking-[-0.07em]">장소별 모음</h2>
                <span className="text-[10px] text-[var(--text-faint)]">사진 많은 순</span>
              </div>
              <div className="space-y-3">
                {placeGroups.map(({ place, photos }) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => openPlace(place.id)}
                    className="block w-full overflow-hidden rounded-[18px] bg-[var(--surface)] p-3 text-left shadow-[0_0_0_1px_var(--border)]"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold tracking-[-0.04em]">
                          {placeLabel(place) || '근방'}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          사진 {getPlaceArtworks(place.id).length}장
                        </p>
                      </div>
                      <span className="text-[var(--text-faint)]">›</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {photos.map((art) => (
                        <ImageBox
                          key={art.id}
                          src={art.imageUrl}
                          alt={art.title}
                          className="aspect-square w-full rounded-[8px]"
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })()}
      </div>
    </>
  );
}
