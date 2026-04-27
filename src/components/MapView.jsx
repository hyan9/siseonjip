import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Vite/React 환경에서 Leaflet 기본 마커 아이콘 경로 패치
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

const createClusterIcon = (cluster) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 50 ? 44 : 52;
  return L.divIcon({
    html: `<div style="
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:#151515;
      color:#fff;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:700;
      font-size:${count < 10 ? 13 : 14}px;
      border:3px solid #fbf8f2;
      box-shadow:0 4px 12px rgba(0,0,0,0.25);
      letter-spacing:-0.02em;
    ">${count}</div>`,
    className: 'siseonjip-cluster',
    iconSize: L.point(size, size, true),
  });
};

export default function MapView({
  points = [],
  center,
  zoom = 14,
  height = 390,
  cluster = true,
  onMarkerClick,
}) {
  const fallbackCenter = center
    ? [center.lat, center.lng]
    : points[0]
    ? [points[0].lat, points[0].lng]
    : [37.5665, 126.978]; // 서울 시청

  const renderMarkers = () =>
    points.map((point) => (
      <Marker
        key={point.id}
        position={[point.lat, point.lng]}
        eventHandlers={{
          click: () => onMarkerClick?.(point),
        }}
      >
        {point.label && <Popup>{point.label}</Popup>}
      </Marker>
    ));

  return (
    <div style={{ height }} className="overflow-hidden rounded-[28px] shadow-[0_0_0_1px_var(--border-strong)]">
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
        {cluster && points.length > 1 ? (
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterIcon}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            maxClusterRadius={60}
          >
            {renderMarkers()}
          </MarkerClusterGroup>
        ) : (
          renderMarkers()
        )}
        {points.length > 0 && <FitBounds points={points} />}
      </MapContainer>
    </div>
  );
}
