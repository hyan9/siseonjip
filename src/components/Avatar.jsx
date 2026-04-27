// 프로필 아바타 — "프로필 사진 = 25번째 사진" 메타포.
// 작가의 25번째 사진(없으면 첫 작품)이 있으면 그 이미지를 동그란 아바타로,
// 작품이 없으면 닉네임 첫 글자 + user_id 해시 그라데이션 fallback.
import { useData } from '../lib/data-context';

export default function Avatar({ profile, size = 32, className = '', imageUrl, fallback = false }) {
  const data = useData();
  const works = !fallback && profile?.id ? data.getUserArtworks?.(profile.id) ?? [] : [];
  // imageUrl이 직접 주어지면 우선, 아니면 25번째, 아니면 첫 작품
  const photo =
    imageUrl ??
    works.find((a) => a.is_twenty_five)?.imageUrl ??
    works[0]?.imageUrl ??
    null;

  if (photo) {
    return (
      <img
        src={photo}
        alt={profile?.nickname || ''}
        loading="lazy"
        decoding="async"
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size, background: 'var(--image-bg)' }}
      />
    );
  }

  // Fallback — 닉네임 + 그라데이션
  const name = profile?.nickname || '?';
  const initial = (name[0] || '?').toUpperCase();
  const hash = String(profile?.id || name)
    .split('')
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${hue} 65% 55%), hsl(${(hue + 40) % 360} 60% 45%))`,
        fontSize: size * 0.42,
      }}
    >
      {initial}
    </div>
  );
}
