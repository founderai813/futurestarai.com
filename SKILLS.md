# Skills Showcase · Disciplina

> 從 `disciplina.html`（單檔 7,900 行）與其 Cloudflare Worker 後端中，提取出的全端工程技能清單。

完整專案說明：[`DISCIPLINA.md`](./DISCIPLINA.md)
線上 Demo：https://futurestarai.com/disciplina.html

---

## 1️⃣ 前端

### HTML / CSS
- ✅ 語意化 HTML5、無障礙 ARIA 標籤
- ✅ CSS Custom Properties — 動態主題色 4 院 × 3 主題包
- ✅ CSS Grid / Flexbox 響應式（手機優先、3 桌面斷點）
- ✅ `backdrop-filter`、`color-mix()`、`@container` 思維
- ✅ Keyframes + cubic-bezier 動畫設計
- ✅ `<details>` / `<dialog>` 等原生互動元素
- ✅ Print / Screen 友善
- ✅ 暗黑主題 + 高對比模式（色弱友善）
- ✅ 隱私模糊濾鏡（screen-sharing 友善）

### Vanilla JavaScript
- ✅ ES2022+ 語法（optional chaining、nullish、`Object.fromEntries` 等）
- ✅ 純 DOM 操作，無框架、無 jQuery、無打包器
- ✅ `async/await`、`Promise.all`、`fetch` 完整錯誤處理
- ✅ 事件代理、Touch 手勢辨識（滑動切 Tab）
- ✅ 鍵盤快捷鍵（單鍵切頁、Esc 關彈窗）
- ✅ Reactive UI（state 變更 → render）

### Web 平台 API
| API | 用途 |
|---|---|
| **Web Crypto** | PBKDF2 100k 派生 + AES-GCM-256 加解密 |
| **Web Audio** | 5 種 SFX + 氣氛墊音（多 oscillator + LFO + 濾波）|
| **Canvas 2D** | 三種分享 PNG 卡（日/週/年），字型預熱 |
| **SpeechSynthesis** | 中文朗讀，每位導師獨立 pitch/rate |
| **Notification** | 本機時間提醒 |
| **localStorage** | 使用者命名空間 + 版本遷移 |
| **History API** | Hash 路由 |
| **PWA manifest** | inline data-URL 可裝桌面 |

---

## 2️⃣ 後端 / 雲端

### Cloudflare 平台
- ✅ Workers — Edge Serverless、ESM export default 格式
- ✅ KV — Key-value 設計（`user:<email>` namespace）
- ✅ Wrangler CLI / Dashboard 部署兩種路徑都熟
- ✅ Secrets 管理（API key 不入 git）
- ✅ CORS、JSON API 設計
- ✅ 上行傳輸大小限制（2MB blob cap）

### API 整合
- ✅ **Anthropic Messages API** — System prompt、history rotation、token budget
- ✅ **Google Gemini API** — generateContent、systemInstruction 格式
- ✅ Provider fallback（Gemini → Claude → local rules）
- ✅ API proxy 設計（金鑰只在 server）

---

## 3️⃣ 資安 / 隱私

- ✅ 客戶端 AES-GCM 對稱加密
- ✅ PBKDF2 金鑰派生（100k 迭代、email 作 salt）
- ✅ Base64 編碼上傳
- ✅ Server zero-knowledge 設計（伺服器看不到明文）
- ✅ 使用者命名空間隔離（同裝置多帳號）
- ✅ 不可逆性溝通（密語遺失明確告知）

---

## 4️⃣ 系統設計

- ✅ **單檔架構**：~7,900 行 HTML+CSS+JS 維持單檔
- ✅ **資料驅動 UI**：所有畫面由 `state` 物件 reactive 重渲染
- ✅ **主題包抽象化**：所有內容（學院/任務/導師/格言/SVG）封裝在 `THEMES.xxx`
- ✅ **狀態遷移層**：legacy localStorage 自動升級到新結構
- ✅ **跨主題 key remapping**：切主題時按位置對應學院 key
- ✅ **階段式解鎖系統**：30 分門檻、按序自動解鎖
- ✅ **Plugin-style 角色**：12 位導師獨立人格設定
- ✅ **Provider fallback**：3 層回退策略

---

## 5️⃣ UX / 產品設計

- ✅ 雙時段流程（早晨宣告 / 晚間回報）
- ✅ Onboarding：分院帽歡迎頁 + 8 題人格測驗
- ✅ 儀式設計：羊皮紙立誓、震動懲戒、粒子升級
- ✅ 微互動：popPop checkbox、Hover lift、Tap scale
- ✅ Empty State / Loading State / Error State
- ✅ Toast 通知系統 + Modal 堆疊（Esc 順序關閉）
- ✅ 隱私模式（敏感資訊模糊化）
- ✅ 高對比輔助模式
- ✅ 手機優先 + 桌面響應式（3 斷點）

---

## 6️⃣ 設計 / 內容

### 視覺
- ✅ 字型搭配（Cinzel + Noto Sans TC）
- ✅ 4 院色系統 × 3 主題 = 12 套配色
- ✅ 節氣背景動態（春綠/夏橙/秋金/冬藍）
- ✅ SVG 手繪 3 套導師頭像 + favicon

### 內容創作
- ✅ 3 套世界觀劇本：Hogwarts / 四象 / 元素
- ✅ 12 位導師 × 各 30+ 條台詞 ≈ **360+ 條角色台詞**
- ✅ 哲學整合：斯多葛四主德 ↔ 四象 ↔ 自律面向
- ✅ 15+ 條每日格言（公版古文）
- ✅ 6+ 條石內卜風懲戒台詞、扣 `{tasks}` 變數插入

---

## 7️⃣ 工程實務

- ✅ Git workflow：feature branch + PR + squash merge
- ✅ GitHub MCP API 自動化 PR / Merge
- ✅ Commit message 約定（含 Summary + 多項 bullet）
- ✅ 程式碼語法驗證（每次 commit 前 `new Function()` 解析）
- ✅ 漸進式重構（單一主題 → THEMES 抽象 → 階段解鎖）
- ✅ 向下相容遷移（state 結構升版自動處理）
- ✅ Changelog 紀錄（App 內可看）

---

## 8️⃣ AI / LLM 工程

- ✅ System prompt 設計（12 個人格獨立）
- ✅ Context injection（今日 context、history rotation）
- ✅ Provider 抽象層（Gemini / Anthropic）
- ✅ Token budget 控制（max 400）
- ✅ Failure path（API down → rule-based）

---

## 數字總結

| 項目 | 數量 |
|---|---|
| 程式碼總行數 | ~8,200 行 |
| Web API 整合 | 9 種 |
| 第三方 API | 2 種（Anthropic、Gemini）|
| 主題包 | 3 套 |
| 導師角色 | 12 位 |
| 角色台詞 | 360+ 條 |
| 已實作版本 | 30+ 次迭代 |
| 外部 npm 依賴 | **0** |
| 線上 Demo | https://futurestarai.com/disciplina.html |

---

> 這個專案展示「**單檔 7,900 行 vanilla web app**」可以做到產品級規模——包含資安、雲端、AI、無障礙、跨平台、世界觀內容。
