# 🦞 ChillClaw — 币安躺赚助手

> 币安生态太丰富，Alpha 新币、Booster 解锁、Earn 理财层出不穷。ChillClaw 帮你一站搞定——躺着也能赚。

**Live Demo:** https://chillclaw-web.vercel.app

---

## 🎬 演示

<!-- 演示视频/GIF 放这里 -->

---

## 解决什么问题

| 痛点 | ChillClaw 的解法 |
|------|----------------|
| Alpha 新币来不及研究 | 自动发现新币 + Surf AI 生成投研报告，合约审计/Smart Money 一键呈现 |
| Booster 解锁日期记不住 | 实时解锁倒计时 + 当前价格 + 抛压分析，最佳卖出窗口不再错过 |
| 闲钱放着没理财 | 扫描持仓闲置资产，对比 Yield Arena 全部利率，推荐最优组合 |

---

## 功能模块

### 📡 Alpha 投研
- 自动追踪即将 TGE / 空投的代币
- 对接 Surf AI，预热生成专业投研报告（合约审计 + Smart Money + 建议）
- 展示已上线代币实时交易量，推荐最适合刷积分的代币

### 📅 Booster 解锁追踪
- 自建解锁日历，按日期排序展示所有 Booster 项目
- 合约优先的实时价格（合约 → 现货 → DEX）
- 结合链上数据分析解锁抛压，给出卖/持/分批出建议

### 💰 Earn 理财优化
- 公开模式：抓取 Yield Arena 全部产品利率，按收益分层推荐
- 个性化模式（需 Binance API Key）：扫描持仓 → 识别闲置资产 → 匹配最优理财产品

---

## 快速开始

### 方式一：OpenClaw Skill（推荐）
```
Install this skill: https://github.com/nobita1998/chillclaw-web
```

### 方式二：Claude Code MCP
```bash
claude mcp add chillclaw -- uvx --from git+https://github.com/nobita1998/chillclaw-web#subdirectory=mcp chillclaw-mcp
```

### 方式三：网页版
直接访问 https://chillclaw-web.vercel.app

---

## API 端点

Base URL: `https://chillclaw-web.vercel.app`，所有端点无需认证。

| 端点 | 功能 |
|------|------|
| `GET /api/alpha` | Alpha 新币列表 + 实时价格/成交量 |
| `GET /api/booster` | Booster 解锁日历（即将 + 近期）|
| `GET /api/earn` | Yield Arena 利率列表 |
| `GET /api/price?symbols=A,B` | 批量实时价格 |
| `GET /api/overview` | Alpha + Booster + Earn 三场景汇总 |
| `GET /research/{TOKEN}.json` | 预热投研报告（GitHub Actions 自动生成）|

---

## 架构

```
用户提问
  └─ OpenClaw / Claude Code Skill
       ├─ /api/alpha  ──→ Surf AI 投研（GitHub Actions 预热）
       ├─ /api/booster ──→ 自建解锁日历 + 实时价格
       └─ /api/earn  ──→ Yield Arena 利率
                          └─ (有 Key) Binance API 个性化持仓分析
```

GitHub Actions 在发现新代币时自动调用 Surf AI 生成投研报告并缓存为静态文件，用户查询时零等待。

---

## 可选：Binance API Key 配置

只有查询个人持仓/理财才需要，公开查询完全免费无需 Key。

```env
BINANCE_API_KEY=your_key
BINANCE_API_SECRET=your_secret
```

> ⚠️ 安全提示：仅开启「允许读取」权限，关闭交易/提现/充值。ChillClaw 只读取数据，不会发起任何交易。

---

## 本地开发

```bash
git clone https://github.com/nobita1998/chillclaw-web
cd chillclaw-web
# API 托管在 Vercel，本地直接使用线上端点即可
```

---

## 参赛信息

本项目参加 **币安 × OpenClaw AI Agent 创意大赛 2026**

- 作品名称：ChillClaw（躺赚龙虾）
- 参赛方向：用户服务 × 运营工具
- 核心亮点：Alpha/Booster/Earn 三场景打通，AI 全程自动完成「发现机会 → 深度分析 → 决策建议」

---

*以上分析仅供参考，请 DYOR。*
