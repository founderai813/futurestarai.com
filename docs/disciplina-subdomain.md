# 把 Disciplina 搬到專屬子網域

目前 Disciplina 在 `https://futurestarai.com/disciplina.html`。若想要更乾淨的網址 `https://disciplina.futurestarai.com`，照下列做。

## 方案 A — Cloudflare Redirect Rule（最簡單，5 分鐘）

只把短網址做 301 轉址，內容仍在 `futurestarai.com/disciplina.html`。SEO 友善、零維護成本。

1. 登入 https://dash.cloudflare.com
2. 點你的網域 `futurestarai.com`
3. 左側 **DNS → Records → Add record**：
   - Type: `CNAME`
   - Name: `disciplina`
   - Target: `futurestarai.com`
   - Proxy status: **橘色雲開啟（Proxied）**
4. 左側 **Rules → Redirect Rules → Create rule**：
   - Rule name: `Disciplina subdomain`
   - 條件：`Hostname` `equals` `disciplina.futurestarai.com`
   - URL redirect:
     - Type: **Static**
     - URL: `https://futurestarai.com/disciplina.html`
     - Status code: `301 Permanent`
     - Preserve query string: ✓
5. 按 **Deploy**

等 1-2 分鐘 DNS 生效，`https://disciplina.futurestarai.com` 自動跳回主網址。

## 方案 B — Cloudflare Worker 直送內容（進階）

讓子網域直接渲染同樣的內容，不做 301。網址保持 `disciplina.futurestarai.com`，更專業。

需要在現有的 `worker/disciplina-proxy.js` 加一個 `*` 路由抓取主網域的 HTML 並回傳；或建立 Cloudflare Pages 部署這個 repo，自訂網域填 `disciplina.futurestarai.com`。

實作較複雜，未必比方案 A 划算。多數用戶從 portfolio 入口直接點，看不到子網域對短網址的差別。

## 方案 C — GitHub Pages（需新 repo）

開一個獨立 repo `disciplina-app`，放入 `disciplina.html` 改名為 `index.html`：

1. GitHub → 建 repo `disciplina-app`
2. 把現有 `disciplina.html` 內容複製進 `index.html`
3. Repo 根目錄加 `CNAME`：內容是 `disciplina.futurestarai.com`
4. Settings → Pages → Source: `main` `/`
5. Cloudflare DNS 加 CNAME：`disciplina` → `<youruser>.github.io`（**橘雲關閉**）
6. GitHub Pages 自動發 SSL，1-10 分鐘生效

缺點：要維護兩份程式碼，每次改要兩邊同步。**不建議**。

## 推薦

**用方案 A**。短網址 `disciplina.futurestarai.com` 自動 301 到本來的網址。設完使用者開那短網址也直接看到 App，記憶網址更方便。
