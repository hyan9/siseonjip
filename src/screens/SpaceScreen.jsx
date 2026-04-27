import { useEffect, useState } from 'react';
import { useData } from '../lib/data-context';
import {
  Header,
  ImageBox,
  EmptyState,
} from '../components/ui';
import Icon from '../components/Icon';
import NearbyConstellation from '../components/NearbyConstellation';


import { getCurrentPosition, distanceMeters, searchPlaces } from '../lib/geocoding';
import {
  placeLabel,
  formatDistance,
} from '../lib/utils';







export default function SpaceScreen({ openPlace, openArtwork }) {
  const { artworks, places, getPlaceArtworks } = useData();
  const [myLocation, setMyLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  // 검색 결과로 중심 이동 시 사용 (선택한 동네 = 새 중심)
  const [searchCenter, setSearchCenter] = useState(null);

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

  const handleLocate = async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setMyLocation({ lat: pos.lat, lng: pos.lng });
      setSearchCenter(null);
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

  // 별자리 중심 — 검색해서 옮긴 곳 우선, 없으면 내 위치
  const center = searchCenter || myLocation;
  const centerLabel = searchCenter ? searchCenter.label : (myLocation ? '내 위치' : null);

  const handleSearchPick = (result) => {
    setSearchCenter({ lat: result.lat, lng: result.lng, label: result.shortName || '검색한 동네' });
    setSearchResults([]);
    setSearchQuery(result.shortName || '');
  };

  // 별자리에 표시할 점들 — 사진이 있는 점만 (사진이 별이니까)
  const allPoints = (() => {
    const placePts = places
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => {
        const photo = getPlaceArtworks(p.id)[0];
        if (!photo) return null;
        return {
          id: `place:${p.id}`,
          lat: p.lat,
          lng: p.lng,
          label: placeLabel(p),
          imageUrl: photo.imageUrl,
          kind: 'place',
          ref: p,
        };
      })
      .filter(Boolean);

    const artPts = artworks
      .filter((a) => a.location_mode !== '숨김')
      .map((a) => {
        let lat = a.lat, lng = a.lng;
        if (lat == null || lng == null) {
          const place = places.find((p) => p.id === a.place_id);
          if (!place || place.lat == null) return null;
          lat = place.lat; lng = place.lng;
        }
        return {
          id: `art:${a.id}`,
          lat,
          lng,
          label: a.title || '제목 없음',
          imageUrl: a.imageUrl,
          kind: 'artwork',
          ref: a,
        };
      })
      .filter(Boolean);

    // place 우선이지만 art 도 같이 (artwork에는 imageUrl이 더 풍부)
    return [...artPts, ...placePts];
  })();

  const nearbyPlaces = center
    ? places
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({ ...p, distance: distanceMeters(center.lat, center.lng, p.lat, p.lng) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)
    : [];

  return (
    <>
      <Header
        title="별자리"
        subtitle="내 주변 사진들을 별처럼 띄워봤어요."
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
                onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchCenter(null); }}
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
                  onClick={() => handleSearchPick(result)}
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

        {!center && (
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

        {center && (
          <section className="rounded-[24px] bg-[var(--surface)] py-5 shadow-[0_0_0_1px_var(--border)]">
            <div className="mb-2 flex items-center justify-between px-4">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">
                ✦ {centerLabel} 주변
              </p>
              {searchCenter && (
                <button
                  type="button"
                  onClick={() => { setSearchCenter(null); setSearchQuery(''); }}
                  className="text-[10px] font-semibold text-[var(--text-muted)] underline"
                >
                  내 위치로
                </button>
              )}
            </div>
            {allPoints.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12px] text-[var(--text-muted)]">
                아직 별이 없어요. 위치를 켠 사진이 올라오면 여기로 떠올라요.
              </p>
            ) : (
              <NearbyConstellation
                center={center}
                points={allPoints}
                onPhotoClick={(point) => {
                  if (point.kind === 'place') openPlace(point.ref.id);
                  else openArtwork(point.ref.id);
                }}
              />
            )}
          </section>
        )}

        {center && nearbyPlaces.length > 0 && (
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
                        {formatDistance(p.distance)} · 사진 {photos.length}장
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {!center && allPoints.length === 0 && (
          <EmptyState
            title="아직 별자리에 띄울 사진이 없어요"
            hint="'정확한 위치' 또는 '동네'로 사진을 올리면 자동으로 별이 됩니다."
          />
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
