# ScamGuard · 脆盾

社群（Threads/脆、IG、LINE）詐騙話術即時判讀 MVP。

## 構成

- `scamguard/index.html` — 靜態落地頁 + 即時 demo（呼叫 Worker `/analyze`）
- `worker/scamguard-worker.js` — Cloudflare Worker，同時處理：
  - `POST /analyze` — 網頁 demo 用的公開 API
  - `POST /line/webhook` — LINE Messaging API webhook（含簽章驗證）
  - `POST /report` + `GET /blacklist` — 眾包黑名單
- `worker/scamguard-wrangler.toml` — Worker 部署設定

## 本地試用（無 LINE Bot 也可）

部署 Worker（需 Node 18+ 與 Cloudflare 帳號）：

```sh
cd worker

# 1. 建 KV namespace
wrangler kv:namespace create SCAMGUARD_KV
# 把輸出的 id 貼到 scamguard-wrangler.toml

# 2. 設 Anthropic API key（可選但強烈建議）
wrangler secret put ANTHROPIC_API_KEY -c scamguard-wrangler.toml

# 3. 部署
wrangler deploy -c scamguard-wrangler.toml
```

會得到 `https://scamguard-worker.<subdomain>.workers.dev`。

開啟 `scamguard/index.html`（或部署後的 `https://futurestarai.com/scamguard/`），在頁面底部「API endpoint」欄位貼入 Worker URL，就能試用。

## 綁定 LINE Bot

1. 到 [LINE Developers](https://developers.line.biz/console/) 建立 Messaging API channel
2. 在 channel 設定：
   - 關閉 Auto-reply / 打開 Webhook
   - Webhook URL 設為 `https://scamguard-worker.<subdomain>.workers.dev/line/webhook`
3. 複製 **Channel secret** 與 **Channel access token**，設入 Worker：
   ```sh
   wrangler secret put LINE_CHANNEL_SECRET -c scamguard-wrangler.toml
   wrangler secret put LINE_CHANNEL_TOKEN  -c scamguard-wrangler.toml
   ```
4. 重新 deploy：`wrangler deploy -c scamguard-wrangler.toml`
5. 在 LINE 加好友，傳訊息即可

### LINE Bot 指令

| 輸入 | 行為 |
| --- | --- |
| 任何文字 | 判讀風險分數 + 理由 |
| `help` / `說明` | 顯示使用方式 |
| `黑名單 <帳號>` | 查帳號是否被多人檢舉 |
| `檢舉 <帳號> <備註>` | 提交檢舉（多人檢舉後會在查詢時顯示警告） |

## 風險判讀邏輯

兩層：

1. **規則層**（`RULES` in `scamguard-worker.js`）
   正則比對 20+ 條台灣社群常見詐騙話術：投資代操、刷單兼職、點讚任務、情感轉私訊、冒充客服、要求加 LINE/TG、誇張收益、要求匯款⋯⋯每條規則有權重分數。

2. **LLM 層**（Claude Haiku 4.5）
   收到原文 + 命中的規則標籤，回傳 JSON：`{risk, reasons[], advice}`。

最終分數 = LLM 分數與規則分數的加權（規則命中會把下限拉到規則分的 70%），避免 LLM 漏判明顯話術。

若沒設 `ANTHROPIC_API_KEY`，會降級為純規則判斷。

## 成本（粗估）

- Cloudflare Workers 免費額度：100k req/day
- Cloudflare KV 免費額度：100k reads/day、1k writes/day
- Anthropic Haiku 4.5：每則訊息 < 500 tokens，成本約 US$0.0002/則

## 接下來可做

- [ ] 圖片 OCR：讓用戶傳截圖直接判讀（Claude Vision / Gemini Vision）
- [ ] Chrome extension：脆 feed 裡直接標紅
- [ ] 多人檢舉閾值與申訴流程
- [ ] Rate limiting / 驗證碼 防止黑名單灌水
- [ ] 165 資料庫自動交叉比對
