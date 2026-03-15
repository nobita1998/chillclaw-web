export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  const apiKey = process.env.SURF_AI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'SURF_AI_API_KEY not configured' });
  }

  const symbol = req.query.symbol;
  if (!symbol) {
    return res.status(400).json({ error: 'symbol parameter required' });
  }

  try {
    const resp = await fetch('https://api.asksurf.ai/surf-ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'surf-ask',
        messages: [
          { role: 'system', content: 'You are Surf, a crypto research assistant. Always respond in Chinese (简体中文). Keep the response concise (under 300 words).' },
          { role: 'user', content: `简要分析 ${symbol} 代币的投资价值，包括项目概览、链上数据、社交热度、风险评估和投资建议。` },
        ],
        stream: false,
        ability: ['search', 'evm_onchain', 'market_analysis'],
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(resp.status).json({ error: err });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || '';
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=120');
    res.status(200).json({ symbol, content });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
