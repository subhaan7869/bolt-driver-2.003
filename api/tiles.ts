import type { IncomingMessage, ServerResponse } from 'node:http';

const SUBDOMAINS = ['a', 'b', 'c', 'd'] as const;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const host = req.headers.host || 'localhost';
  const parsedUrl = new URL(req.url || '/', `https://${host}`);
  const modeParam = parsedUrl.searchParams.get('mode') || '';
  const pathParam = parsedUrl.searchParams.get('path') || '';
  const cleanPath =
    pathParam || parsedUrl.pathname.replace(/^\/api\/tiles\/?/, '');

  const rawKey = (process.env.CARTO_API_KEY || process.env.VITE_CARTO_API_KEY || '').trim();
  const hasCartoKey = Boolean(rawKey && rawKey !== 'MY_CARTO_API_KEY');

  if (modeParam === 'info' || cleanPath === 'info') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.end(JSON.stringify({ cartoConfigured: hasCartoKey }));
    return;
  }

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

  try {
    let tileResponse: globalThis.Response | null = null;

    // 1. Only use CARTO when a real CARTO_API_KEY is configured and not returning a watermark tile
    if (hasCartoKey) {
      const sub = SUBDOMAINS[Math.abs(x + y) % SUBDOMAINS.length];
      const cartoPath =
        style === 'dark_all'
          ? `dark_all/${z}/${x}/${y}${retinaSuffix}.png`
          : `rastertiles/voyager/${z}/${x}/${y}${retinaSuffix}.png`;
      const cartoUrl = `https://${sub}.basemaps.cartocdn.com/${cartoPath}?key=${encodeURIComponent(rawKey)}`;

      const candidate = await fetch(cartoUrl, {
        headers: { Accept: 'image/png,image/*;q=0.8' },
      });
      const etag = (candidate.headers.get('etag') || '').toLowerCase();
      if (candidate.ok && !etag.includes('wm-')) {
        tileResponse = candidate;
      }
    }

    // 2. Keyless ArcGIS World Street Map (CloudFront CDN, no API key required)
    if (!tileResponse) {
      const arcgisCandidate = await fetch(
        `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${z}/${y}/${x}`,
        {
          headers: { Accept: 'image/jpeg,image/png,image/*;q=0.8' },
        }
      );
      if (arcgisCandidate.ok) {
        tileResponse = arcgisCandidate;
      }
    }

    // 3. OpenStreetMap fallback
    if (!tileResponse) {
      tileResponse = await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, {
        headers: {
          'User-Agent': 'BoltDriverApp/1.0 (+https://bolt.eu)',
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
