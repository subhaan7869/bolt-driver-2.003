import type { IncomingMessage, ServerResponse } from 'node:http';

const SUBDOMAINS = ['a', 'b', 'c', 'd'] as const;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const host = req.headers.host || 'localhost';
  const parsedUrl = new URL(req.url || '/', `https://${host}`);
  const pathParam = parsedUrl.searchParams.get('path') || '';
  const cleanPath =
    pathParam || parsedUrl.pathname.replace(/^\/api\/tiles\/?/, '');

  const match = /^(voyager|dark_all)\/(\d+)\/(\d+)\/(\d+)(@2x)?\.png$/.exec(cleanPath);
  if (!match) {
    res.statusCode = 400;
    res.end('Invalid tile request');
    return;
  }

  const style = match[1];
  const z = Number(match[2]);
  const x = Number(match[3]);
  const y = Number(match[4]);
  const retinaSuffix = match[5] || '';

  if (!Number.isInteger(z) || z < 0 || z > 20 || !Number.isInteger(x) || x < 0) {
    res.statusCode = 400;
    res.end('Invalid tile coordinates');
    return;
  }

  const sub = SUBDOMAINS[Math.abs(x + y) % SUBDOMAINS.length];
  const rawKey = (process.env.CARTO_API_KEY || process.env.VITE_CARTO_API_KEY || '').trim();
  const hasCartoKey = Boolean(rawKey && rawKey !== 'MY_CARTO_API_KEY');

  const cartoPath =
    style === 'dark_all'
      ? `dark_all/${z}/${x}/${y}${retinaSuffix}.png`
      : `rastertiles/voyager/${z}/${x}/${y}${retinaSuffix}.png`;

  const cartoUrl = hasCartoKey
    ? `https://${sub}.basemaps.cartocdn.com/${cartoPath}?key=${encodeURIComponent(rawKey)}`
    : `https://${sub}.basemaps.cartocdn.com/${cartoPath}`;

  try {
    let tileResponse: globalThis.Response | null = null;

    const candidate = await fetch(cartoUrl, {
      headers: { Accept: 'image/png,image/*;q=0.8' },
    });
    if (candidate.ok) {
      tileResponse = candidate;
    }

    if (!tileResponse) {
      tileResponse = await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, {
        headers: {
          'User-Agent': 'BoltDriverReplica/1.0 (+https://bolt.eu)',
          Accept: 'image/png,image/*;q=0.8',
        },
      });
    }

    if (!tileResponse.ok) {
      res.statusCode = tileResponse.status;
      res.end('Tile unavailable');
      return;
    }

    const contentType = tileResponse.headers.get('content-type') || 'image/png';
    const arrayBuf = await tileResponse.arrayBuffer();
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    res.end(Buffer.from(arrayBuf));
  } catch {
    res.statusCode = 502;
    res.end('Failed to fetch map tile');
  }
}
