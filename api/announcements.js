export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  // catalogId: 93=活动, 48=新币上线, 49=公告更新(Yield Arena), 128=空投
  const catalogId = req.query.catalogId || '93';
  const pageSize = Math.min(parseInt(req.query.limit) || 20, 50);

  try {
    const resp = await fetch(
      `https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&pageNo=1&pageSize=${pageSize}&catalogId=${catalogId}`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Encoding': 'gzip, deflate, br' } }
    );

    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'Binance announcement API unavailable' });
    }

    const raw = await resp.json();
    const articles = (raw.data?.catalogs?.[0]?.articles || []).map(a => ({
      title: a.title,
      code: a.code,
      publishDate: a.publishDate,
    }));

    res.status(200).json({ catalogId, articles });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
