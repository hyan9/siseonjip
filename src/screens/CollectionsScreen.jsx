import { useState } from 'react';
import { useData } from '../lib/data-context';
import {
  Header,
  ImageBox,
  EmptyState,
} from '../components/ui';
import {
  createCollection,
} from '../lib/db';









export default function CollectionsScreen({ setScreen, openCollection }) {
  const { userId, getCollectionsByUser, getCollectionArtworks, refresh } = useData();
  const myCollections = getCollectionsByUser(userId);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !userId) return;
    setBusy(true);
    try {
      await createCollection(userId, { name: name.trim(), description: description.trim() || null, isPublic });
      await refresh();
      setName('');
      setDescription('');
      setCreating(false);
    } catch (err) {
      alert('생성 실패: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header
        title="컬렉션"
        subtitle="테마별로 사진을 모아둡니다."
        kicker="📚 모음"
        onBack={() => setScreen('profile')}
        right={
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-full bg-[var(--ink)] px-3 py-1.5 text-xs font-semibold text-white"
          >
            + 새 컬렉션
          </button>
        }
      />

      {myCollections.length === 0 && !creating ? (
        <EmptyState
          title="아직 컬렉션이 없어요"
          hint={'사용법:\n1. "+ 새 컬렉션" 으로 빈 컬렉션 만들기 (예: "겨울의 빛")\n2. 사진을 클릭해 상세 화면 → 우상단 📚 아이콘으로 컬렉션에 담기\n3. 여기로 돌아오면 채워진 컬렉션이 보여요'}
          onAction={() => setCreating(true)}
          actionLabel="첫 컬렉션 만들기"
        />
      ) : (
        <div className="space-y-3">
          {creating && (
            <section className="rounded-[20px] bg-[var(--surface)] p-4 shadow-[0_0_0_1px_var(--border)]">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--text-muted)]">새 컬렉션</p>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="컬렉션 이름 (예: 겨울의 빛)"
                autoFocus
                className="mt-2 w-full rounded-[14px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="간단한 설명 (선택)"
                className="mt-2 min-h-16 w-full resize-none rounded-[14px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none"
              />
              <label className="mt-2 flex items-center gap-2 text-xs">
                <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} className="h-4 w-4 accent-[var(--ink)]" />
                <span>공개</span>
                <span className="text-[var(--text-muted)]">— 다른 사람들도 볼 수 있어요</span>
              </label>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="flex-1 rounded-full border border-[var(--border-strong)] px-3 py-2 text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={busy || !name.trim()}
                  className="flex-1 rounded-full bg-[var(--ink)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {busy ? '생성 중…' : '만들기'}
                </button>
              </div>
            </section>
          )}

          {myCollections.map((c) => {
            const items = getCollectionArtworks(c.id);
            const cover = items.find((a) => a.id === c.cover_artwork_id) || items[0];
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => openCollection(c.id)}
                className="block w-full overflow-hidden rounded-[20px] bg-[var(--surface)] text-left shadow-[0_0_0_1px_var(--border)]"
              >
                <div className="grid grid-cols-[2fr_1fr] gap-1.5 p-2">
                  <ImageBox src={cover?.imageUrl} alt={c.name} className="h-32 rounded-[14px]" />
                  <div className="grid grid-rows-2 gap-1.5">
                    <ImageBox src={items[1]?.imageUrl} alt="" className="h-full rounded-[10px]" />
                    <ImageBox src={items[2]?.imageUrl} alt="" className="h-full rounded-[10px]" />
                  </div>
                </div>
                <div className="px-3 pb-3">
                  <p className="text-[16px] font-bold tracking-[-0.04em]">{c.name}</p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                    {items.length}장 · {c.is_public ? '공개' : '비공개'}
                  </p>
                  {c.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">{c.description}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
