export const maxDuration = 300; // 5 minutes max (Vercel Pro), free plan caps at 60s

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
        model: 'surf-research',
        messages: [
          { role: 'system', content: 'You are Surf, a crypto research assistant. Always respond in Chinese (简体中文). Use markdown format with clear sections.' },
          { role: 'user', content: `深度分析 ${symbol} 代币，严格按以下三部分输出：

## 1. 项目概览
做什么的、哪条链、技术栈、团队背景、竞争优势

## 2. 融资情况
投资方、融资轮次、金额、估值

## 3. 代币经济学
总量、分配比例（团队/投资人/社区/生态）、解锁计划、预估 FDV

每部分尽量用数据说话，没有数据的标注"暂无公开信息"。` },
        ],
        stream: true,
        ability: ['search', 'evm_onchain', 'market_analysis'],
      }),
    });

    if (!resp.ok) {
      // Fallback to surf-ask if surf-research fails
      const askResp = await fetch('https://api.asksurf.ai/surf-ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'surf-ask',
          messages: [
            { role: 'system', content: 'You are Surf, a crypto research assistant. Always respond in Chinese (简体中文). Use markdown format with clear sections.' },
            { role: 'user', content: `分析 ${symbol} 代币，严格按以下三部分输出：\n\n## 1. 项目概览\n做什么的、哪条链、技术栈、团队背景、竞争优势\n\n## 2. 融资情况\n投资方、融资轮次、金额、估值\n\n## 3. 代币经济学\n总量、分配比例（团队/投资人/社区/生态）、解锁计划、预估 FDV\n\n每部分尽量用数据说话，没有数据的标注"暂无公开信息"。` },
          ],
          stream: false,
          ability: ['search', 'evm_onchain', 'market_analysis'],
        }),
      });
      if (!askResp.ok) {
        const err = await askResp.text();
        return res.status(askResp.status).json({ error: err });
      }
      const askData = await askResp.json();
      const askContent = askData?.choices?.[0]?.message?.content || '';
      res.setHeader('Cache-Control', 's-maxage=2592000, stale-while-revalidate=86400');
      return res.status(200).json({ symbol, content: askContent, model: 'surf-ask-fallback' });
    }

    // Read streaming response
    let content = '';
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        const jsonStr = line.slice(6);
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed?.choices?.[0]?.delta?.content || '';
          content += delta;
        } catch (_) {}
      }
    }
    res.setHeader('Cache-Control', 's-maxage=2592000, stale-while-revalidate=86400');
    res.status(200).json({ symbol, content, model: 'surf-research' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
