// Nominatim(OpenStreetMap) 역지오코딩.
// 무료/오픈소스. 사용 정책: 초당 1건, User-Agent 식별 권장.
// 브라우저에서는 User-Agent를 직접 설정할 수 없으므로 도메인이 식별자 역할.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

const cache = new Map();

function cacheKey(lat, lng) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

export async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) return null;

  const key = cacheKey(lat, lng);
  if (cache.has(key)) return cache.get(key);

  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    zoom: '16',
    addressdetails: '1',
    'accept-language': 'ko,en',
  });

  try {
    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Nominatim ${response.status}`);
    const data = await response.json();

    const address = data.address || {};
    const neighborhood =
      address.suburb ||
      address.neighbourhood ||
      address.quarter ||
      address.city_district ||
      address.borough ||
      address.town ||
      address.village ||
      address.city ||
      null;

    const result = {
      neighborhood,
      displayName: data.display_name || null,
      raw: address,
    };
    cache.set(key, result);
    return result;
  } catch (error) {
    console.warn('[geocoding] 역지오코딩 실패', error);
    return null;
  }
}

// 동네/주소 → 좌표 (forward geocoding)
const searchCache = new Map();

export async function searchPlaces(query) {
  const q = query.trim();
  if (q.length < 2) return [];

  if (searchCache.has(q)) return searchCache.get(q);

  const params = new URLSearchParams({
    format: 'jsonv2',
    q,
    'accept-language': 'ko,en',
    limit: '8',
    addressdetails: '1',
  });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`Nominatim ${response.status}`);
    const data = await response.json();
    const results = (data || []).map((item) => ({
      id: `${item.osm_type}-${item.osm_id}`,
      name: item.display_name,
      shortName:
        item.address?.suburb ||
        item.address?.neighbourhood ||
        item.address?.city_district ||
        item.address?.town ||
        item.address?.village ||
        item.address?.city ||
        item.name ||
        item.display_name?.split(',')[0],
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
    }));
    searchCache.set(q, results);
    return results;
  } catch (error) {
    console.warn('[geocoding] 검색 실패', error);
    return [];
  }
}

// 두 좌표 사이 거리 (m). Haversine.
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 브라우저 Geolocation API 래퍼
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저는 위치 정보를 지원하지 않아요.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }),
      reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000, ...options }
    );
  });
}
