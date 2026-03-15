export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');

  try {
    const resp = await fetch(
      'https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      }
    );

    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'Binance Alpha API unavailable' });
    }

    const raw = await resp.json();
    const tokens = raw.data || [];

    // Recent TGE/Airdrop tokens (last 7 days)
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recent = tokens
      .filter(t => t.listingTime && t.listingTime > weekAgo)
      .sort((a, b) => b.listingTime - a.listingTime);

    // Upcoming TGE/Airdrop
    const tge = tokens.filter(t => t.onlineTge && !t.offline);
    const airdrop = tokens.filter(t => t.onlineAirdrop && !t.offline);

    // Top by volume (24h)
    const top = [...tokens]
      .filter(t => !t.offline && t.volume24h)
      .sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
      .slice(0, 10);

    // Hot tags
    const hot = tokens.filter(t => t.hotTag && !t.offline);

    res.status(200).json({
      source: 'binance_official',
      totalTokens: tokens.length,
      recentListings: recent.map(simplify),
      tge: tge.map(simplify),
      airdrop: airdrop.map(simplify),
      top10Volume: top.map(simplify),
      hotTags: hot.map(simplify),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function simplify(t) {
  return {
    symbol: t.symbol,
    name: t.name,
    chain: t.chainName,
    contractAddress: t.contractAddress,
    price: t.price,
    change24h: t.percentChange24h,
    volume24h: t.volume24h,
    marketCap: t.marketCap,
    liquidity: t.liquidity,
    holders: t.holders,
    listingCex: t.listingCex,
    onlineTge: t.onlineTge,
    onlineAirdrop: t.onlineAirdrop,
    mulPoint: t.mulPoint,
    listingTime: t.listingTime ? new Date(t.listingTime).toISOString() : null,
  };
}
