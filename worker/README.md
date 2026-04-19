# Disciplina · Worker

One Cloudflare Worker serving two purposes:

1. **`POST /`** — AI mentor chat proxy to Anthropic Messages API
2. **`POST /sync/save`** / **`GET /sync/load`** — cloud sync for Disciplina,
   storing the **already client-encrypted** blob keyed by email

The Worker never sees plain task data — encryption happens on the client with
the user's sync passphrase.

## Files

- `disciplina-proxy.js` — the Worker
- `wrangler.toml` — Cloudflare config (includes KV binding)

## Deploy

Requires Node 18+ and a Cloudflare account.

```sh
# 1. Install wrangler once
npm install -g wrangler

# 2. Log in
wrangler login

# 3. (From this directory) create a KV namespace for cloud sync
wrangler kv:namespace create DISCIPLINA_KV
# Copy the `id = "..."` it prints into wrangler.toml

# 4. (Optional) add the Anthropic API key for AI chat
wrangler secret put ANTHROPIC_API_KEY
# Paste your sk-ant-... key when prompted

# 5. Deploy
wrangler deploy
```

You will get a URL like `https://disciplina-proxy.<subdomain>.workers.dev`.

## Point the app at the Worker

Open the deployed Disciplina site, go to **⚙️ 設定 → 雲端同步**:

- `同步端點`: paste `https://disciplina-proxy.<subdomain>.workers.dev`
- `同步密語`: pick something you can remember — this encrypts your data
- Click **☁ 上傳雲端** on device 1
- On device 2 (same email + same passphrase): click **☁ 從雲端還原**

The AI chat auto-uses the same endpoint; no extra config.

## Request / response

### `POST /` (AI chat)

```json
{
  "message": "今天沒動力",
  "mentor": "xueming",
  "context": { "done": 2, "total": 4, ... },
  "history": [{ "role": "you", "text": "..." }, ...]
}
```
Returns `{ "reply": "..." }`.

### `POST /sync/save`

```json
{ "email": "user@example.com", "blob": "<base64 AES-GCM ciphertext>" }
```
Returns `{ "ok": true, "updatedAt": "2026-04-19T..." }`.

### `GET /sync/load?email=user@example.com`

Returns `{ "blob": "...", "updatedAt": "..." }` or 404 if no record.

## Security model

- The Worker **cannot read** your tasks or notes; the blob is encrypted
  client-side with AES-GCM using a key derived from your passphrase +
  email (PBKDF2, 100k iterations).
- If you lose the passphrase, data on the server is unrecoverable.
- Knowing someone's email lets an attacker **overwrite** their cloud
  backup (DoS) but cannot read their data. If this matters, front the
  Worker with a shared secret or rate-limit middleware.

## Quotas & costs

- Cloudflare Workers free tier: 100k requests/day
- Cloudflare KV free tier: 100k reads/day, 1k writes/day, 1 GB storage
- Anthropic API billed per token usage (not by Cloudflare)

## Notes

- CORS is `*` for client convenience; lock it down in production
- No rate limiting; add if you expose to the public
- Blob size cap: 2 MB per save (default)
