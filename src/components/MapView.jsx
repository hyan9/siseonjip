import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite/React 환경에서 Leaflet 기본 마커 아이콘 경로가 깨지는 이슈 패치
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points?.length) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [points, map]);
  return null;
}

export default function MapView({
  points = [],
  center,
  zoom = 14,
  height = 390,
  onMarkerClick,
}) {
  const fallbackCenter = center
    ? [center.lat, center.lng]
    : points[0]
    ? [points[0].lat, points[0].lng]
    : [37.5665, 126.978]; // 서울 시청

  return (
    <div style={{ height }} className="overflow-hidden rounded-[28px] shadow-[0_0_0_1px_#d8cfbf]">
      <MapContainer
        center={fallbackCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            eventHandlers={{
              click: () => onMarkerClick?.(point),
            }}
          >
            {point.label && <Popup>{point.label}</Popup>}
          </Marker>
        ))}
        {points.length > 0 && <FitBounds points={points} />}
      </MapContainer>
    </div>
  );
}
