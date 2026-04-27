import { useMemo, useState } from 'react';
import { useData } from '../lib/data-context';
import { Header, EmptyState } from '../components/ui';
import { PostListRow } from '../components/Cards';

export default function CameraScreen({ camera, setScreen, openArtwork }) {
  const { artworks, getHypeCount } = useData();
  const [sort, setSort] = useState('인기');

  const label = [camera.make, camera.model, camera.lens].filter(Boolean).join(' · ') || '미상';

  const filtered = useMemo(() => {
    const matches = (a) => {
      if (camera.make && a.camera_make !== camera.make) return false;
      if (camera.model && a.camera_model !== camera.model) return false;
      if (camera.lens && a.lens !== camera.lens) return false;
      return a.location_mode !== '숨김';
    };
    const arr = artworks.filter(matches);
    if (sort === '인기') {
      return [...arr].sort((a, b) => getHypeCount(b.id) - getHypeCount(a.id));
    }
    return [...arr].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [artworks, camera, sort, getHypeCount]);

  return (
    <>
      <Header
        title={camera.model || camera.make || '카메라'}
        subtitle={camera.lens ? `with ${camera.lens}` : (camera.make && camera.model ? camera.make : '')}
        kicker="📷 카메라"
        onBack={() => setScreen('home')}
      />
      <div className="mb-4 flex items-center gap-2 text-xs">
        <span className="text-[var(--text-faint)]">{filtered.length}장 · 정렬</span>
        {['인기', '최신'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSort(item)}
            className={`rounded-full px-3 py-1 ${
              sort === item ? 'bg-[var(--surface-2)] font-semibold text-[var(--text)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {item === '인기' ? '🔥 인기' : item}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title={`${label}로 찍은 사진이 없어요`} hint="EXIF 정보가 살아있는 원본을 올리면 모입니다." />
      ) : (
        <div className="rounded-[20px] bg-[var(--surface)] px-4 shadow-[0_0_0_1px_var(--border)]">
          {filtered.map((art) => (
            <PostListRow key={art.id} artwork={art} onOpen={openArtwork} />
          ))}
        </div>
      )}
    </>
  );
}
