# Disciplina · AI Mentor Proxy

Thin Cloudflare Worker that forwards chat requests from `disciplina.html` to the
Anthropic Messages API, so the API key never leaves the server.

## Files

- `disciplina-proxy.js` — the Worker
- `wrangler.toml` — Cloudflare config

## Deploy

Requires Node 18+ and a Cloudflare account.

```sh
# 1. Install wrangler once
npm install -g wrangler

# 2. Log in
wrangler login

# 3. From this directory, add your API key as a secret
wrangler secret put ANTHROPIC_API_KEY
# Paste your key (starts with sk-ant-...) when prompted

# 4. Deploy
wrangler deploy
```

After deploy you will get a URL like
`https://disciplina-proxy.<your-subdomain>.workers.dev`.

## Wire it into the app

Open `disciplina.html` and before the app loads, set the endpoint:

```html
<script>window.DISCIPLINA_AI_ENDPOINT = 'https://disciplina-proxy.<your>.workers.dev';</script>
```

Put this just before the existing `<script>` block. When present, the mentor
chat will POST to the Worker; otherwise it falls back to local rule-based
replies automatically.

Alternatively, append `?ai=<url>` to the page URL — the app also checks that
and saves it to localStorage (see client code).

## Request / response

`POST /` with JSON body:

```json
{
  "message": "今天沒動力",
  "mentor": "severus",
  "context": { "done": 2, "total": 4, "tasks": ["運動訓練", "寫作(已完成)"], "leadingHouse": "葛來芬多", "totalPts": 140, "streak": 3 },
  "history": [{ "role": "you", "text": "嗨" }, { "role": "mentor", "text": "……" }]
}
```

Returns:

```json
{ "reply": "……" }
```

## Notes

- CORS is set to `*` to keep the client simple; lock it down to your domain
  in production if you are concerned about abuse.
- No rate limiting is included; add one if you expose the Worker publicly.
- The default model is `claude-sonnet-4-6`. Override via the `MODEL`
  environment variable in `wrangler.toml` or the dashboard.
