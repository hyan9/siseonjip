// 공용 유틸 함수 (날짜 포맷, 텍스트 라벨, 멘션 파서 등)
import React from 'react';

export const LOCATION_MODES = ['정확한 위치', '동네', '개인전만', '숨김'];
export const MENTION_REGEX = /@([^\s@,.!?:;]{2,30})/g;

export function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function dateOf(art) {
  // 카든냥은 "올린 날" 기준 (EXIF taken_at은 옛 날짜를 갖고 있어 캘린더가 어긋남)
  return new Date(art.created_at);
}

export function getMonthDays(artworks, year, month) {
  const lastDay = new Date(year, month, 0).getDate();
  return Array.from({ length: lastDay }, (_, index) => {
    const day = index + 1;
    const artworkIds = artworks
      .filter((art) => {
        const d = dateOf(art);
        return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === day;
      })
      .map((art) => art.id);
    return { day, artworkIds };
  });
}

export function placeLabel(place) {
  if (!place) return null;
  return place.neighborhood || place.name || null;
}

export function profileLabel(profile) {
  return profile?.nickname || '익명';
}

export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}

export function renderTextWithMentions(text, profiles, onOpenPerson) {
  if (!text) return null;
  const parts = [];
  let lastIndex = 0;
  let match;
  const re = new RegExp(MENTION_REGEX);
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const nickname = match[1];
    const profile = profiles?.find((p) => p.nickname === nickname);
    if (profile && onOpenPerson) {
      parts.push(
        React.createElement(
          'button',
          {
            key: `m-${match.index}`,
            type: 'button',
            onClick: (event) => {
              event.stopPropagation();
              onOpenPerson(profile.id);
            },
            className: 'font-semibold text-blue-500 hover:underline',
          },
          `@${nickname}`
        )
      );
    } else {
      parts.push(
        React.createElement(
          'span',
          {
            key: `m-${match.index}`,
            className: 'font-semibold text-[var(--text-muted)]',
          },
          `@${nickname}`
        )
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
