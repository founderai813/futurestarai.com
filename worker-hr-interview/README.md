# HR 智慧面試助手 · Worker

Optional Cloudflare Worker that powers the two AI-assisted features in
[`hr-interview.html`](../hr-interview.html):

1. **履歷結構化解析** — turn raw resume text into structured JSON
   (name / email / phone / education / experience / skills / summary)
2. **綜合分析與建議摘要** — turn interview metrics + a transcript excerpt
   into a structured strengths / concerns / recommendation summary

Everything else in the app — PDF/DOCX text extraction, camera recording,
facial-expression sampling, live speech-to-text, pitch/volume analysis,
scoring, and candidate storage — runs entirely client-side and needs no
backend. **This Worker is optional.** Without it, the app falls back to
built-in rule-based (heuristic) resume parsing and summary generation.

## Files

- `hr-interview-proxy.js` — the Worker (single `POST /` endpoint)
- `wrangler.toml` — Cloudflare config

## Deploy

```sh
npm install -g wrangler
wrangler login

cd worker-hr-interview

# Pick ONE AI provider:
wrangler secret put GEMINI_API_KEY       # https://aistudio.google.com/apikey (free tier)
# — or —
wrangler secret put ANTHROPIC_API_KEY    # https://console.anthropic.com/

wrangler deploy
```

You'll get a URL like `https://hr-interview-proxy.<subdomain>.workers.dev`.

## Point the app at the Worker

Open `hr-interview.html` → **⚙️ 設定** tab → paste the Worker URL into
**AI 代理端點 URL** → 儲存設定. The "🤖 用 AI 重新結構化" and "✨ 產生 AI 摘要"
buttons will then call it automatically.

## Request / response

### `POST /`

```json
{ "task": "parse_resume", "payload": { "resumeText": "...", "jobTitle": "...", "jobSkills": ["..."] } }
```
or
```json
{ "task": "generate_summary", "payload": { "candidateName": "...", "jobTitle": "...", "metrics": {...}, "transcriptExcerpt": "..." } }
```

Returns `{ "result": {...parsed JSON or null...}, "raw": "<model text>", "provider": "gemini|anthropic" }`.
The client treats `result: null` (e.g. the model didn't return valid JSON)
as a signal to fall back to local heuristics — it never blocks the UI.

## Privacy note

Only text is ever sent to this Worker: extracted resume text, a transcript
excerpt (truncated), and numeric metrics. No video, audio, or image data is
uploaded — facial-expression and vocal-tone analysis happen entirely in the
browser using client-side models (face-api.js) and the Web Audio API.

## Quotas & costs

- Cloudflare Workers free tier: 100k requests/day
- Gemini / Anthropic API usage is billed per token by the respective provider
- No rate limiting or auth — this Worker is meant for personal/demo use;
  add rate limiting or a shared secret before exposing it publicly
