import { useEffect, useState } from 'react';
import { useData } from '../lib/data-context';
import {
  Header,
  ImageBox,
  GpsStatusBadge,
} from '../components/ui';
import Icon from '../components/Icon';
import LocationPickerModal from '../components/LocationPickerModal';
import {
  uploadPhoto,
  upsertPlace,
  insertArtwork,
  setCurateOrder,
  deleteArtwork,
} from '../lib/db';
import { readPhotoMeta } from '../lib/exif';
import { CatSleepyFour as MascotSleepyFour } from '../components/Mascot';
import { reverseGeocode, getCurrentPosition } from '../lib/geocoding';
import {
  LOCATION_MODES,
} from '../lib/utils';







async function processPickedFile(file) {
  const previewUrl = URL.createObjectURL(file);
  const meta = await readPhotoMeta(file);
  let neighborhood = null;
  if (meta.lat != null && meta.lng != null) {
    const geo = await reverseGeocode(meta.lat, meta.lng).catch(() => null);
    neighborhood = geo?.neighborhood ?? null;
  }
  const localId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `f-${Date.now()}-${Math.random()}`;
  return {
    localId,
    file,
    previewUrl,
    gpsStatus: meta.status,
    gpsSource: meta.lat != null ? 'exif' : null,
    gps: { lat: meta.lat, lng: meta.lng },
    takenAt: meta.takenAt,
    cameraMake: meta.cameraMake,
    cameraModel: meta.cameraModel,
    lens: meta.lens,
    neighborhood,
    title: '',
  };
}

export default function RecordScreen({ setScreen, openArtwork }) {
  const { userId, places, getUserArtworks, refresh } = useData();
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState('동네');
  const [dailyVision, setDailyVision] = useState('');
  const [sharedNote, setSharedNote] = useState('');
  const [setAsCurate, setSetAsCurate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [locatingId, setLocatingId] = useState(null);
  const [pinPickingId, setPinPickingId] = useState(null);

  useEffect(() => {
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 오늘 이미 올린 사진 + 현재 추가 중인 사진 합산이 4를 넘기지 않도록
  const myWorksAll = userId ? getUserArtworks(userId) : [];
  const todayKeyEarly = new Date().toLocaleDateString('ko-KR');
  const todayCountEarly = myWorksAll.filter(
    (a) => new Date(a.created_at).toLocaleDateString('ko-KR') === todayKeyEarly
  ).length;
  const dailyCap = Math.max(0, 4 - todayCountEarly);
  const remaining = Math.max(0, dailyCap - items.length);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, remaining);
    event.target.value = '';
    if (files.length === 0) return;
    const processed = await Promise.all(files.map(processPickedFile));
    setItems((prev) => [...prev, ...processed].slice(0, dailyCap));
  };

  const removeItem = (localId) => {
    setItems((prev) => {
      const item = prev.find((i) => i.localId === localId);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.localId !== localId);
    });
  };

  const updateItem = (localId, patch) => {
    setItems((prev) => prev.map((i) => (i.localId === localId ? { ...i, ...patch } : i)));
  };

  const useMyLocationFor = async (localId) => {
    setLocatingId(localId);
    try {
      const pos = await getCurrentPosition();
      const geo = await reverseGeocode(pos.lat, pos.lng).catch(() => null);
      updateItem(localId, {
        gps: { lat: pos.lat, lng: pos.lng },
        gpsStatus: 'found',
        gpsSource: 'manual',
        neighborhood: geo?.neighborhood ?? null,
      });
    } catch (err) {
      alert('위치 권한이 필요해요: ' + (err.message || ''));
    } finally {
      setLocatingId(null);
    }
  };

  const handlePinConfirm = async ({ lat, lng }) => {
    if (!pinPickingId) return;
    const geo = await reverseGeocode(lat, lng).catch(() => null);
    updateItem(pinPickingId, {
      gps: { lat, lng },
      gpsStatus: 'found',
      gpsSource: 'manual',
      neighborhood: geo?.neighborhood ?? null,
    });
    setPinPickingId(null);
  };

  const useMyLocationForAll = async () => {
    const without = items.filter((it) => it.gps.lat == null);
    if (without.length === 0) return;
    if (!window.confirm(`위치 없는 사진 ${without.length}장에 현재 내 위치를 적용할까요?`)) return;
    try {
      const pos = await getCurrentPosition();
      const geo = await reverseGeocode(pos.lat, pos.lng).catch(() => null);
      setItems((prev) =>
        prev.map((it) =>
          it.gps.lat == null
            ? {
                ...it,
                gps: { lat: pos.lat, lng: pos.lng },
                gpsStatus: 'found',
                gpsSource: 'manual',
                neighborhood: geo?.neighborhood ?? null,
              }
            : it
        )
      );
    } catch (err) {
      alert('위치 권한이 필요해요: ' + (err.message || ''));
    }
  };

  // 오늘 이미 올린 사진 수 (하루 4장 cap)
  const todayWorks = myWorksAll
    .filter((a) => new Date(a.created_at).toLocaleDateString('ko-KR') === todayKeyEarly)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const todayCount = todayCountEarly;
  const dailyRemaining = dailyCap;

  const [deletingId, setDeletingId] = useState(null);
  const handleDeleteToday = async (artwork) => {
    if (!userId) return;
    if (!window.confirm('이 사진을 삭제할까요?')) return;
    setDeletingId(artwork.id);
    try {
      await deleteArtwork(artwork.id, userId, artwork.storage_path);
      await refresh();
    } catch (err) {
      alert('삭제 실패: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveAll = async () => {
    if (items.length === 0 || !userId) return;
    const missingTitle = items.find((it) => !it.title?.trim());
    if (missingTitle) {
      alert('각 사진에 제목을 한 글자 이상 적어주세요.');
      return;
    }
    if (items.length > dailyRemaining) {
      alert(`카든냥은 하루 4장이 한도예요. 오늘 ${todayCount}장 올렸고 ${dailyRemaining}장만 더 올릴 수 있어요.`);
      return;
    }
    setBusy(true);
    setError(null);
    setProgress({ done: 0, total: items.length });
    try {
      const createdIds = [];
      let placesCache = [...places];
      for (const item of items) {
        const storagePath = await uploadPhoto(userId, item.file);
        const shareLocation = mode === '정확한 위치' || mode === '동네';
        let placeId = null;
        if (shareLocation && item.gps.lat != null) {
          const place = await upsertPlace({
            lat: item.gps.lat,
            lng: item.gps.lng,
            neighborhood: item.neighborhood,
            name: item.neighborhood,
            places: placesCache,
          });
          if (place) {
            placeId = place.id;
            // 같은 좌표 재발견 방지를 위해 캐시에 추가
            if (!placesCache.find((p) => p.id === place.id)) placesCache.push(place);
          }
        }
        const storeExact = mode === '정확한 위치';
        const created = await insertArtwork({
          userId,
          storagePath,
          title: item.title || null,
          note: sharedNote || null,
          dailyVision,
          locationMode: mode,
          takenAt: item.takenAt,
          lat: storeExact ? item.gps.lat : null,
          lng: storeExact ? item.gps.lng : null,
          placeId,
          cameraMake: item.cameraMake,
          cameraModel: item.cameraModel,
          lens: item.lens,
        });
        createdIds.push(created.id);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }

      if (setAsCurate && createdIds.length > 0) {
        await setCurateOrder(userId, createdIds.slice(0, 4));
      }

      await refresh();
      setScreen('archive');
    } catch (err) {
      console.error(err);
      setError(err.message || '저장 실패');
    } finally {
      setBusy(false);
    }
  };

  const someWithoutGps = items.some((it) => it.gps.lat == null);

  return (
    <>
      <Header
        title="기록"
        subtitle={`카든냥은 하루 4장 — 오늘 ${todayCount}/4`}
        kicker="새 장면"
      />
      <div className="space-y-4">
        {/* 4-slot 헤더 — 오늘 올린 사진 + 빈 슬롯에는 + 추가 버튼 */}
        {items.length === 0 && (
          dailyRemaining === 0 ? (
            <section className="flex flex-col items-center justify-center rounded-[24px] bg-[var(--surface)] p-6 text-center shadow-[0_0_0_1px_var(--border)]">
              <div className="text-[var(--ink)]">
                <MascotSleepyFour size={240} />
              </div>
              <p className="mt-3 text-[16px] font-extrabold tracking-[-0.05em] text-[var(--text)]">
                오늘 네 장 다 썼어요
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
                필름은 잠들었어요. 내일 다시 만나요.
              </p>
              <div className="mt-4 grid w-full grid-cols-4 gap-1.5">
                {todayWorks.map((art) => (
                  <div key={art.id} className="relative aspect-square overflow-hidden rounded-[10px]">
                    <button
                      type="button"
                      onClick={() => openArtwork?.(art.id)}
                      className="block h-full w-full"
                    >
                      <img src={art.imageUrl} alt={art.title} className="h-full w-full object-cover" loading="lazy" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteToday(art); }}
                      disabled={deletingId === art.id}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] text-white backdrop-blur-sm disabled:opacity-50"
                      title="삭제"
                    >
                      {deletingId === art.id ? '…' : '✕'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section>
              <p className="mb-2 px-1 text-[11px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">
                오늘의 필름 · {todayCount}/4
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[0,1,2,3].map((slot) => {
                  const art = todayWorks[slot];
                  if (art) {
                    return (
                      <div key={art.id} className="relative aspect-square overflow-hidden rounded-[14px]">
                        <button
                          type="button"
                          onClick={() => openArtwork?.(art.id)}
                          className="block h-full w-full"
                        >
                          <img src={art.imageUrl} alt={art.title} className="h-full w-full object-cover" loading="lazy" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteToday(art); }}
                          disabled={deletingId === art.id}
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-[12px] text-white backdrop-blur-sm disabled:opacity-50"
                          title="삭제"
                        >
                          {deletingId === art.id ? '…' : '✕'}
                        </button>
                      </div>
                    );
                  }
                  return (
                    <label
                      key={slot}
                      className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--ink)] hover:text-[var(--text)]"
                    >
                      <input type="file" accept="image/*" className="hidden" onChange={handleFiles} />
                      <Icon name="plus" size={24} />
                      <span className="mt-1 text-[11px] font-semibold">추가</span>
                    </label>
                  );
                })}
              </div>
            </section>
          )
        )}
        {items.length === 0 && false && dailyRemaining > 0 ? (
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            <div className="flex h-[430px] flex-col items-center justify-center rounded-[28px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]">
              <Icon name="camera" size={34} />
              <span className="mt-3 text-sm">사진 고르기 (오늘 {dailyRemaining}장 가능)</span>
              <span className="mt-2 text-xs text-[var(--text-faint)]">사진 안의 위치 정보도 함께 확인합니다.</span>
            </div>
          </label>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {items.map((item) => (
                <RecordItemCard
                  key={item.localId}
                  item={item}
                  onRemove={() => removeItem(item.localId)}
                  onTitleChange={(title) => updateItem(item.localId, { title })}
                  onUseMyLocation={() => useMyLocationFor(item.localId)}
                  onPickOnMap={() => setPinPickingId(item.localId)}
                  locating={locatingId === item.localId}
                />
              ))}
              {remaining > 0 && items.length + todayCount < 4 && (
                <label className="flex aspect-square cursor-pointer items-center justify-center rounded-[18px] border border-dashed border-[var(--border-dashed)] bg-[var(--surface)] text-[var(--text-muted)]">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
                  <div className="text-center">
                    <Icon name="plus" size={20} />
                    <p className="mt-1 text-[11px]">더 추가</p>
                  </div>
                </label>
              )}
            </div>

            {someWithoutGps && (
              <button
                type="button"
                onClick={useMyLocationForAll}
                className="w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text)]"
              >
                📍 위치 없는 사진에 내 위치 일괄 적용
              </button>
            )}

            <section className="space-y-4 rounded-[24px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
              <textarea
                value={sharedNote}
                onChange={(event) => setSharedNote(event.target.value)}
                className="min-h-16 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-[var(--placeholder)]"
                placeholder="공통 노트 (선택) — 모든 사진에 같이 남겨집니다"
              />
              <input
                value={dailyVision}
                onChange={(event) => setDailyVision(event.target.value)}
                className="w-full rounded-full border border-[var(--border)] bg-transparent px-4 py-2 text-xs outline-none placeholder:text-[var(--placeholder)]"
                placeholder="오늘의 시선 (예: 빛, 벽, 흔들림) — 공통"
              />

              <div>
                <p className="mb-3 text-[12px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">공개 방식 (모두 공통)</p>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_MODES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setMode(item)}
                      className={`rounded-full px-3 py-2 text-xs ${mode === item ? 'bg-[var(--ink)] text-white' : 'border border-[var(--border)] text-[var(--text-muted)]'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
                  {mode === '정확한 위치' && '지도에 정확한 좌표로 표시됩니다.'}
                  {mode === '동네' && '동네 이름만 노출되고 좌표는 저장되지 않아요.'}
                  {mode === '개인전만' && '내 개인전에만 걸려요. 공간 전시에는 안 들어가요.'}
                  {mode === '숨김' && '나만 볼 수 있어요. 다른 사람에겐 보이지 않아요.'}
                </p>
              </div>

              {items.length >= 1 && (
                <label className="flex cursor-pointer items-center justify-between rounded-[16px] border border-[var(--border)] px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold">오늘의 4컷으로 큐레이팅</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                      이번에 올린 사진들이 내 개인전 메인 4컷으로 자동 설정됨
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={setAsCurate}
                    onChange={(event) => setSetAsCurate(event.target.checked)}
                    className="h-5 w-5 accent-[var(--ink)]"
                  />
                </label>
              )}

              {error && <p className="rounded-[12px] bg-red-50 p-3 text-xs text-red-700">{error}</p>}

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={busy}
                className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy
                  ? `올리는 중… (${progress.done}/${progress.total})`
                  : `${items.length}장 필름에 넣기`}
              </button>
            </section>
          </>
        )}
      </div>

      {pinPickingId && (() => {
        const item = items.find((i) => i.localId === pinPickingId);
        return (
          <LocationPickerModal
            initialLat={item?.gps.lat}
            initialLng={item?.gps.lng}
            onConfirm={handlePinConfirm}
            onClose={() => setPinPickingId(null)}
          />
        );
      })()}
    </>
  );
}
function RecordItemCard({ item, onRemove, onTitleChange, onUseMyLocation, onPickOnMap, locating }) {
  const showLocationFallback = item.gpsStatus === 'empty' || item.gpsStatus === 'error';
  return (
    <div className="overflow-hidden rounded-[18px] bg-[var(--surface)] shadow-[0_0_0_1px_var(--border)]">
      <div className="relative">
        <ImageBox src={item.previewUrl} alt={item.title || ''} className="aspect-square w-full" priority />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
          aria-label="제거"
        >
          <Icon name="x" size={13} />
        </button>
        <div className="absolute left-1.5 bottom-1.5 flex flex-wrap gap-1">
          <GpsStatusBadge status={item.gpsStatus} source={item.gpsSource} />
          {item.neighborhood && (
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] text-[var(--text)]">
              {item.neighborhood}
            </span>
          )}
        </div>
      </div>
      <div className="p-2 space-y-1">
        <input
          value={item.title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="제목 (필수)"
          required
          maxLength={40}
          className="w-full bg-transparent text-xs font-semibold outline-none placeholder:text-[var(--placeholder)]"
        />
        {showLocationFallback && (
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={onUseMyLocation}
              disabled={locating}
              className="rounded-full bg-[var(--ink)] px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
            >
              {locating ? '확인 중…' : '📍 내 위치'}
            </button>
            <button
              type="button"
              onClick={onPickOnMap}
              className="rounded-full border border-[var(--border-strong)] px-2 py-1 text-[10px] font-semibold text-[var(--text)]"
            >
              📌 지도에서
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
