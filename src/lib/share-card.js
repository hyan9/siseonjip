// 4컷 큐레이팅을 PNG 이미지로 export.
// 인스타 스토리/피드 공유용.

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // canvas tainting 방지
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
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
  ctx.fillText('시선집', 64, 96);

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
  ctx.fillText(`${dateLabel} · 시선집에서 보기`, 64, footerY + 44);

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

export async function shareFourCutCard({ photos, profile, theme }) {
  const blob = await generateFourCutCard({ photos, profile, theme });
  const file = new File([blob], `siseonjip-${profile?.nickname || 'card'}.png`, {
    type: 'image/png',
  });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: '시선집 4컷',
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
