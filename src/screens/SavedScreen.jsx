import { useData } from '../lib/data-context';
import {
  Header,
  EmptyState,
  Splash,
} from '../components/ui';
import { PhotoTile } from '../components/Cards';











export default function SavedScreen({ setScreen, openArtwork }) {
  const { userId, getSavedArtworks } = useData();
  const photos = getSavedArtworks();

  if (!userId) return <Splash />;

  return (
    <>
      <Header
        title="저장한 사진"
        subtitle="다시 보고 싶은 사진들을 모아둡니다."
        kicker="🔖 북마크"
        onBack={() => setScreen('profile')}
      />
      {photos.length === 0 ? (
        <EmptyState
          title="아직 저장한 사진이 없어요"
          hint="다른 사람 사진의 🔖 저장 버튼을 눌러 모아보세요."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((art) => (
            <PhotoTile key={art.id} artwork={art} onOpen={openArtwork} />
          ))}
        </div>
      )}
    </>
  );
}
