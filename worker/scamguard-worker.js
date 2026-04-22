/**
 * ScamGuard · Cloudflare Worker
 *
 * 社群（Threads/脆、IG、LINE）詐騙話術即時判讀
 *
 * Routes:
 *   POST /analyze          — 公開 API，給網頁 demo 用
 *                            body: { text: string, source?: string }
 *                            resp: { risk: 0-100, level, reasons[], advice, matched[] }
 *
 *   POST /line/webhook     — LINE Messaging API webhook（需驗簽）
 *   GET  /line/webhook     — health check
 *
 *   POST /report           — 提交可疑帳號/話術（眾包黑名單）
 *                            body: { handle?: string, text?: string, platform, note? }
 *   GET  /blacklist        — 查特定 handle 是否在黑名單
 *                            ?handle=xxx&platform=threads
 *
 * Secrets (wrangler secret put ...):
 *   ANTHROPIC_API_KEY      — Claude API key
 *   LINE_CHANNEL_SECRET    — LINE channel secret（webhook 驗簽）
 *   LINE_CHANNEL_TOKEN     — LINE channel access token（reply 用）
 *
 * KV:
 *   SCAMGUARD_KV           — 黑名單 + rate limit
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const LINE_REPLY_URL = 'https://api.line.me/v2/bot/message/reply';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// --- 話術規則庫（台灣社群詐騙常見模式）---
// 每條規則 score 累加，上限 100；LLM 會再做一次判讀並可調整。
const RULES = [
  // 投資代操
  { id: 'invest_guru', score: 35, label: '投資老師／代操話術', re: /(老師帶單|財經老師|投顧老師|分析師助理|免費教學|穩賺|保證獲利|保證出金|包賺|帶你賺|一對一教學|獨家內線|內部消息|私人飛機|大戶群組)/ },
  { id: 'invest_rate', score: 30, label: '誇張收益數字', re: /(月入\s*[0-9]+\s*萬|日賺\s*[0-9]+|週獲利\s*[0-9]+\s*[%％]|年化\s*[0-9]{2,}\s*[%％])/ },
  { id: 'crypto', score: 20, label: '加密貨幣誘導', re: /(USDT|泰達幣|TRX|波場|合約單|現貨單|幣圈|空投|交易所註冊)/i },

  // 兼職／刷單
  { id: 'part_time', score: 30, label: '高報酬兼職', re: /(日薪\s*[0-9]+|時薪\s*[0-9]{4,}|輕鬆賺|在家工作|居家兼職|打字員|資料輸入員|網路兼職|手機兼差)/ },
  { id: 'task_scam', score: 35, label: '點讚／按讚任務', re: /(點讚任務|按讚任務|評分任務|IG按讚|抖音點讚|蝦皮評價|刷單|接單返利|墊付)/ },

  // 情感／交友
  { id: 'romance_move', score: 20, label: '情感誘導轉私訊', re: /(想認識|找對象|單身勿擾|私訊聊|dm我|DM我|有緣|寂寞)/ },

  // 平台轉移（離開脆 = 強訊號）
  { id: 'platform_move', score: 25, label: '要求轉到其他平台', re: /(加我\s*LINE|加賴|LINE\s*ID|加我\s*Telegram|加我\s*TG|加\s*WhatsApp|私密頻道|加我微信)/i },
  { id: 'contact_id', score: 15, label: '直接貼聯絡 ID', re: /(ID\s*[:：]\s*\S{3,}|line\s*[:：]\s*\S{3,}|@\w{4,})/i },

  // 冒充客服／公務
  { id: 'impersonate', score: 35, label: '冒充客服／公務機關', re: /(客服通知|帳號異常|解除分期|刑事局|165|檢警|監管帳戶|司法凍結)/ },

  // 緊急／稀缺
  { id: 'urgency', score: 15, label: '緊急／限時話術', re: /(限時|倒數|名額剩|今日截止|只剩\s*[0-9]+\s*名|錯過就沒了|馬上|立即行動)/ },

  // 金錢動作
  { id: 'money_action', score: 25, label: '要求匯款／儲值', re: /(先匯|先轉|先儲值|購物卡|遊戲點數|mycard|解凍金|保證金|手續費先付)/i },
];

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/analyze' && request.method === 'POST') {
        return await handleAnalyze(request, env);
      }
      if (path === '/line/webhook' && request.method === 'POST') {
        return await handleLineWebhook(request, env, ctx);
      }
      if (path === '/line/webhook' && request.method === 'GET') {
        return json({ ok: true, service: 'scamguard' });
      }
      if (path === '/report' && request.method === 'POST') {
        return await handleReport(request, env);
      }
      if (path === '/blacklist' && request.method === 'GET') {
        return await handleBlacklistLookup(url, env);
      }
      if (path === '/' || path === '/health') {
        return json({ ok: true, service: 'scamguard' });
      }
      return json({ error: 'not_found' }, 404);
    } catch (err) {
      return json({ error: 'internal_error', message: String(err?.message || err) }, 500);
    }
  },
};

// ---------- /analyze ----------

async function handleAnalyze(request, env) {
  const body = await request.json().catch(() => ({}));
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) return json({ error: 'missing_text' }, 400);
  if (text.length > 4000) return json({ error: 'text_too_long' }, 413);

  const result = await analyzeText(text, env);
  return json(result);
}

async function analyzeText(text, env) {
  // 1) 規則比對
  const matched = [];
  let ruleScore = 0;
  for (const rule of RULES) {
    if (rule.re.test(text)) {
      matched.push({ id: rule.id, label: rule.label, score: rule.score });
      ruleScore += rule.score;
    }
  }
  ruleScore = Math.min(ruleScore, 100);

  // 2) LLM 判讀（若有 key；否則只用規則）
  let llm = null;
  if (env.ANTHROPIC_API_KEY) {
    llm = await llmAnalyze(text, matched, env).catch(() => null);
  }

  // 3) 合成最終分數
  //    - 若 LLM 判斷更高，以 LLM 為準；但規則命中 → 下限拉到 ruleScore 的 70%
  //    - 若無 LLM，單純用規則分
  let risk;
  let reasons;
  let advice;
  if (llm && typeof llm.risk === 'number') {
    risk = Math.max(llm.risk, Math.round(ruleScore * 0.7));
    risk = Math.min(100, Math.max(0, risk));
    reasons = llm.reasons?.length ? llm.reasons : matched.map((m) => m.label);
    advice = llm.advice || defaultAdvice(risk);
  } else {
    risk = ruleScore;
    reasons = matched.map((m) => m.label);
    advice = defaultAdvice(risk);
  }

  const level = risk >= 70 ? 'high' : risk >= 35 ? 'medium' : 'low';
  return { risk, level, reasons, advice, matched, model: llm ? MODEL : null };
}

async function llmAnalyze(text, matched, env) {
  const system =
    '你是台灣社群詐騙話術鑑識員，專精 Threads（脆）、Instagram、LINE 上常見的詐騙模式：' +
    '投資代操、假投顧、刷單兼職、點讚任務、情感詐騙轉私訊、虛擬貨幣、假客服、解除分期、冒充公務機關。' +
    '收到一段訊息後，輸出「只有 JSON」：' +
    '{"risk": 0~100 的整數, "reasons": ["簡短中文理由", ...最多 4 條], "advice": "給使用者的一句話建議（繁體中文，25 字內）"}' +
    '。判斷要點：若話術要求加 LINE/TG/微信、保證獲利、先匯款、冒充客服 → 高風險 70+；' +
    '若只是含糊宣傳或關鍵字重疊 → 中風險 35~69；正常對話 → 低風險 0~34。' +
    '不要回傳 markdown、不要 code fence，直接 JSON。';

  const user =
    `待判讀訊息（來自社群平台）：\n"""\n${text}\n"""\n` +
    (matched.length
      ? `規則已命中的風險標籤：${matched.map((m) => m.label).join('、')}`
      : '規則未命中明顯詐騙關鍵字。');

  const resp = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!resp.ok) throw new Error(`anthropic_${resp.status}`);
  const data = await resp.json();
  const textOut = data?.content?.[0]?.text || '';
  const jsonStr = extractJson(textOut);
  if (!jsonStr) return null;
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      risk: Math.round(Number(parsed.risk) || 0),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 4).map(String) : [],
      advice: typeof parsed.advice === 'string' ? parsed.advice : '',
    };
  } catch {
    return null;
  }
}

function extractJson(s) {
  if (!s) return null;
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  return s.slice(start, end + 1);
}

function defaultAdvice(risk) {
  if (risk >= 70) return '高度疑似詐騙，不要加 LINE、不要匯款，直接檢舉＋封鎖。';
  if (risk >= 35) return '有可疑點，請先查對方帳號、不要提供個資或匯款。';
  return '目前沒看到明顯詐騙特徵，但仍請保持警覺。';
}

// ---------- /line/webhook ----------

async function handleLineWebhook(request, env, ctx) {
  const signature = request.headers.get('x-line-signature') || '';
  const raw = await request.text();

  if (!env.LINE_CHANNEL_SECRET) {
    return json({ error: 'line_not_configured' }, 503);
  }
  const valid = await verifyLineSignature(raw, signature, env.LINE_CHANNEL_SECRET);
  if (!valid) return json({ error: 'invalid_signature' }, 401);

  const payload = JSON.parse(raw);
  const events = Array.isArray(payload.events) ? payload.events : [];

  // LINE webhook 要求 2 秒內回應；用 waitUntil 非同步處理
  ctx.waitUntil(
    Promise.all(events.map((e) => handleLineEvent(e, env).catch(() => null)))
  );
  return new Response('OK', { status: 200 });
}

async function handleLineEvent(event, env) {
  if (event.type !== 'message' || event.message?.type !== 'text') return;
  const text = event.message.text || '';
  const replyToken = event.replyToken;
  if (!replyToken) return;

  // 特殊指令
  const trimmed = text.trim();
  if (/^(help|說明|使用方式|hi|hello|你好)$/i.test(trimmed)) {
    return replyLine(env, replyToken, [
      {
        type: 'text',
        text:
          '🛡 ScamGuard / 脆盾\n\n' +
          '把你在脆/IG/LINE 看到的可疑訊息「貼」給我，我會告訴你風險分數跟理由。\n\n' +
          '也可以傳「黑名單 帳號名」查特定帳號；或傳「檢舉 帳號名 話術摘要」幫我們建資料庫。',
      },
    ]);
  }
  if (/^黑名單\s+/.test(trimmed)) {
    const handle = trimmed.replace(/^黑名單\s+/, '').trim();
    const hit = await kvGetBlacklist(env, handle, 'threads');
    const msg = hit
      ? `⚠️ 帳號「${handle}」有 ${hit.count} 次檢舉\n最近備註：${hit.lastNote || '（無）'}`
      : `ℹ️ 帳號「${handle}」目前不在黑名單。`;
    return replyLine(env, replyToken, [{ type: 'text', text: msg }]);
  }
  if (/^檢舉\s+/.test(trimmed)) {
    const rest = trimmed.replace(/^檢舉\s+/, '').trim();
    const [handle, ...noteParts] = rest.split(/\s+/);
    await kvAddReport(env, { handle, platform: 'threads', note: noteParts.join(' '), text: '' });
    return replyLine(env, replyToken, [
      { type: 'text', text: `✅ 已記錄對「${handle}」的檢舉，多人檢舉後會進入黑名單。` },
    ]);
  }

  // 一般訊息 → 分析
  const result = await analyzeText(text, env);
  return replyLine(env, replyToken, [{ type: 'text', text: formatLineReply(result, text) }]);
}

function formatLineReply(r, original) {
  const emoji = r.level === 'high' ? '🔴' : r.level === 'medium' ? '🟡' : '🟢';
  const label = r.level === 'high' ? '高風險' : r.level === 'medium' ? '可疑' : '低風險';
  const lines = [`${emoji} ${label} · 風險分數 ${r.risk}/100`];
  if (r.reasons?.length) {
    lines.push('');
    lines.push('判讀理由：');
    for (const reason of r.reasons.slice(0, 4)) lines.push(`· ${reason}`);
  }
  lines.push('');
  lines.push(`💡 ${r.advice}`);
  if (r.level === 'high') {
    lines.push('');
    lines.push('📞 165 反詐騙專線｜或在 LINE 輸入「檢舉 帳號名 話術」回報');
  }
  return lines.join('\n').slice(0, 4900);
}

async function verifyLineSignature(rawBody, signature, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function replyLine(env, replyToken, messages) {
  if (!env.LINE_CHANNEL_TOKEN) return;
  await fetch(LINE_REPLY_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.LINE_CHANNEL_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });
}

// ---------- /report & /blacklist ----------

async function handleReport(request, env) {
  const body = await request.json().catch(() => ({}));
  const handle = (body.handle || '').toString().trim().toLowerCase();
  const platform = (body.platform || 'threads').toString().trim().toLowerCase();
  const note = (body.note || '').toString().slice(0, 280);
  const text = (body.text || '').toString().slice(0, 2000);
  if (!handle && !text) return json({ error: 'missing_handle_or_text' }, 400);

  await kvAddReport(env, { handle, platform, note, text });
  return json({ ok: true });
}

async function handleBlacklistLookup(url, env) {
  const handle = (url.searchParams.get('handle') || '').trim().toLowerCase();
  const platform = (url.searchParams.get('platform') || 'threads').trim().toLowerCase();
  if (!handle) return json({ error: 'missing_handle' }, 400);
  const hit = await kvGetBlacklist(env, handle, platform);
  return json({ handle, platform, listed: !!hit, ...(hit || {}) });
}

async function kvAddReport(env, { handle, platform, note, text }) {
  if (!env.SCAMGUARD_KV) return;
  if (!handle) return;
  const key = `bl:${platform}:${handle}`;
  const existing = (await env.SCAMGUARD_KV.get(key, 'json')) || { count: 0, firstAt: null, lastNote: '' };
  existing.count += 1;
  existing.firstAt ||= new Date().toISOString();
  existing.lastAt = new Date().toISOString();
  if (note) existing.lastNote = note;
  if (text) existing.lastText = text.slice(0, 500);
  await env.SCAMGUARD_KV.put(key, JSON.stringify(existing));
}

async function kvGetBlacklist(env, handle, platform) {
  if (!env.SCAMGUARD_KV || !handle) return null;
  const key = `bl:${platform}:${handle.toLowerCase()}`;
  return (await env.SCAMGUARD_KV.get(key, 'json')) || null;
}

// ---------- helpers ----------

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS },
  });
}
