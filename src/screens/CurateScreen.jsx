import { useState } from 'react';
import { useData } from '../lib/data-context';
import {
  Header,
  ImageBox,
} from '../components/ui';
import { FourPhotoWall } from '../components/Cards';
import {
  setCurateOrder,
} from '../lib/db';




import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableCurateItem({ art, index, onRemove, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: art.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <article
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-[22px] bg-[var(--surface)] p-2.5 shadow-[0_0_0_1px_var(--border)]"
    >
      <span
        {...attributes}
        {...listeners}
        className="flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center text-[var(--text-muted)] active:cursor-grabbing"
        title="끌어서 순서 변경"
      >
        ⋮⋮
      </span>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-semibold text-white">
        {index + 1}
      </span>
      <button
        type="button"
        onClick={() => onOpen(art.id)}
        className="h-16 w-16 shrink-0 overflow-hidden rounded-[14px]"
      >
        <ImageBox src={art.imageUrl} alt={art.title} className="h-full w-full" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold tracking-[-0.04em]">{art.title || '제목 없음'}</p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(art.id)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-strong)] text-xs"
      >
        ×
      </button>
    </article>
  );
}
export default function CurateScreen({ setScreen, openArtwork }) {
  const { userId, getUserArtworks, getCurateForUser, refresh } = useData();
  const initial = getCurateForUser(userId);
  const [orderedIds, setOrderedIds] = useState(initial.map((art) => art.id));
  const [busy, setBusy] = useState(false);
  const all = getUserArtworks(userId);

  const ordered = orderedIds.map((id) => all.find((a) => a.id === id)).filter(Boolean);
  const remaining = all.filter((a) => !orderedIds.includes(a.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedIds((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const remove = (id) => setOrderedIds((prev) => prev.filter((x) => x !== id));
  const add = (id) => setOrderedIds((prev) => (prev.length >= 4 ? prev : [...prev, id]));

  const handleSave = async () => {
    setBusy(true);
    try {
      await setCurateOrder(userId, orderedIds);
      await refresh();
      setScreen('profile');
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header
        title="전시 순서"
        subtitle="끌어서 4컷의 순서를 바꿔보세요."
        kicker="수정"
        onBack={() => setScreen('profile')}
      />
      <div className="space-y-4">
        <section className="rounded-[26px] border border-[var(--ink)] bg-[var(--surface)] p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[22px] font-extrabold tracking-[-0.07em]">미리보기</h2>
            <span className="rounded-full border border-[var(--border-strong)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
              {ordered.length}/4
            </span>
          </div>
          <FourPhotoWall photos={ordered} onOpen={openArtwork} />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-[var(--text-muted)]">선택된 사진 (드래그로 순서 변경)</h3>
          {ordered.length === 0 && (
            <p className="text-xs text-[var(--text-faint)]">아래에서 사진을 골라 추가하세요.</p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
              <div className="space-y-2">
                {ordered.map((art, index) => (
                  <SortableCurateItem
                    key={art.id}
                    art={art}
                    index={index}
                    onRemove={remove}
                    onOpen={openArtwork}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        {remaining.length > 0 && ordered.length < 4 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">추가할 사진</h3>
            <div className="grid grid-cols-3 gap-2">
              {remaining.map((art) => (
                <button key={art.id} type="button" onClick={() => add(art.id)} className="overflow-hidden rounded-[14px]">
                  <ImageBox src={art.imageUrl} alt={art.title} className="aspect-square" />
                </button>
              ))}
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? '저장 중…' : '이 순서로 걸기'}
        </button>
      </div>
    </>
  );
}
