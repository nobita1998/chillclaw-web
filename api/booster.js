export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  try {
    // Fetch unlock data
    const unlockResp = await fetch('https://booster-unlock.vercel.app/api.json');
    if (!unlockResp.ok) throw new Error('Booster Calendar unavailable');
    const unlockData = await unlockResp.json();

    const now = new Date();
    const utc8 = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
    utc8.setHours(0, 0, 0, 0);

    // Calculate all unlock events
    const events = [];
    const symbolSet = new Set();

    for (const token of unlockData.tokens) {
      const tge = new Date(token.tgeDate + 'T00:00:00');
      for (const u of token.unlockSchedule) {
        const unlockDate = new Date(tge);
        unlockDate.setDate(unlockDate.getDate() + u.daysFromTGE);
        const dateStr = unlockDate.toISOString().split('T')[0];
        const days = Math.ceil((unlockDate - utc8) / 86400000);
        symbolSet.add(token.symbol.toUpperCase());
        events.push({
          symbol: token.symbol,
          name: token.name,
          date: dateStr,
          days,
          round: u.round,
          period: u.period,
          pending: u.pending || false,
        });
      }
    }

    // Fetch prices — batch query instead of per-symbol to avoid rate limits
    const symbols = [...symbolSet];
    const prices = {};
    try {
      const [futuresResp, spotResp] = await Promise.allSettled([
        fetch('https://fapi.binance.com/fapi/v2/ticker/price'),
        fetch('https://api.binance.com/api/v3/ticker/price'),
      ]);
      const futuresData = futuresResp.status === 'fulfilled' && futuresResp.value.ok
        ? await futuresResp.value.json() : [];
      const spotData = spotResp.status === 'fulfilled' && spotResp.value.ok
        ? await spotResp.value.json() : [];
      // Index futures prices first (preferred), then fill gaps with spot
      for (const d of futuresData) {
        const sym = d.symbol?.replace('USDT', '');
        if (sym && symbols.includes(sym) && d.price) prices[sym] = parseFloat(d.price);
      }
      for (const d of spotData) {
        const sym = d.symbol?.replace('USDT', '');
        if (sym && symbols.includes(sym) && d.price && !prices[sym]) prices[sym] = parseFloat(d.price);
      }
    } catch (_) {}

    // Attach prices and sort
    events.forEach(e => { e.price = prices[e.symbol.toUpperCase()] || null; });
    const future = events.filter(e => e.days >= 0).sort((a, b) => a.days - b.days);
    const recent = events.filter(e => e.days < 0 && e.days >= -14).sort((a, b) => b.days - a.days);

    res.status(200).json({
      upcoming: future,
      recent,
      prices,
      lastUpdated: unlockData.lastUpdated,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
