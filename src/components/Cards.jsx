import { useData } from '../lib/data-context';
import { ImageBox } from './ui';
import { profileLabel, timeAgo } from '../lib/utils';
import { IconHype } from './icons/AppIcons';

function ExhibitionSlot({ artwork, onOpen }) {
  if (!artwork) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(artwork.id)}
      className="group relative h-full w-full overflow-hidden rounded-[20px] bg-[var(--surface-3)] text-left"
    >
      <ImageBox src={artwork.imageUrl} alt={artwork.title} className="h-full w-full" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-white">{artwork.title}</p>
      </div>
    </button>
  );
}

export function FourPhotoWall({ photos, onOpen, mini = false, compact = false }) {
  const list = photos.filter(Boolean);
  const count = list.length;
  const heightClass = mini ? 'h-[150px]' : compact ? 'h-[204px]' : 'h-[254px]';

  if (count === 0) return null;

  if (count === 1) {
    return (
      <div className={heightClass}>
        <ExhibitionSlot artwork={list[0]} onOpen={onOpen} />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className={`grid grid-cols-2 gap-1.5 ${heightClass}`}>
        <ExhibitionSlot artwork={list[0]} onOpen={onOpen} />
        <ExhibitionSlot artwork={list[1]} onOpen={onOpen} />
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className={`grid grid-cols-2 gap-1.5 ${heightClass}`}>
        <ExhibitionSlot artwork={list[0]} onOpen={onOpen} />
        <div className="grid min-h-0 grid-rows-2 gap-1.5">
          <ExhibitionSlot artwork={list[1]} onOpen={onOpen} />
          <ExhibitionSlot artwork={list[2]} onOpen={onOpen} />
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-1.5 overflow-hidden ${heightClass}`}>
      <div className="grid min-h-0 grid-rows-2 gap-1.5">
        <ExhibitionSlot artwork={list[0]} onOpen={onOpen} />
        <ExhibitionSlot artwork={list[1]} onOpen={onOpen} />
      </div>
      <div className="grid min-h-0 grid-rows-2 gap-1.5">
        <ExhibitionSlot artwork={list[2]} onOpen={onOpen} />
        <ExhibitionSlot artwork={list[3]} onOpen={onOpen} />
      </div>
    </div>
  );
}

export function PostListRow({ artwork, onOpen }) {
  const { getProfile, getHypeCount, getCommentsFor } = useData();
  const profile = getProfile(artwork.user_id);
  const hype = getHypeCount(artwork.id);
  const commentCount = getCommentsFor(artwork.id).length;
  const hot = hype >= 5;

  return (
    <button
      type="button"
      onClick={() => onOpen(artwork.id)}
      className="flex w-full items-stretch gap-3 px-3 py-3 text-left hover:bg-[var(--surface-2)]/40"
    >
      {/* 썸네일 — 좌측 고정 */}
      <ImageBox
        src={artwork.imageUrl}
        alt={artwork.title}
        className="h-[60px] w-[60px] shrink-0 rounded-[6px]"
      />
      {/* 본문 — 좌측 정렬축 (제목 / 메타) */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <p className="line-clamp-1 text-[15px] font-extrabold leading-tight tracking-[-0.04em] text-[var(--text)]">
          {hot && (
            <span className="mr-1 inline-flex align-[-2px] text-[var(--accent)]">
              <IconHype size={13} filled />
            </span>
          )}
          {artwork.title}
          {commentCount > 0 && (
            <span className="ml-1 align-baseline text-[12px] font-extrabold text-[var(--accent)]">
              [{commentCount}]
            </span>
          )}
        </p>
        <p className="flex items-center gap-1.5 text-[11px] leading-tight text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1 truncate font-semibold text-[var(--text-body)]">
            {profileLabel(profile)}
            {profile?.is_bot && (
              <span className="rounded-[3px] border border-[var(--border-strong)] px-1 text-[8px] font-bold uppercase tracking-wider text-[var(--text-faint)]">demo</span>
            )}
          </span>
          <span className="text-[var(--text-faint)]">·</span>
          <span className="shrink-0">{timeAgo(artwork.created_at)}</span>
          {hype > 0 && (
            <>
              <span className="text-[var(--text-faint)]">·</span>
              <span className="inline-flex shrink-0 items-center gap-0.5 font-semibold text-[var(--ink)]">
                <IconHype size={10} filled /> {hype}
              </span>
            </>
          )}
          {artwork.view_count > 0 && (
            <>
              <span className="text-[var(--text-faint)]">·</span>
              <span className="shrink-0">조회 {artwork.view_count}</span>
            </>
          )}
        </p>
      </div>
    </button>
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
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
            <IconHype size={11} filled /> {hypes}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold tracking-[-0.04em]">{artwork.title}</p>
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
        <h3 className="mt-1 text-lg font-bold tracking-[-0.05em]">{profile.exhibition_title || profile.nickname}</h3>
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
        <p className="text-lg font-bold tracking-[-0.05em]">{place.name || place.neighborhood || '근방'}</p>
        {place.neighborhood && place.neighborhood !== place.name && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{place.neighborhood}</p>
        )}
      </div>
    </button>
  );
}
