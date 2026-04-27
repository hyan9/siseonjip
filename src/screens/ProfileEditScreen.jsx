import { useState } from 'react';
import { useData } from '../lib/data-context';
import {
  Header,
} from '../components/ui';
import {
  updateProfile,
} from '../lib/db';









export default function ProfileEditScreen({ setScreen }) {
  const { userId, getProfile, refresh } = useData();
  const profile = getProfile(userId);
  const [nickname, setNickname] = useState(profile?.nickname || '');
  const [exhibitionTitle, setExhibitionTitle] = useState(profile?.exhibition_title || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [note, setNote] = useState(profile?.note || '');
  const [words, setWords] = useState((profile?.words || []).join(', '));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile(userId, {
        nickname,
        exhibition_title: exhibitionTitle,
        bio,
        note,
        words: words.split(',').map((w) => w.trim()).filter(Boolean),
      });
      await refresh();
      setScreen('profile');
    } catch (err) {
      setError(err.message || '저장 실패');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Header title="프로필 편집" kicker="내 전시" onBack={() => setScreen('profile')} />
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">닉네임</span>
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">전시 제목</span>
          <input value={exhibitionTitle} onChange={(e) => setExhibitionTitle(e.target.value)} className="w-full rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">짧은 소개</span>
          <input value={bio} onChange={(e) => setBio(e.target.value)} className="w-full rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">작가 노트</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-24 w-full rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-[var(--text-muted)]">키워드 (쉼표로 구분)</span>
          <input value={words} onChange={(e) => setWords(e.target.value)} className="w-full rounded-[16px] border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none" />
        </label>
        {error && <p className="rounded-[12px] bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        <button type="button" onClick={handleSave} disabled={busy} className="w-full rounded-full bg-[var(--ink)] px-5 py-4 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? '저장 중…' : '저장'}
        </button>
      </div>
    </>
  );
}
