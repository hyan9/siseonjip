import { useData } from '../lib/data-context';
import { ImageBox } from './ui';

function ExhibitionSlot({ artwork, onOpen, large = false }) {
  return (
    <button
      type="button"
      onClick={() => artwork && onOpen(artwork.id)}
      className={`group relative overflow-hidden bg-[var(--surface-3)] text-left ${large ? 'rounded-[24px]' : 'rounded-[18px]'} ${!artwork ? 'border border-dashed border-[var(--border-dashed)]' : ''}`}
    >
      {artwork ? (
        <>
          <ImageBox src={artwork.imageUrl} alt={artwork.title} className="h-full w-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
            <p className="line-clamp-2 text-sm font-semibold leading-5 text-white">{artwork.title}</p>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] text-[var(--text-faint)]">빈 벽</div>
      )}
    </button>
  );
}

export function FourPhotoWall({ photos, onOpen, mini = false, compact = false }) {
  const slots = [photos[0], photos[1], photos[2], photos[3]];
  return (
    <div className={`grid grid-cols-2 gap-1.5 overflow-hidden ${mini ? 'h-[150px]' : compact ? 'h-[204px]' : 'h-[254px]'}`}>
      <div className="grid min-h-0 grid-rows-2 gap-1.5">
        <ExhibitionSlot artwork={slots[0]} onOpen={onOpen} large />
        <ExhibitionSlot artwork={slots[1]} onOpen={onOpen} large />
      </div>
      <div className="grid min-h-0 grid-rows-2 gap-1.5">
        <ExhibitionSlot artwork={slots[2]} onOpen={onOpen} large />
        <ExhibitionSlot artwork={slots[3]} onOpen={onOpen} large />
      </div>
    </div>
  );
}

export function PhotoTile({ artwork, onOpen }) {
  const { getHypeCount } = useData();
  const hypes = getHypeCount(artwork.id);
  return (
    <button type="button" onClick={() => onOpen(artwork.id)} className="overflow-hidden rounded-[20px] bg-[var(--surface)] text-left shadow-[0_0_0_1px_var(--border)]">
      <div className="relative">
        <ImageBox src={artwork.imageUrl} alt={artwork.title} className="h-44" />
        {hypes > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">🔥 {hypes}</span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold tracking-[-0.04em]">{artwork.title || '제목 없음'}</p>
        {artwork.daily_vision && <p className="mt-1 text-[11px] text-[var(--text-faint)]">#{artwork.daily_vision}</p>}
      </div>
    </button>
  );
}

export function PersonRow({ profile, onOpen }) {
  const { getUserArtworks } = useData();
  const works = getUserArtworks(profile.id);
  const main = works.find((art) => art.is_twenty_five) || works[0];
  return (
    <button type="button" onClick={() => onOpen(profile.id)} className="flex w-full gap-3 rounded-[22px] bg-[var(--surface)] p-3 text-left shadow-[0_0_0_1px_var(--border)]">
      <ImageBox src={main?.imageUrl} alt={profile.nickname} className="h-20 w-20 shrink-0 rounded-[16px]" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">{profile.nickname}</p>
        <h3 className="mt-1 text-lg font-bold tracking-[-0.05em]">{profile.exhibition_title || '제목 미정'}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--text-muted)]">{profile.bio || ''}</p>
      </div>
    </button>
  );
}

export function PlaceRow({ place, onOpen }) {
  const { getPlaceArtworks } = useData();
  const photo = getPlaceArtworks(place.id)[0];
  return (
    <button type="button" onClick={() => onOpen(place.id)} className="flex w-full gap-3 rounded-[22px] bg-[var(--surface)] p-3 text-left shadow-[0_0_0_1px_var(--border)]">
      <ImageBox src={photo?.imageUrl} alt={place.name} className="h-20 w-20 shrink-0 rounded-[16px]" />
      <div>
        <p className="text-lg font-bold tracking-[-0.05em]">{place.name || '이름 없는 공간'}</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{place.neighborhood || '미상'}</p>
      </div>
    </button>
  );
}
