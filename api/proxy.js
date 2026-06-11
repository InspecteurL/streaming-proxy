export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get('url');

  if (!target) {
    return new Response('Missing url param', { status: 400 });
  }

  const response = await fetch(target, {
    headers: {
      'Referer': 'https://vidmoly.to/',
      'Origin': 'https://vidmoly.to',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    }
  });

  if (!response.ok) {
    return new Response(`Erreur ${response.status}: ${response.statusText}`, { status: response.status });
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const body = await response.text();

  let finalBody = body;

  if (contentType.includes('mpegurl') || target.includes('.m3u8')) {
    const base = new URL(target);
    finalBody = body.split('\n').map(line => {
      if (line.startsWith('#') || line.trim() === '') return line;
      const absolute = line.startsWith('http')
        ? line
        : `${base.origin}${base.pathname.replace(/\/[^/]*$/, '/')}${line}`;
      return `/api/proxy?url=${encodeURIComponent(absolute)}`;
    }).join('\n');
  }

  return new Response(finalBody, {
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  });
}
