import { useMemo } from 'react';
import { useData } from '../lib/data-context';
import {
  Header,
  ImageBox,
  EmptyState,
} from '../components/ui';
import MapView from '../components/MapView';
import { PhotoTile } from '../components/Cards';
import { IconHype } from '../components/icons/AppIcons';

import {
  placeLabel,
} from '../lib/utils';

export default function PlaceExhibition({ placeId, setScreen, openArtwork }) {
  const { getPlace, getPlaceArtworks, getHypeCount } = useData();
  const place = getPlace(placeId);
  const photos = getPlaceArtworks(placeId);

  // 베스트샷 — hype 상위 4컷 (매거진 표지)
  const bestShots = useMemo(() => {
    return [...photos]
      .map((p) => ({ p, hype: getHypeCount(p.id) }))
      .sort((a, b) => b.hype - a.hype || new Date(b.p.created_at) - new Date(a.p.created_at))
      .slice(0, 4)
      .map((s) => s.p);
  }, [photos, getHypeCount]);

  // 자주 등장하는 키워드 — daily_vision 빈도수 top 6
  const topKeywords = useMemo(() => {
    const counts = new Map();
    for (const art of photos) {
      if (!art.daily_vision) continue;
      counts.set(art.daily_vision, (counts.get(art.daily_vision) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [photos]);

  if (!place) return <EmptyState title="공간을 찾을 수 없어요" onAction={() => setScreen('space')} actionLabel="지도로" />;

  return (
    <>
      <Header
        title={place.name || placeLabel(place)}
        subtitle={place.note || place.neighborhood || ''}
        kicker="공간 전시"
        onBack={() => setScreen('space')}
      />
      {photos.length === 0
        ? <EmptyState title="이 공간에는 아직 사진이 없어요" />
        : (
          <div className="space-y-5">
            {/* 매거진 표지 — 베스트샷 4컷 */}
            {bestShots.length >= 1 && (
              <section>
                <div className="mb-2 flex items-baseline justify-between">
                  <h2 className="text-[16px] font-extrabold tracking-[-0.05em]">이 공간의 표지</h2>
                  <span className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                    <IconHype size={10} filled /> 인기순
                  </span>
                </div>
                <div className={`grid gap-1.5 ${bestShots.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {bestShots.map((art, i) => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => openArtwork(art.id)}
                      className={`relative overflow-hidden rounded-[12px] ${i === 0 && bestShots.length > 1 ? 'col-span-2' : ''}`}
                    >
                      <ImageBox
                        src={art.imageUrl}
                        alt={art.title}
                        className={i === 0 && bestShots.length > 1 ? 'h-[220px]' : 'aspect-square w-full'}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-2">
                        <p className="line-clamp-1 text-[12px] font-bold text-white">{art.title}</p>
                      </div>
                      {getHypeCount(art.id) > 0 && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          <IconHype size={10} filled /> {getHypeCount(art.id)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* 자주 등장하는 키워드 */}
            {topKeywords.length > 0 && (
              <section>
                <h2 className="mb-2 text-[16px] font-extrabold tracking-[-0.05em]">이 공간의 단어</h2>
                <div className="flex flex-wrap gap-1.5">
                  {topKeywords.map(([word, n]) => (
                    <span
                      key={word}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold"
                    >
                      #{word}
                      <span className="text-[10px] text-[var(--text-faint)]">{n}</span>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* 지도 */}
            {place.lat != null && place.lng != null && (
              <section>
                <h2 className="mb-2 text-[16px] font-extrabold tracking-[-0.05em]">위치</h2>
                <MapView points={[{ id: place.id, lat: place.lat, lng: place.lng, label: placeLabel(place) }]} height={180} zoom={15} />
              </section>
            )}

            {/* 전체 사진 */}
            <section>
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-[16px] font-extrabold tracking-[-0.05em]">전체 사진</h2>
                <span className="text-[10px] text-[var(--text-muted)]">{photos.length}장</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((art) => <PhotoTile key={art.id} artwork={art} onOpen={openArtwork} />)}
              </div>
            </section>
          </div>
        )}
    </>
  );
}
