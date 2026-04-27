// 4컷 큐레이팅을 PNG 이미지로 export.
// 인스타 스토리/피드 공유용.

// Supabase Storage URL은 CORS 헤더가 없을 수 있어 crossOrigin 직접 로드가
// 실패하거나 canvas를 tainted 상태로 만들어 toBlob에서 SecurityError를 던진다.
// fetch → blob → object URL 경로로 우회하면 same-origin으로 처리되어 안전함.
async function loadImage(url) {
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = blobUrl;
      });
    } finally {
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
    }
  } catch (e) {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  }
}

function drawCover(ctx, img, dx, dy, dw, dh) {
  const ratio = Math.max(dw / img.width, dh / img.height);
  const sw = dw / ratio;
  const sh = dh / ratio;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generateFourCutCard({ photos, profile, theme = 'light' }) {
  const W = 1080;
  const H = 1350; // 4:5 인스타용
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const palette = theme === 'dark'
    ? { bg: '#15131a', text: '#f3f1ec', sub: '#aaa5a0', accent: '#f3f1ec' }
    : { bg: '#f4efe6', text: '#151515', sub: '#746e66', accent: '#151515' };

  // 배경
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, H);

  // 헤더
  ctx.fillStyle = palette.sub;
  ctx.font = '700 28px system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  ctx.fillText('카든냥', 64, 96);

  ctx.fillStyle = palette.text;
  ctx.font = '900 64px system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  const title = profile?.exhibition_title || '오늘의 컷-컷';
  ctx.fillText(title.length > 16 ? title.slice(0, 16) + '…' : title, 64, 168);

  // 4컷 그리드 (2x2)
  const startX = 64;
  const startY = 220;
  const gridW = W - startX * 2;
  const gap = 24;
  const cellSize = (gridW - gap) / 2;

  const slots = [photos[0], photos[1], photos[2], photos[3]];
  const positions = [
    [startX, startY],
    [startX + cellSize + gap, startY],
    [startX, startY + cellSize + gap],
    [startX + cellSize + gap, startY + cellSize + gap],
  ];

  for (let i = 0; i < 4; i++) {
    const [x, y] = positions[i];
    const photo = slots[i];
    ctx.save();
    roundRectPath(ctx, x, y, cellSize, cellSize, 28);
    ctx.clip();
    if (photo?.imageUrl) {
      try {
        const img = await loadImage(photo.imageUrl);
        drawCover(ctx, img, x, y, cellSize, cellSize);
      } catch {
        ctx.fillStyle = '#cfc6b8';
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    } else {
      ctx.fillStyle = theme === 'dark' ? '#2a2730' : '#e8dfd1';
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.fillStyle = palette.sub;
      ctx.font = '600 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('빈 벽', x + cellSize / 2, y + cellSize / 2);
      ctx.textAlign = 'left';
    }
    ctx.restore();
  }

  // 푸터
  const footerY = startY + (cellSize + gap) * 2 + 80;
  ctx.fillStyle = palette.text;
  ctx.font = '800 38px system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  ctx.fillText(profile?.nickname || '익명', 64, footerY);

  ctx.fillStyle = palette.sub;
  ctx.font = '500 24px system-ui, sans-serif';
  const dateLabel = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  ctx.fillText(`${dateLabel} · 카든냥에서 보기`, 64, footerY + 44);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('이미지 생성 실패'));
        else resolve(blob);
      },
      'image/png',
      0.95
    );
  });
}

export async function downloadFourCutCard({ photos, profile, theme }) {
  const blob = await generateFourCutCard({ photos, profile, theme });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `siseonjip-${profile?.nickname || 'card'}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function generateSinglePhotoCard({ photo, profile, theme = 'light' }) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const palette = theme === 'dark'
    ? { bg: '#15131a', text: '#f3f1ec', sub: '#aaa5a0' }
    : { bg: '#f4efe6', text: '#151515', sub: '#746e66' };

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, H);

  // 메인 사진 (정사각형)
  const cellSize = W - 128;
  const x = 64;
  const y = 200;
  ctx.save();
  roundRectPath(ctx, x, y, cellSize, cellSize, 32);
  ctx.clip();
  if (photo?.imageUrl) {
    try {
      const img = await loadImage(photo.imageUrl);
      drawCover(ctx, img, x, y, cellSize, cellSize);
    } catch {
      ctx.fillStyle = '#cfc6b8';
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }
  ctx.restore();

  // 헤더
  ctx.fillStyle = palette.sub;
  ctx.font = '700 26px system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  ctx.fillText('카든냥', 64, 100);

  // 제목 (사진 아래)
  ctx.fillStyle = palette.text;
  ctx.font = '900 56px system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  const title = photo?.title || '제목 없는 사진';
  ctx.fillText(title.length > 20 ? title.slice(0, 20) + '…' : title, 64, y + cellSize + 80);

  // 작가 + 날짜
  ctx.fillStyle = palette.sub;
  ctx.font = '500 28px system-ui, sans-serif';
  const meta = `${profile?.nickname || '익명'} · ${new Date(
    photo?.taken_at || photo?.created_at || Date.now()
  ).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  ctx.fillText(meta, 64, y + cellSize + 130);

  if (photo?.daily_vision) {
    ctx.fillStyle = palette.text;
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillText(`#${photo.daily_vision}`, 64, y + cellSize + 175);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('이미지 생성 실패'))), 'image/png', 0.95);
  });
}

export async function shareSinglePhotoCard({ photo, profile, theme }) {
  const blob = await generateSinglePhotoCard({ photo, profile, theme });
  const file = new File([blob], `siseonjip-${photo?.title || 'photo'}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: '카든냥', text: photo?.title || '' });
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

export async function generateWeeklyRecapCard({ photos, profile, theme = 'light', weekRange }) {
  // 주간 회고 — 큰 사진 1장 + 작은 4장 그리드 (또는 사진 없는 경우 fallback)
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const palette = theme === 'dark'
    ? { bg: '#15131a', text: '#f3f1ec', sub: '#aaa5a0', accent: '#ffb84d' }
    : { bg: '#f4efe6', text: '#151515', sub: '#746e66', accent: '#c46f00' };

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, H);

  // 헤더
  ctx.fillStyle = palette.accent;
  ctx.font = '800 24px system-ui, sans-serif';
  ctx.fillText('이번 주 카든냥', 64, 96);

  ctx.fillStyle = palette.text;
  ctx.font = '900 64px system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
  ctx.fillText(weekRange || '주간 회고', 64, 168);

  ctx.fillStyle = palette.sub;
  ctx.font = '500 24px system-ui, sans-serif';
  ctx.fillText(`${profile?.nickname || '익명'}이(가) 본 풍경`, 64, 208);

  // 메인 사진 (큰 것 1장)
  const main = photos[0];
  const mainSize = W - 128;
  const mainX = 64;
  const mainY = 244;
  ctx.save();
  roundRectPath(ctx, mainX, mainY, mainSize, mainSize - 80, 28);
  ctx.clip();
  if (main?.imageUrl) {
    try {
      const img = await loadImage(main.imageUrl);
      drawCover(ctx, img, mainX, mainY, mainSize, mainSize - 80);
    } catch {
      ctx.fillStyle = '#cfc6b8';
      ctx.fillRect(mainX, mainY, mainSize, mainSize - 80);
    }
  } else {
    ctx.fillStyle = theme === 'dark' ? '#2a2730' : '#e8dfd1';
    ctx.fillRect(mainX, mainY, mainSize, mainSize - 80);
  }
  ctx.restore();

  // 서브 4장 작은 그리드
  const subTop = mainY + (mainSize - 80) + 24;
  const subSize = 196;
  const gap = 16;
  const subStartX = 64;
  for (let i = 0; i < 4; i++) {
    const photo = photos[i + 1]; // 메인 다음부터
    const sx = subStartX + i * (subSize + gap);
    const sy = subTop;
    ctx.save();
    roundRectPath(ctx, sx, sy, subSize, subSize, 18);
    ctx.clip();
    if (photo?.imageUrl) {
      try {
        const img = await loadImage(photo.imageUrl);
        drawCover(ctx, img, sx, sy, subSize, subSize);
      } catch {
        ctx.fillStyle = theme === 'dark' ? '#2a2730' : '#e8dfd1';
        ctx.fillRect(sx, sy, subSize, subSize);
      }
    } else {
      ctx.fillStyle = theme === 'dark' ? '#2a2730' : '#e8dfd1';
      ctx.fillRect(sx, sy, subSize, subSize);
    }
    ctx.restore();
  }

  // 푸터
  ctx.fillStyle = palette.sub;
  ctx.font = '500 22px system-ui, sans-serif';
  ctx.fillText(`사진 ${photos.length}장 · 카든냥에서 보기`, 64, H - 60);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('이미지 생성 실패'))), 'image/png', 0.95);
  });
}

export async function shareWeeklyRecapCard({ photos, profile, theme, weekRange }) {
  const blob = await generateWeeklyRecapCard({ photos, profile, theme, weekRange });
  const file = new File([blob], `siseonjip-weekly-${profile?.nickname || 'me'}.png`, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: '이번 주 카든냥' });
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

export async function shareFourCutCard({ photos, profile, theme }) {
  const blob = await generateFourCutCard({ photos, profile, theme });
  const file = new File([blob], `siseonjip-${profile?.nickname || 'card'}.png`, {
    type: 'image/png',
  });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: '카든냥 4컷',
      text: `${profile?.nickname || ''}의 오늘의 4컷`,
    });
    return 'shared';
  }
  // fallback: 다운로드
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
