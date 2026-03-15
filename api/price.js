export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  const symbols = (req.query.symbols || '').split(',').filter(Boolean);
  if (symbols.length === 0) {
    return res.status(400).json({ error: 'symbols parameter required' });
  }

  const prices = {};

  await Promise.allSettled(
    symbols.map(async (s) => {
      const sym = s.toUpperCase();
      // 1. Futures (USDT-M)
      try {
        const r = await fetch(`https://fapi.binance.com/fapi/v2/ticker/price?symbol=${sym}USDT`);
        if (r.ok) {
          const d = await r.json();
          if (d.price) { prices[sym] = { price: parseFloat(d.price), source: 'futures' }; return; }
        }
      } catch (_) {}
      // 2. Spot
      try {
        const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}USDT`);
        if (r.ok) {
          const d = await r.json();
          if (d.price) { prices[sym] = { price: parseFloat(d.price), source: 'spot' }; return; }
        }
      } catch (_) {}
      // 3. DexScreener (on-chain)
      try {
        const r = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(sym)}`);
        if (r.ok) {
          const d = await r.json();
          const pairs = d.pairs || [];
          const best =
            pairs.find(p => p.baseToken.symbol.toUpperCase() === sym && p.quoteToken.symbol === 'USDT') ||
            pairs.find(p => p.baseToken.symbol.toUpperCase() === sym && p.chainId === 'bsc') ||
            pairs.find(p => p.baseToken.symbol.toUpperCase() === sym && p.priceUsd);
          if (best && best.priceUsd) {
            prices[sym] = { price: parseFloat(best.priceUsd), source: 'dex' };
          }
        }
      } catch (_) {}
    })
  );

  res.status(200).json(prices);
}
