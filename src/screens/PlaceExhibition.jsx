import { useData } from '../lib/data-context';
import {
  Header,
  EmptyState,
} from '../components/ui';
import MapView from '../components/MapView';
import { PhotoTile } from '../components/Cards';


import {
  placeLabel,
} from '../lib/utils';







export default function PlaceExhibition({ placeId, setScreen, openArtwork }) {
  const { getPlace, getPlaceArtworks } = useData();
  const place = getPlace(placeId);
  const photos = getPlaceArtworks(placeId);

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
          <>
            {place.lat != null && place.lng != null && (
              <div className="mb-4">
                <MapView points={[{ id: place.id, lat: place.lat, lng: place.lng, label: placeLabel(place) }]} height={200} zoom={15} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">{photos.map((art) => <PhotoTile key={art.id} artwork={art} onOpen={openArtwork} />)}</div>
          </>
        )}
    </>
  );
}
