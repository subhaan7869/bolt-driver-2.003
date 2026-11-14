import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const SUBDOMAINS = ['a', 'b', 'c', 'd'] as const;

async function startServer() {
  const app = express();

  app.get('/api/tiles/info', (_req: Request, res: Response) => {
    const rawKey = (process.env.CARTO_API_KEY || process.env.VITE_CARTO_API_KEY || '').trim();
    const hasCartoKey = Boolean(rawKey && rawKey !== 'MY_CARTO_API_KEY');
    res.json({ cartoConfigured: hasCartoKey });
  });

  // Server-side basemap tile proxy (uses CARTO only if configured & unwatermarked; otherwise keyless ArcGIS/OSM)
  app.get('/api/tiles/:style/:z/:x/:yFile', async (req: Request, res: Response) => {
    if (req.query.mode === 'info') {
      const rawKey = (process.env.CARTO_API_KEY || process.env.VITE_CARTO_API_KEY || '').trim();
      res.json({ cartoConfigured: Boolean(rawKey && rawKey !== 'MY_CARTO_API_KEY') });
      return;
    }

    const style = String(req.params.style || '');
    const z = Number(req.params.z);
    const x = Number(req.params.x);
    const yFile = String(req.params.yFile || '');
    const yMatch = /^(\d+)(@2x)?\.png$/.exec(yFile);

    if (
      (style !== 'voyager' && style !== 'dark_all') ||
      !Number.isInteger(z) ||
      z < 0 ||
      z > 20 ||
      !Number.isInteger(x) ||
      x < 0 ||
      !yMatch
    ) {
      res.status(400).send('Invalid tile request');
      return;
    }

    const y = Number(yMatch[1]);
    const retinaSuffix = yMatch[2] || '';
    const sub = SUBDOMAINS[Math.abs(x + y) % SUBDOMAINS.length];

    const rawKey = (process.env.CARTO_API_KEY || process.env.VITE_CARTO_API_KEY || '').trim();
    const hasCartoKey = Boolean(rawKey && rawKey !== 'MY_CARTO_API_KEY');

    try {
      let tileResponse: globalThis.Response | null = null;

      if (hasCartoKey) {
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

      if (!tileResponse) {
        tileResponse = await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, {
          headers: {
            'User-Agent': 'BoltDriverApp/1.0 (+https://bolt.eu)',
            Accept: 'image/png,image/*;q=0.8',
          },
        });
      }

      if (!tileResponse.ok) {
        res.status(tileResponse.status).send('Tile unavailable');
        return;
      }

      const contentType = tileResponse.headers.get('content-type') || 'image/png';
      const arrayBuf = await tileResponse.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(Buffer.from(arrayBuf));
    } catch {
      res.status(502).send('Failed to fetch map tile');
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
