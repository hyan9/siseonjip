// 닉네임 첫 글자 + user_id 해시 기반 그라데이션 색
// 카든냥 전반 통일 톤
export default function Avatar({ profile, size = 32, className = '' }) {
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
