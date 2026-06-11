export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');

  if (!target) {
    return new Response('Missing url param', { status: 400 });
  }

  // Spoof le Referer pour faire croire qu'on vient de vidmoly.to
  const response = await fetch(target, {
    headers: {
      'Referer': 'https://vidmoly.to/',
      'Origin': 'https://vidmoly.to',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  });

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const body = await response.text();

  // Si c'est un .m3u8, on réérit les URLs internes pour qu'elles passent aussi par le proxy
  let finalBody = body;
  if (contentType.includes('mpegurl') || target.endsWith('.m3u8')) {
    const base = new URL(target);
    finalBody = body.split('\n').map(line => {
      if (line.startsWith('#') || line.trim() === '') return line;
      const absolute = line.startsWith('http') ? line : `${base.origin}${base.pathname.replace(/\/[^/]*$/, '/')}${line}`;
      return `/api/proxy?url=${encodeURIComponent(absolute)}`;
    }).join('\n');
  }

  return new Response(finalBody, {
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
    }
  });
}
