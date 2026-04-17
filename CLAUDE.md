# FutureStarAI 總部 (futurestarai.com)

這個 repo 是「未來之星 AI」(FutureStarAI) 所有專案的總部與主網站 landing page。
所有子專案各自有獨立 repo 與子網域，本 repo 負責集中管理進度與導流。

---

## 🧭 使用說明（給 Claude 自己）

每次在 `futurestarai.com` 開對話時，**請先讀這份 CLAUDE.md**，以掌握：

1. 所有子專案的 repo、子網域與目前狀態
2. 品牌規範（主網域、子網域格式）
3. 主網站 (`index.html`) 的架構與導流入口

使用者回報任何子專案進度時，請主動更新下方「專案總覽表」。
更新時維持表格欄位順序不變，並於必要時在「最近更新」區塊補充 1 行摘要。

---

## 🌐 品牌與網域規範

- **主網域**：`futurestarai.com`（由本 repo 的 GitHub Pages 提供，見 `CNAME`）
- **子網域格式**：`<project>.futurestarai.com`
- **私人專案**：不對外開放子網域，repo 設為 private
- **GitHub Org**：`founderai813`
- **視覺風格**：深色背景 `#0a0a0a`，主色漸層 `#00d2ff → #7b2ff7`（見 `index.html`）

---

## 📦 專案總覽

| 專案 | Repo | 子網域 | 狀態 |
|------|------|--------|------|
| Market Pulse 財經 AI 週報 | [founderai813/market-pulse](https://github.com/founderai813/market-pulse) | [market-pulse.futurestarai.com](https://market-pulse.futurestarai.com) | 🟢 活躍 |
| JoinUp 揪團神器 | [founderai813/joinup](https://github.com/founderai813/joinup) | [joinup.futurestarai.com](https://joinup.futurestarai.com) | 🟢 活躍 |
| PostLab | [founderai813/postlab](https://github.com/founderai813/postlab) | [postlab.futurestarai.com](https://postlab.futurestarai.com) | 🟢 活躍 |
| Purple and Friends | [founderai813/purple-and-friends](https://github.com/founderai813/purple-and-friends) | （私人） | 🟢 活躍 |
| Leave Chatbot | [founderai813/leave-chatbot](https://github.com/founderai813/leave-chatbot) | [leave-chatbot.futurestarai.com](https://leave-chatbot.futurestarai.com) | 🟢 活躍 |
| LINE Summarizer | [founderai813/line-summarizer](https://github.com/founderai813/line-summarizer) | [line-summarizer.futurestarai.com](https://line-summarizer.futurestarai.com) | 🟢 活躍 |
| Podcast Learning Tool | [founderai813/podcast-learning-tool](https://github.com/founderai813/podcast-learning-tool) | [podcast-learning-tool.futurestarai.com](https://podcast-learning-tool.futurestarai.com) | 🟢 活躍 |
| Wei Boss Chat | [founderai813/wei-boss-chat](https://github.com/founderai813/wei-boss-chat) | [wei-boss-chat.futurestarai.com](https://wei-boss-chat.futurestarai.com) | 🟢 活躍 |

### 狀態圖例

- 🟢 活躍：正在開發或維護中
- 🟡 暫緩：功能堪用但暫停新功能開發
- 🔵 規劃中：尚未開始實作
- 🔴 封存：不再維護

---

## 📝 最近更新

- 2026-04-17：建立 CLAUDE.md 專案總覽，納管 8 個子專案。

---

## 🗂️ 本 repo 檔案結構

```
futurestarai.com/
├── CNAME               # GitHub Pages 自訂網域設定 (futurestarai.com)
├── CLAUDE.md           # 本檔案：專案總覽與 Claude 工作指引
├── README.md           # repo 公開說明
├── index.html          # 主網站 landing page
├── joinup/
│   └── index.html      # 舊路徑 → 重導至 joinup.futurestarai.com
└── line_summarizer.html # LINE Summarizer 舊版靜態頁（已遷至子網域）
```

> 子路徑 (`/joinup`、`line_summarizer.html`) 保留為歷史相容跳轉，新流量一律導向對應子網域。

---

## 🔧 回報進度的建議格式

當要更新某個專案，直接告訴 Claude：

```
更新 <專案名稱>：<新狀態 / 新進度摘要>
```

例如：
- 「更新 PostLab：MVP 已上線，改為活躍」
- 「Leave Chatbot 暫緩，等 LINE API 升級」
- 「新增專案 XXX：repo=founderai813/xxx, 子網域=xxx.futurestarai.com」

Claude 會：
1. 修改「專案總覽」表格
2. 在「最近更新」加上一行日期與摘要
3. commit 並 push 到當前工作分支
