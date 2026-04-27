import Icon from './Icon';

export default function ShareButton({ label = '', title = '시선집', text = '이 전시를 같이 볼래요?' }) {
  const handleShare = async () => {
    const url = window.location.href;
    const shareData = { title, text, url };
    try {
      if (navigator?.share) await navigator.share(shareData);
      else {
        await navigator?.clipboard?.writeText(`${title} · ${text} ${url}`);
        alert('링크를 복사했어요.');
      }
    } catch (error) {
      console.warn('공유를 취소했거나 실패했습니다.', error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="공유"
      title="공유"
      className={`${label ? 'gap-1.5 px-3' : 'h-9 w-9'} inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface)]/90 text-xs font-semibold text-[var(--text)] shadow-[0_4px_16px_rgba(20,20,20,0.06)] backdrop-blur`}
    >
      <Icon name="share" size={15} />
      {label && <span>{label}</span>}
    </button>
  );
}
