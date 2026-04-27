import { useState } from 'react';
import { useData } from '../lib/data-context';
import { createCollection, addArtworkToCollection, removeArtworkFromCollection } from '../lib/db';
import Icon from './Icon';

export default function AddToCollectionPicker({ artworkId, onClose }) {
  const { userId, getCollectionsByUser, isInCollection, refresh } = useData();
  const myCollections = getCollectionsByUser(userId);
  const [busyId, setBusyId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [busyNew, setBusyNew] = useState(false);

  const handleToggle = async (collectionId) => {
    if (!userId) return;
    setBusyId(collectionId);
    try {
      if (isInCollection(collectionId, artworkId)) {
        await removeArtworkFromCollection(collectionId, artworkId);
      } else {
        await addArtworkToCollection(collectionId, artworkId);
      }
      await refresh();
    } catch (err) {
      alert('실패: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newName.trim() || !userId) return;
    setBusyNew(true);
    try {
      const created = await createCollection(userId, { name: newName.trim(), isPublic: true });
      await addArtworkToCollection(created.id, artworkId);
      await refresh();
      setCreatingNew(false);
      setNewName('');
    } catch (err) {
      alert('실패: ' + err.message);
    } finally {
      setBusyNew(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-[400px] rounded-t-[28px] bg-[var(--surface)] p-6 shadow-xl sm:rounded-[24px]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[20px] font-extrabold tracking-[-0.06em]">컬렉션에 추가</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-2)]"
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {myCollections.length === 0 && !creatingNew && (
            <p className="rounded-[14px] bg-[var(--bg)] p-4 text-xs text-[var(--text-muted)]">
              아직 컬렉션이 없어요. 새 컬렉션을 만들어주세요.
            </p>
          )}
          {myCollections.map((c) => {
            const inCollection = isInCollection(c.id, artworkId);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleToggle(c.id)}
                disabled={busyId === c.id}
                className={`flex w-full items-center justify-between rounded-[14px] border p-3 text-left disabled:opacity-50 ${
                  inCollection
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                    : 'border-[var(--border)] text-[var(--text)]'
                }`}
              >
                <span className="truncate text-sm font-semibold">{c.name}</span>
                <span className="text-xs">{inCollection ? '✓ 추가됨' : '+ 추가'}</span>
              </button>
            );
          })}
          {creatingNew && (
            <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg)] p-3">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="새 컬렉션 이름"
                autoFocus
                className="w-full bg-transparent text-sm outline-none"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => { setCreatingNew(false); setNewName(''); }}
                  className="flex-1 rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-xs"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleCreateAndAdd}
                  disabled={busyNew || !newName.trim()}
                  className="flex-1 rounded-full bg-[var(--ink)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {busyNew ? '…' : '만들고 추가'}
                </button>
              </div>
            </div>
          )}
          {!creatingNew && (
            <button
              type="button"
              onClick={() => setCreatingNew(true)}
              className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-[var(--border-dashed)] p-3 text-sm text-[var(--text-muted)]"
            >
              + 새 컬렉션 만들기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
