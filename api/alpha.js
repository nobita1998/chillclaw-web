import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  try {
    const resp = await fetch('https://alpha123.uk/api/data?fresh=1', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://alpha123.uk/',
        'Origin': 'https://alpha123.uk',
      },
    });
    if (resp.ok) {
      const data = await resp.json();
      return res.status(200).json(data);
    }
  } catch (_) {}

  // Fallback to static cache
  try {
    const cachePath = join(process.cwd(), 'alpha-cache.json');
    const cached = JSON.parse(readFileSync(cachePath, 'utf8'));
    cached._fallback = true;
    return res.status(200).json(cached);
  } catch (_) {}

  res.status(503).json({ error: 'Alpha123 unavailable and no cache' });
}
