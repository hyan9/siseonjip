// 작품별 동적 OG — Vercel Serverless Function.
// 카톡·트위터·슬랙 등 크롤러가 /s/a/:id 접속 시 작품 사진+제목으로 미리보기 카드 생성.
// 일반 사용자는 SPA로 redirect (?artwork=:id 쿼리로 진입).
//
// vercel.json rewrite: /s/a/:id → /api/og/:id

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// 카톡·페북·트위터·슬랙·디스코드·라인·노션·텔레그램 등의 크롤러 UA
const CRAWLER_RE = /bot|crawler|spider|whatsapp|slack|twitter|facebook|kakao|naver|line|discord|telegram|preview|fetcher|googlebot|bingbot|duckduckbot|skypeuripreview|notion/i;

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function transformedPhotoUrl(url, width = 1200) {
  if (!url) return null;
  const marker = '/storage/v1/object/public/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url; // 외부 URL은 그대로
  const base = url.slice(0, idx);
  const rest = url.slice(idx + marker.length);
  return `${base}/storage/v1/render/image/public/${rest}?width=${width}&quality=80`;
}

export default async function handler(req, res) {
  const { id } = req.query;
  const userAgent = req.headers['user-agent'] || '';
  const isCrawler = CRAWLER_RE.test(userAgent);

  // 일반 사용자는 SPA로
  if (!isCrawler) {
    res.writeHead(302, { Location: `/?artwork=${encodeURIComponent(id)}` });
    res.end();
    return;
  }

  // 크롤러: Supabase에서 작품 fetch
  let artwork = null;
  let authorName = '';
  if (SUPABASE_URL && SUPABASE_KEY && id) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data } = await sb
        .from('artworks')
        .select('id, title, image_url, storage_path, user_id')
        .eq('id', id)
        .single();
      artwork = data;
      if (artwork?.user_id) {
        const { data: profile } = await sb
          .from('profiles')
          .select('nickname')
          .eq('id', artwork.user_id)
          .single();
        authorName = profile?.nickname || '';
      }
    } catch {
      // fall through with default
    }
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'kadennyang.app';
  const origin = `${proto}://${host}`;

  const title = artwork?.title || '카든냥 작품';
  const description = authorName ? `${authorName} · 카든냥` : '카든냥 — 카메라 든 냥이의 하루 네 장';

  // 우선순위: storage_path 변환 URL > image_url > 기본 OG
  let image = `${origin}/og-image.png`;
  if (artwork?.image_url) {
    image = transformedPhotoUrl(artwork.image_url, 1200);
  } else if (artwork?.storage_path && SUPABASE_URL) {
    image = `${SUPABASE_URL}/storage/v1/render/image/public/photos/${artwork.storage_path}?width=1200&quality=80`;
  }

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)} — 카든냥</title>
<meta name="description" content="${escapeHtml(description)}" />

<meta property="og:type" content="article" />
<meta property="og:site_name" content="카든냥" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:url" content="${escapeHtml(origin)}/s/a/${escapeHtml(id)}" />
<meta property="og:locale" content="ko_KR" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />

<meta http-equiv="refresh" content="0; url=/?artwork=${encodeURIComponent(id)}" />
</head>
<body></body>
</html>`;

  res.setHeader('content-type', 'text/html; charset=utf-8');
  // CDN 캐시 5분 + 백그라운드 갱신 24시간 — 크롤러가 자주 같은 URL 친다
  res.setHeader('cache-control', 'public, s-maxage=300, stale-while-revalidate=86400');
  res.status(200).send(html);
}
