"""ChillClaw MCP Server — Binance one-stop assistant tools."""

import os
import sys

if sys.platform == "win32":
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import httpx
from mcp.server.fastmcp import FastMCP

BASE_URL = os.environ.get("CHILLCLAW_API_URL", "https://chillclaw-web.vercel.app")

_INSTRUCTIONS = """\
ChillClaw 🦞 — 币安一站式躺赚助手 MCP Server

提供三大核心工具：
1. Alpha 投研 — 发现新代币，投研报告已预热（GitHub Actions 自动生成）
2. Booster 追踪 — 解锁日历 + 实时价格 + 倒计时
3. 理财 Earn — Binance Yield Arena 最新产品和利率

额外工具：
- 批量价格查询（合约 → 现货 → DEX）

注意：投研报告通过 get_alpha 返回，不单独暴露实时调用接口。
"""

mcp = FastMCP(
    "chillclaw",
    instructions=_INSTRUCTIONS,
    json_response=True,
)

_client = None

async def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=httpx.Timeout(60.0))
    return _client


@mcp.tool()
async def get_overview() -> dict:
    """获取 ChillClaw 一键总览：Alpha 新币 + Booster 解锁 + 理财产品，三大场景汇总数据。"""
    client = await get_client()
    resp = await client.get(f"{BASE_URL}/api/overview")
    resp.raise_for_status()
    return resp.json()


@mcp.tool()
async def get_alpha() -> dict:
    """获取 Alpha 新币数据 + 预热好的投研报告。返回 upcoming（即将空投，含 CA/链/日期）、listed（已上线代币实时数据）、research（预热的 Surf AI 投研，按代币符号索引）。"""
    client = await get_client()
    # Get alpha data
    alpha_resp = await client.get(f"{BASE_URL}/api/alpha")
    alpha_resp.raise_for_status()
    alpha_data = alpha_resp.json()

    # Get pre-warmed research for upcoming tokens
    research = {}
    upcoming = alpha_data.get("upcoming", {}).get("airdrops", [])
    for token in upcoming:
        symbol = token.get("token", "")
        if not symbol:
            continue
        try:
            r = await client.get(f"{BASE_URL}/research/{symbol}.json")
            if r.status_code == 200:
                research[symbol] = r.json()
        except Exception:
            pass

    alpha_data["research"] = research
    return alpha_data


@mcp.tool()
async def get_booster() -> dict:
    """获取 Booster 解锁日历：所有代币的解锁倒计时、实时价格（合约/现货）、解锁轮次信息。"""
    client = await get_client()
    resp = await client.get(f"{BASE_URL}/api/booster")
    resp.raise_for_status()
    return resp.json()


@mcp.tool()
async def get_earn() -> dict:
    """获取 Binance Earn 理财产品：从 Yield Arena 公告解析的最新产品列表，含币种、类型、年化收益率。"""
    client = await get_client()
    resp = await client.get(f"{BASE_URL}/api/earn")
    resp.raise_for_status()
    return resp.json()


@mcp.tool()
async def get_prices(symbols: str) -> dict:
    """批量查询代币价格。优先合约价格，降级为现货，再降级为 DEX 链上价格。

    Args:
        symbols: 逗号分隔的代币符号，如 "BAS,KAT,OPN"
    """
    client = await get_client()
    resp = await client.get(f"{BASE_URL}/api/price", params={"symbols": symbols})
    resp.raise_for_status()
    return resp.json()


def main():
    mcp.run()


if __name__ == "__main__":
    main()
