export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  const token = process.env.OPENNEWS_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'OPENNEWS_TOKEN not configured' });
  }

  try {
    const resp = await fetch('https://api.6551.io/open/news_search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: 'Yield Arena Simple Earn Flexible Locked',
        limit: 5,
        page: 1,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(resp.status).json({ error: err });
    }

    const data = await resp.json();
    const items = data.data || [];
    const products = [];

    const detailed = items.find(
      (i) => i.newsType === '6551News' && (i.text || '').includes('Product')
    );

    if (detailed) {
      const text = detailed.text || '';
      const dateMatch = text.match(/\((\d{4}-\d{2}-\d{2})\)/);
      const announcementDate = dateMatch ? dateMatch[1] : '';

      // Flexible Products
      const flexRegex =
        /(\w+)FlexibleReal-Time APR \(Approximately ([\d.]+%)\)(?:\+([\d.]+%) Bonus Tiered APR\(Tier 0 - ([\d,.]+ \w+)\))?/g;
      let m;
      while ((m = flexRegex.exec(text)) !== null) {
        const baseApr = parseFloat(m[2]);
        const bonusApr = m[3] ? parseFloat(m[3]) : 0;
        products.push({
          asset: m[1], type: 'Flexible', duration: '活期',
          baseApr, bonusApr, totalApr: baseApr + bonusApr,
          bonusTier: m[4] || '', date: announcementDate,
        });
      }

      // Locked Products
      const lockedRegex = /(\w+)(\d+ days)\s*([\d.]+%)(?: \+ APR Boost)?/g;
      while ((m = lockedRegex.exec(text)) !== null) {
        products.push({
          asset: m[1], type: 'Locked', duration: m[2].replace('days', '天'),
          baseApr: parseFloat(m[3]), bonusApr: 0, totalApr: parseFloat(m[3]),
          bonusTier: '', date: announcementDate,
        });
      }

      // ETH Staking
      const ethStake = text.match(/ETH StakingETHFlexibleDynamic APR\s*\(?Up to ([\d.]+%)\)?/);
      if (ethStake) {
        products.push({ asset: 'ETH', type: 'Staking', duration: '活期',
          baseApr: parseFloat(ethStake[1]), bonusApr: 0, totalApr: parseFloat(ethStake[1]),
          bonusTier: '', date: announcementDate });
      }

      // SOL Staking
      const solStake = text.match(/SOL StakingSOLFlexibleDynamic APR\s*\(?Up to ([\d.]+%)\)?/);
      if (solStake) {
        products.push({ asset: 'SOL', type: 'Staking', duration: '活期',
          baseApr: parseFloat(solStake[1]), bonusApr: 0, totalApr: parseFloat(solStake[1]),
          bonusTier: '', date: announcementDate });
      }

      // Dual Investment
      const dualRegex = /Dual Investment(\w+)Multiple Settlement Dates([\d.]+% or more)/g;
      while ((m = dualRegex.exec(text)) !== null) {
        products.push({
          asset: m[1], type: 'Dual Investment', duration: '多期',
          baseApr: parseFloat(m[2]), bonusApr: 0, totalApr: parseFloat(m[2]),
          bonusTier: '', date: announcementDate,
        });
      }
    }

    products.sort((a, b) => b.totalApr - a.totalApr);
    res.status(200).json({ products, announcementCount: items.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
