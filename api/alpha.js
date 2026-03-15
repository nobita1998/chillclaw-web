import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');

  const result = { upcoming: null, listed: null };

  // 1. Upcoming airdrops from Alpha123 cache (updated by GitHub Actions every 30min)
  try {
    const cachePath = join(process.cwd(), 'alpha-cache.json');
    const cached = JSON.parse(readFileSync(cachePath, 'utf8'));
    const airdrops = (cached.airdrops || []).filter(a => !a.completed);
    result.upcoming = {
      airdrops,
      top3: cached.top3_tokens || [],
      bnbPrice: cached.bnb_price_usd || null,
    };
  } catch (_) {}

  // 2. Recently listed Alpha tokens from Binance official API
  try {
    const resp = await fetch(
      'https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list',
      { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'Accept-Encoding': 'gzip, deflate, br' } }
    );
    if (resp.ok) {
      const raw = await resp.json();
      const tokens = raw.data || [];
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recent = tokens
        .filter(t => t.listingTime && t.listingTime > weekAgo && !t.offline)
        .sort((a, b) => b.listingTime - a.listingTime)
        .map(t => ({
          symbol: t.symbol, name: t.name, chain: t.chainName,
          contractAddress: t.contractAddress, price: t.price,
          change24h: t.percentChange24h, volume24h: t.volume24h,
          marketCap: t.marketCap, holders: t.holders,
          listingCex: t.listingCex, mulPoint: t.mulPoint,
          listingTime: t.listingTime ? new Date(t.listingTime).toISOString() : null,
        }));

      const top10 = tokens
        .filter(t => !t.offline && t.volume24h)
        .sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
        .slice(0, 10)
        .map(t => ({
          symbol: t.symbol, name: t.name, price: t.price,
          volume24h: t.volume24h, change24h: t.percentChange24h, mulPoint: t.mulPoint,
        }));

      result.listed = { recentListings: recent, top10Volume: top10, totalTokens: tokens.length };
    }
  } catch (_) {}

  if (!result.upcoming && !result.listed) {
    return res.status(503).json({ error: 'All Alpha data sources unavailable' });
  }

  res.status(200).json(result);
}
