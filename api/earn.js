export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  // Proxy to /api/news with earn-specific params
  const base = `https://${req.headers.host}`;
  try {
    const r = await fetch(`${base}/api/news?q=Yield+Arena+Simple+Earn+Flexible+Locked&limit=5&parse=1`);
    if (!r.ok) {
      const err = await r.text();
      return res.status(r.status).json({ error: err });
    }
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
