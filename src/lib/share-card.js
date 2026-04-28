// 카든냥 공유 카드 — 인스타·트위터 등 외부 SNS에 자랑하기용 PNG.
// 1080x1350 (4:5) 인스타 피드 호환.
// 톤: 시집·도록 — 명조 헤드라인, 종이/잉크 팔레트, 별 흩뿌림, 카든냥 워터마크.

const W = 1080;
const H = 1350;

const SERIF = '"Noto Serif KR", "Apple SD Gothic Neo", "Nanum Myeongjo", serif';
const SANS = '-apple-system, "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif';

const PALETTES = {
  light: {
    bg: '#f4efe6',       // 종이
    surface: '#fbf7ee',  // 살짝 밝은 종이
    text: '#1a1d1f',     // 잉크
    sub: '#7a7670',      // 회색
    faint: '#b8b3ac',    // 흐린 회색
    accent: '#d97757',   // 카든 오렌지
    divider: '#e6dfd0',
    star: 'rgba(20, 22, 24, 0.22)',
  },
  dark: {
    bg: '#0e1014',       // 한밤
    surface: '#161922',
    text: '#ecedef',
    sub: '#a09c98',
    faint: '#5f5d5a',
    accent: '#f5d28a',   // 노랑 따뜻
    divider: '#26282d',
    star: 'rgba(255, 240, 200, 0.65)',
  },
};

async function ensureFonts() {
  try {
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {
    // ignore
  }
}

// Supabase Storage URL은 CORS 헤더가 없을 수 있어 직접 crossOrigin 로드가
// canvas tainted 상태를 유발 → toBlob에서 SecurityError. fetch+blob URL 우회.
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

async function loadMascotImage(persona = 'paper') {
  try {
    return await loadImage(`/personas/${persona}.png`);
  } catch {
    return null;
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

// 별 ✦ 흩뿌림 — 시집의 잉크점 같은 장식
function drawStars(ctx, palette, layout) {
  ctx.save();
  ctx.fillStyle = palette.star;
  ctx.textBaseline = 'middle';
  for (const [px, py, size, opacity] of layout) {
    ctx.globalAlpha = opacity ?? 1;
    ctx.font = `${size}px sans-serif`;
    ctx.fillText('✦', px, py);
  }
  ctx.restore();
}

// 하단 워터마크 — 마스코트 + 카든냥 라벨 + 도메인 부제
function drawWatermark(ctx, palette, mascot) {
  const yBase = H - 96;
  const mascotSize = 64;
  const mascotX = 64;
  const mascotY = yBase - 14;

  // 구분선
  ctx.save();
  ctx.strokeStyle = palette.divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(64, yBase - 26);
  ctx.lineTo(W - 64, yBase - 26);
  ctx.stroke();
  ctx.restore();

  // 마스코트 (카드 형태)
  if (mascot) {
    ctx.save();
    roundRectPath(ctx, mascotX, mascotY, mascotSize, mascotSize, 14);
    ctx.fillStyle = palette.surface;
    ctx.fill();
    ctx.clip();
    ctx.drawImage(mascot, mascotX, mascotY, mascotSize, mascotSize);
    ctx.restore();
  }

  const textX = mascotX + mascotSize + 18;

  // 카든냥 라벨 (산세리프 굵게)
  ctx.fillStyle = palette.text;
  ctx.font = `900 28px ${SANS}`;
  ctx.textBaseline = 'top';
  ctx.fillText('카든냥', textX, mascotY + 4);

  // 부제 (작게)
  ctx.fillStyle = palette.sub;
  ctx.font = `500 18px ${SANS}`;
  ctx.fillText('카메라 든 냥이의 하루 네 장', textX, mascotY + 36);

  // 우측 도메인 (작게)
  ctx.textAlign = 'right';
  ctx.fillStyle = palette.faint;
  ctx.font = `italic 600 18px ${SERIF}`;
  ctx.fillText('kadennyang', W - 64, mascotY + 4);
  ctx.fillStyle = palette.sub;
  ctx.font = `500 16px ${SANS}`;
  ctx.fillText('siseonjip.app', W - 64, mascotY + 36);
  ctx.textAlign = 'left';
}

// 시그니처 인용 — 시집 톤
function drawSignature(ctx, palette, x, y, text) {
  ctx.save();
  ctx.fillStyle = palette.sub;
  ctx.font = `italic 600 26px ${SERIF}`;
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function blobFromCanvas(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('이미지 생성 실패'))), 'image/png', 0.95);
  });
}

function trimText(s, max) {
  if (!s) return '';
  return s.length > max ? s.slice(0, max) + '…' : s;
}

// =============== 4컷 카드 ===============
export async function generateFourCutCard({ photos, profile, theme = 'light', keyword }) {
  await ensureFonts();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const palette = PALETTES[theme] || PALETTES.light;

  // 배경
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, H);

  // 별 흩뿌림 — 어두운 테마에서 더 잘 보임
  drawStars(ctx, palette, [
    [W * 0.94, 70, 16, 0.7],
    [W * 0.07, 110, 11, 0.5],
    [W * 0.97, H * 0.62, 12, 0.5],
    [W * 0.04, H * 0.7, 14, 0.6],
    [W * 0.86, H * 0.94, 9, 0.4],
  ]);

  // 헤더 라벨
  ctx.fillStyle = palette.sub;
  ctx.font = `800 22px ${SANS}`;
  ctx.textBaseline = 'top';
  ctx.fillText('카든냥 · 오늘의 네 장', 64, 80);

  // 명조 헤드라인 — 키워드 또는 작가 제목
  ctx.fillStyle = palette.text;
  ctx.font = `900 84px ${SERIF}`;
  const headline = keyword
    ? `#${keyword}`
    : trimText(profile?.exhibition_title, 14) || '하루 네 장';
  ctx.fillText(trimText(headline, 14), 64, 116);

  // 부제 — 작가가 본
  ctx.fillStyle = palette.sub;
  ctx.font = `italic 500 26px ${SERIF}`;
  const sub = keyword && profile?.nickname
    ? `— ${profile.nickname}이(가) 본 ${keyword}`
    : profile?.nickname
      ? `— ${profile.nickname}의 시선`
      : '하루 네 장의 시선';
  ctx.fillText(trimText(sub, 28), 64, 218);

  // 시집 톤 인용 — 부제와 그리드 사이 (워터마크와 충돌 방지로 그리드 위로 이동)
  drawSignature(ctx, palette, 64, 258, '"가장 오래 남는 사진은 단 한 장."');

  // 4컷 그리드 (2x2) — 워터마크 침범 방지로 cellSize 살짝 줄임 + 가로 가운데 정렬
  const startY = 308;
  const gap = 20;
  // 사용 가능 vertical: 워터마크 mascotY(1240) - 그리드 시작(308) - 하단 여유(24) = 908
  const cellSize = Math.floor((908 - gap) / 2); // 444
  const gridUsedW = cellSize * 2 + gap;
  const startX = Math.floor((W - gridUsedW) / 2);

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
    roundRectPath(ctx, x, y, cellSize, cellSize, 18);
    ctx.clip();
    if (photo?.imageUrl) {
      try {
        const img = await loadImage(photo.imageUrl);
        drawCover(ctx, img, x, y, cellSize, cellSize);
      } catch {
        ctx.fillStyle = palette.divider;
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    } else {
      // 빈 슬롯 — 시집 톤. 큰 명조 번호 흐리게
      ctx.fillStyle = palette.surface;
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.fillStyle = palette.faint;
      ctx.font = `italic 900 120px ${SERIF}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1).padStart(2, '0'), x + cellSize / 2, y + cellSize / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }
    ctx.restore();
  }

  // 워터마크 — 시집 톤 인용은 워터마크 sub로 통합 (별도 signature는 워터마크와 겹쳐 제거)
  const mascot = await loadMascotImage(theme === 'dark' ? 'night' : 'paper');
  drawWatermark(ctx, palette, mascot);

  return blobFromCanvas(canvas);
}

// =============== 단일 사진 카드 ===============
export async function generateSinglePhotoCard({ photo, profile, theme = 'light' }) {
  await ensureFonts();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const palette = PALETTES[theme] || PALETTES.light;

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, H);

  drawStars(ctx, palette, [
    [W * 0.94, 70, 16, 0.7],
    [W * 0.06, 110, 11, 0.5],
    [W * 0.93, H * 0.78, 12, 0.5],
    [W * 0.06, H * 0.86, 14, 0.6],
  ]);

  // 헤더
  ctx.fillStyle = palette.sub;
  ctx.font = `800 22px ${SANS}`;
  ctx.textBaseline = 'top';
  ctx.fillText('카든냥 · 한 장', 64, 80);

  // 큰 사진 (3:4 portrait)
  const photoW = W - 128; // 952
  const photoH = 880;
  const px = 64;
  const py = 140;
  ctx.save();
  roundRectPath(ctx, px, py, photoW, photoH, 22);
  ctx.clip();
  if (photo?.imageUrl) {
    try {
      const img = await loadImage(photo.imageUrl);
      drawCover(ctx, img, px, py, photoW, photoH);
    } catch {
      ctx.fillStyle = palette.divider;
      ctx.fillRect(px, py, photoW, photoH);
    }
  } else {
    ctx.fillStyle = palette.surface;
    ctx.fillRect(px, py, photoW, photoH);
  }
  ctx.restore();

  const photoBottom = py + photoH;

  // 명조 큰 제목
  ctx.fillStyle = palette.text;
  ctx.font = `900 56px ${SERIF}`;
  ctx.textBaseline = 'top';
  const title = photo?.title || '제목 없는 사진';
  ctx.fillText(trimText(title, 22), 64, photoBottom + 28);

  // 작가 + 날짜 (italic 명조)
  ctx.fillStyle = palette.sub;
  ctx.font = `italic 500 22px ${SERIF}`;
  const dateLabel = new Date(photo?.taken_at || photo?.created_at || Date.now())
    .toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.fillText(`— ${profile?.nickname || '익명'} · ${dateLabel}`, 64, photoBottom + 96);

  // 키워드
  if (photo?.daily_vision) {
    ctx.fillStyle = palette.accent;
    ctx.font = `italic 700 22px ${SERIF}`;
    ctx.fillText(`#${photo.daily_vision}`, 64, photoBottom + 132);
  }

  // 워터마크
  const mascot = await loadMascotImage(theme === 'dark' ? 'night' : 'paper');
  drawWatermark(ctx, palette, mascot);

  return blobFromCanvas(canvas);
}

// =============== 위클리 회고 카드 ===============
export async function generateWeeklyRecapCard({ photos, profile, theme = 'light', weekRange }) {
  await ensureFonts();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const palette = PALETTES[theme] || PALETTES.light;

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, H);

  drawStars(ctx, palette, [
    [W * 0.94, 70, 16, 0.7],
    [W * 0.06, H * 0.7, 12, 0.5],
    [W * 0.92, H * 0.78, 11, 0.5],
    [W * 0.04, 130, 13, 0.6],
  ]);

  // 헤더
  ctx.fillStyle = palette.sub;
  ctx.font = `800 22px ${SANS}`;
  ctx.textBaseline = 'top';
  ctx.fillText('카든냥 · 이번 주', 64, 80);

  // 명조 헤드라인 = 주차
  ctx.fillStyle = palette.text;
  ctx.font = `900 78px ${SERIF}`;
  ctx.fillText(trimText(weekRange || '주간 회고', 16), 64, 116);

  // 부제
  ctx.fillStyle = palette.sub;
  ctx.font = `italic 500 26px ${SERIF}`;
  ctx.fillText(`— ${profile?.nickname || '익명'}이(가) 본 풍경`, 64, 218);

  // 메인 사진 (가로 풀폭, 4:3)
  const main = photos[0];
  const mainW = W - 128;
  const mainH = Math.round(mainW * 0.7); // ~666
  const mainX = 64;
  const mainY = 280;
  ctx.save();
  roundRectPath(ctx, mainX, mainY, mainW, mainH, 22);
  ctx.clip();
  if (main?.imageUrl) {
    try {
      const img = await loadImage(main.imageUrl);
      drawCover(ctx, img, mainX, mainY, mainW, mainH);
    } catch {
      ctx.fillStyle = palette.divider;
      ctx.fillRect(mainX, mainY, mainW, mainH);
    }
  } else {
    ctx.fillStyle = palette.surface;
    ctx.fillRect(mainX, mainY, mainW, mainH);
  }
  ctx.restore();

  // 서브 4장 작은 그리드
  const subTop = mainY + mainH + 20;
  const subGap = 16;
  const subSize = Math.floor((mainW - subGap * 3) / 4);
  for (let i = 0; i < 4; i++) {
    const photo = photos[i + 1];
    const sx = mainX + i * (subSize + subGap);
    const sy = subTop;
    ctx.save();
    roundRectPath(ctx, sx, sy, subSize, subSize, 14);
    ctx.clip();
    if (photo?.imageUrl) {
      try {
        const img = await loadImage(photo.imageUrl);
        drawCover(ctx, img, sx, sy, subSize, subSize);
      } catch {
        ctx.fillStyle = palette.divider;
        ctx.fillRect(sx, sy, subSize, subSize);
      }
    } else {
      // 빈 — 작은 명조 번호
      ctx.fillStyle = palette.surface;
      ctx.fillRect(sx, sy, subSize, subSize);
      ctx.fillStyle = palette.faint;
      ctx.font = `italic 900 64px ${SERIF}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 2).padStart(2, '0'), sx + subSize / 2, sy + subSize / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }
    ctx.restore();
  }

  // 시그니처
  drawSignature(
    ctx, palette, 64,
    subTop + subSize + 28,
    `사진 ${photos.length}장 — 그중 가장 오래 남을 한 장.`
  );

  // 워터마크
  const mascot = await loadMascotImage(theme === 'dark' ? 'night' : 'paper');
  drawWatermark(ctx, palette, mascot);

  return blobFromCanvas(canvas);
}

// =============== Share / download ===============
export async function downloadFourCutCard({ photos, profile, theme, keyword }) {
  const blob = await generateFourCutCard({ photos, profile, theme, keyword });
  triggerDownload(blob, `kadennyang-fourcut-${profile?.nickname || 'card'}.png`);
}

export async function shareFourCutCard({ photos, profile, theme, keyword }) {
  const blob = await generateFourCutCard({ photos, profile, theme, keyword });
  return shareOrDownload(blob, `kadennyang-fourcut-${profile?.nickname || 'card'}.png`, {
    title: '카든냥 4컷',
    text: `${profile?.nickname || ''}의 오늘의 네 장`,
  });
}

export async function shareSinglePhotoCard({ photo, profile, theme }) {
  const blob = await generateSinglePhotoCard({ photo, profile, theme });
  return shareOrDownload(blob, `kadennyang-${photo?.title || 'photo'}.png`, {
    title: '카든냥',
    text: photo?.title || '',
  });
}

export async function shareWeeklyRecapCard({ photos, profile, theme, weekRange }) {
  const blob = await generateWeeklyRecapCard({ photos, profile, theme, weekRange });
  return shareOrDownload(blob, `kadennyang-weekly-${profile?.nickname || 'me'}.png`, {
    title: '이번 주 카든냥',
  });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareOrDownload(blob, filename, shareData) {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], ...shareData });
      return 'shared';
    } catch {
      // 사용자가 취소하거나 share 실패 → 다운로드 fallback
    }
  }
  triggerDownload(blob, filename);
  return 'downloaded';
}
