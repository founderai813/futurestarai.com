# Disciplina · 自律魔典

> 單檔 HTML 自律打卡 App，融合**霍格華茲四院 / 東方四象 / 斯多葛四主德**主題框架，搭配 AI 導師對話與加密雲端同步。

線上版：**https://futurestarai.com/disciplina.html**

---

## 一句話描述

從 0 到 v2.x，**1 個 HTML 檔案、零 npm 依賴、~7900 行**，做出一款帶劇情、有儀式感、可雲端同步、可接 AI 的個人自律 App。

---

## 專案規模

| 指標 | 數字 |
|---|---|
| 主程式 | `disciplina.html` 約 **7,900 行 / 280 KB** |
| Worker 後端 | `worker/disciplina-proxy.js` 258 行 |
| 外部 runtime 相依 | **0**（純 vanilla JS / CSS / HTML）|
| 已實作功能版本 | **v1.0 → v2.x，共 30+ 次迭代** |
| 已整合 AI 提供商 | Anthropic Claude、Google Gemini（雙引擎可切）|
| 主題包（劇情系統） | 3 套：Hogwarts／四象 Oriental／元素 Aether |
| 導師人物 | 12 位（每主題 4 位，各 30+ 條台詞）|

---

## 主要功能

### 核心流程
- 🌅 早晨宣告 / 🌙 晚間回報 雙時段切換（依系統時間自動跳）
- 🪄 立誓羊皮紙儀式彈窗
- ⏱ 番茄鐘專注計時器（25/5）+ 完成自動勾選
- 📝 每項任務可附筆記、🛡 連勝保護卡

### 階段式解鎖（v2.x）
- 第一階段只開「青龍／勇」一院，達 30 分解鎖下一院
- 任務由使用者自選，預設 16 個建議任務全部開放
- 全程依「青龍 → 朱雀 → 白虎 → 玄武」推進

### 三套主題包（同套引擎可切換）
| 主題 | 哲學底蘊 | 角色 |
|---|---|---|
| Hogwarts 霍格華茲 | 哈利波特致敬 | 石內卜／鄧不利多／麥教授／赫敏 |
| 四象 Oriental | 中國四象 × 儒家修身 × 斯多葛四主德 | 雪冥／鶴齡／素英／雲梔 |
| Aether 元素 | 古典四元素 | Ignis／Terra／Ventus／Aqua |

### 數據視覺
- 7／30 天熱力圖、四院 30 天累積積分 SVG 折線圖、月度反思排行、近 30 日關鍵字雲、修煉日誌
- 9 個成就徽章、本週挑戰、本月目標
- 今日／本週／年度三種 Canvas 分享 PNG 卡

### 系統整合
- ☁️ Cloudflare Worker + KV 雲端同步（AES-GCM 客戶端加密、PBKDF2 金鑰衍生）
- 🤖 雙引擎 AI 導師對話（Gemini / Claude 自動 fallback）
- 📱 PWA inline manifest，可加入主畫面
- 🔔 Notification API 早晚提醒
- 🎵 Web Audio 合成音效（打勾／升級／懲戒／氣氛墊音）
- 🗣️ SpeechSynthesis 中文朗讀導師金句

---

## 用到的技能（Skills 清單）

### 前端核心
- **HTML5**：語意化結構、accessible 標籤、Modal/Dialog 模式
- **CSS3 進階**
  - CSS Custom Properties（動態主題切換）
  - Grid / Flexbox / 媒體查詢、三斷點響應式
  - 動畫 + cubic-bezier 緩動函式
  - `backdrop-filter` 玻璃霧化、`color-mix()` 動態調色
  - `:has()`、`details/summary` 原生折疊
- **Vanilla JavaScript（ES2022+）**
  - 沒有任何打包器、沒有任何 npm 依賴
  - Module-pattern、Closure、`let`/`const`、Optional chaining、Nullish coalescing
  - `async/await`、`Promise.all`、`fetch` 錯誤處理
  - DOM 操作、事件代理、Touch 手勢

### Web 平台 API
- **Web Crypto API**：PBKDF2 100k 迭代 + AES-GCM-256 加解密
- **Web Audio API**：Oscillator + Gain + LFO + BiquadFilter，合成 5 種音效 + 氣氛墊音
- **Canvas 2D**：產生 900×1200 / 900×1400 PNG 分享卡（含字型預熱）
- **SpeechSynthesis API**：自動挑 zh-TW 語音、每位導師獨立 pitch/rate
- **Notification API**：時間排程的提醒
- **localStorage**：使用者命名空間、容量監控、版本遷移
- **History API**：Hash-based 路由
- **History/Pointer events**：手勢偵測
- **Service Worker / PWA manifest**：inline data-URL manifest，可裝桌面

### 後端 / 雲端
- **Cloudflare Workers**：邊緣 serverless、CORS、JSON API 設計
- **Cloudflare KV**：key-value 儲存設計（per-user key prefix）
- **Anthropic Messages API**：System prompt、history 折疊
- **Google Generative Language API**：Gemini 2.5 Flash、generateContent 格式翻譯
- **API Proxy 設計**：金鑰永遠在 server side，client 不知金鑰
- **環境變數 / Secrets** 管理（`wrangler secret put`）

### 資安與資料
- 客戶端對稱加密（AES-GCM），server 只看密文
- 密碼派生（PBKDF2 + salt = email）
- 不可逆性溝通（密語遺失資料無法復原，明確告知使用者）
- 個人資料命名空間隔離

### 軟體工程實務
- Git workflow（feature branch + squash merge + 強制同步）
- GitHub PR 流程（自動 commit message、test plan、squash merge）
- 漸進式重構（Hogwarts 單一主題 → 抽象 THEMES 物件 → 多主題包）
- 向下相容遷移（legacy localStorage 自動升級）
- Changelog 維護
- 程式碼語法驗證自動化（`new Function()` parse check）

### 系統設計
- **Single-file 架構**：把 7000+ 行 JS、CSS、HTML 維持在一個檔
- **資料驅動 UI**：所有畫面從 `state` 物件 reactive 重渲染
- **狀態機**：階段解鎖、Tab 切換、Modal 堆疊
- **Plugin-style 角色系統**：導師人物可加可換不動主流程
- **Provider fallback**：Gemini → Anthropic → 本機規則式
- **State remapping**：跨主題切換時，按位置重對應學院 key

### UX / 產品
- 互動設計：Toast、Modal、Tooltip、Empty state、Loading state
- 微互動（micro-interactions）：popPop 動畫、震動回饋、紅光閃屏
- 無障礙（accessibility）：高對比模式、色弱友善 ✓×符號、鍵盤快捷
- 隱私模式：模糊任務名稱供螢幕分享情境
- Onboarding 流程：分院帽 + 8 題人格測驗

### 設計與內容
- 視覺：Cinzel + Noto Sans TC 雙字型、四院色系統、節氣背景變化
- 動畫：羊皮紙、粒子爆炸、震動、紅閃、淡入彈跳
- SVG 手繪：3 套導師頭像 + 內嵌 favicon／app icon
- 內容創作：12 角色 × 50+ 條台詞、3 套世界觀敘事
- 哲學整合：斯多葛四主德映射到四象系統

### AI / LLM 整合
- System prompt 工程：每位導師的人格設定
- Context injection：使用者今日 context 注入回應
- 雙模型 Provider 抽象層
- 失敗 fallback 設計

---

## 技術抉擇背後的考量

| 抉擇 | 為什麼這樣選 |
|---|---|
| 單一 HTML 檔 | 部署成本 0、可離線分享、無 build step |
| Vanilla 無框架 | 學習與展示能力，避免框架 lock-in |
| Cloudflare Worker | 免費額度高、edge 速度快、適合台灣訪問 |
| 客戶端加密 | server 看不到任務內容，符合自律 App 隱私期待 |
| 哲學多主題 | 內容厚度＋未來付費版區隔 |
| 階段解鎖 | 習慣科學：一次別超過 3 個新習慣 |
| AI 提供商雙引擎 | Gemini 免費額度大、Claude 品質好，使用者擇一 |

---

## 開發歷程

從第一行到 v2.x：
- v1.0 ~ v1.13：核心打卡、儀式感、AI hook、PWA、本機多帳號（13 個版本）
- v2.0 重構：主題抽象化，新增東方四象主題
- v2.1：番茄鐘、關鍵字雲、分院測驗
- v2.2：年度回顧、連勝保護
- v2.3：語音、emoji picker、批量匯入
- v2.4：強制四象主題、信箱登入、學院手動切換
- v2.5：Cloudflare Worker 雲端同步、Gemini API 接入
- v2.6：階段解鎖、Stoic 整合、UX 重排

[完整 Changelog →](./disciplina.html#settings)（App 內設定頁可看）

---

## 部署架構

```
[使用者瀏覽器]
   │
   │  HTTPS（GitHub Pages）
   ▼
[disciplina.html] ─────► localStorage（per-email）
   │
   │  fetch POST /sync/save (AES-GCM blob)
   │  fetch POST /        (mentor chat)
   ▼
[Cloudflare Worker]
   ├── KV: 加密 blob
   └── 對外呼叫 → Gemini API / Anthropic API
```

---

## License

MIT
