import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import Icon from './Icon';
import { searchPlaces } from '../lib/geocoding';

function LocationClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

export default function LocationPickerModal({ initialLat, initialLng, onConfirm, onClose }) {
  const [picked, setPicked] = useState(
    initialLat != null && initialLng != null ? { lat: initialLat, lng: initialLng } : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) { setSearchResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchPlaces(q);
      if (!cancelled) setSearchResults(results);
      setSearching(false);
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); setSearching(false); };
  }, [searchQuery]);

  const fallbackCenter = picked
    ? [picked.lat, picked.lng]
    : initialLat != null
    ? [initialLat, initialLng]
    : [37.5665, 126.978];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[var(--bg)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <p className="text-sm font-semibold">위치 선택 (지도 탭)</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-2)]"
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      <div className="relative px-4 pt-3">
        <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5">
          <Icon name="search" size={15} className="text-[var(--text-muted)]" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="동네/주소 검색"
            className="w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
          />
          {searching && <span className="text-xs text-[var(--text-muted)]">검색 중…</span>}
        </div>
        {searchResults.length > 0 && (
          <div className="absolute inset-x-4 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-[14px] bg-[var(--surface)] shadow-[0_8px_24px_rgba(0,0,0,0.12),0_0_0_1px_var(--border)]">
            {searchResults.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setPicked({ lat: r.lat, lng: r.lng });
                  setSearchResults([]);
                  setSearchQuery(r.shortName || '');
                }}
                className="block w-full border-b border-[var(--border)] p-3 text-left last:border-b-0"
              >
                <p className="truncate text-sm font-semibold">{r.shortName}</p>
                <p className="truncate text-[11px] text-[var(--text-muted)]">{r.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-3">
        <div className="h-full overflow-hidden rounded-[20px] shadow-[0_0_0_1px_var(--border-strong)]">
          <MapContainer
            center={fallbackCenter}
            zoom={picked ? 15 : 12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; OSM'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationClickHandler onPick={setPicked} />
            {picked && <Marker position={[picked.lat, picked.lng]} />}
          </MapContainer>
        </div>
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <p className="text-xs text-[var(--text-muted)]">
          {picked
            ? `좌표: ${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)} — 지도를 다시 탭해서 변경 가능`
            : '지도를 탭하거나 검색해서 위치를 선택하세요'}
        </p>
        <button
          type="button"
          onClick={() => picked && onConfirm(picked)}
          disabled={!picked}
          className="mt-3 w-full rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          이 위치로 설정
        </button>
      </div>
    </div>
  );
}
