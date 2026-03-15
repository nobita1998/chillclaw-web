const SITE = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  const base = `https://${req.headers.host}`;
  const results = { alpha: null, booster: null, earn: null };

  await Promise.allSettled([
    (async () => {
      const r = await fetch(`${base}/api/alpha`);
      if (r.ok) results.alpha = await r.json();
    })(),
    (async () => {
      const r = await fetch(`${base}/api/booster`);
      if (r.ok) results.booster = await r.json();
    })(),
    (async () => {
      const token = process.env.OPENNEWS_TOKEN;
      if (!token) return;
      const r = await fetch(`${base}/api/news?q=Yield+Arena+Simple+Earn+Flexible+Locked&limit=5&parse=1`);
      if (r.ok) results.earn = await r.json();
    })(),
  ]);

  res.status(200).json(results);
}
