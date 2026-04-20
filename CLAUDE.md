# FutureStarAI 私人管理後台 (xlab)

這個 repo 是「未來之星 AI」(FutureStarAI) 的 **私人內部管理後台**。
對外 landing page 由另一個 public repo `founderai813/futurestarai.com` 負責，
本 repo 只放給自己看的東西：進度總覽、自動化 workflow、品牌規範、Claude 指引。

⚠️ **這個 repo 必須維持 Private**，裡面有各專案狀態與內部筆記。

---

## 🧭 使用說明（給 Claude 自己）

每次在 `xlab` 開對話時，**請先讀這份 CLAUDE.md**，以掌握：

1. 所有子專案的 repo、子網域與目前狀態
2. 品牌規範（主網域、子網域格式）
3. 對外網站 (`founderai813/futurestarai.com`) 與本管理後台的分工

使用者回報任何子專案進度時，請主動更新下方「專案總覽表」。
更新時維持表格欄位順序不變，並於必要時在「最近更新」區塊補充 1 行摘要。

---

## 🏛️ repo 分工

| Repo | 可見性 | 負責什麼 |
|------|--------|----------|
| `founderai813/xlab` （本 repo） | 🔒 Private | 內部管理後台：進度總覽、workflow、筆記 |
| `founderai813/futurestarai.com` | 🌐 Public | 對外 landing page + 個人作品集 / 履歷 |

---

## 🌐 品牌與網域規範

- **主網域**：`futurestarai.com`（由 `founderai813/futurestarai.com` 的 GitHub Pages 提供）
- **子網域格式**：`<project>.futurestarai.com`
- **私人專案**：不對外開放子網域，repo 設為 private
- **GitHub Org**：`founderai813`
- **視覺風格**：深色背景 `#0a0a0a`，主色漸層 `#00d2ff → #7b2ff7`

---

## 📦 專案總覽

| 專案 | Repo | 子網域 | 狀態 |
|------|------|--------|------|
| FutureStarAI 主站 | [founderai813/futurestarai.com](https://github.com/founderai813/futurestarai.com) | [futurestarai.com](https://futurestarai.com) | 🟢 活躍 |
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

- 2026-04-20：從 `futurestarai.com` 遷移管理後台到 `xlab`（private）；CLAUDE.md + 每日 sync workflow 就位。
- 2026-04-17：建立 CLAUDE.md 專案總覽，納管 8 個子專案。

---

## 🤖 自動化 workflow

`.github/workflows/sync-projects.yml` 每天台灣時間 09:00 自動跑一次：

1. 呼叫 GitHub API 抓每個子專案最近 24 小時的 commit
2. 把摘要寫進上面「最近更新」區塊（每專案一行）
3. 自動 commit + push 回本 repo

要讓它讀得到私人 repo（如 `purple-and-friends`），需在本 repo
Settings → Secrets → Actions 新增 `SUBPROJECTS_TOKEN`
（fine-grained PAT，對目標 repo 開 `Contents: Read`）。

---

## 🗂️ 本 repo 檔案結構

```
xlab/
├── CLAUDE.md                       # 本檔案：專案總覽 + Claude 指引
├── README.md                       # repo 門面（保持簡短即可）
└── .github/
    ├── workflows/
    │   └── sync-projects.yml       # 每日自動同步 workflow
    └── scripts/
        └── sync_projects.py        # 抓 commit、更新 CLAUDE.md 的腳本
```

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
