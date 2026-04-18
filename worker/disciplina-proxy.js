/**
 * Disciplina · AI Mentor Proxy (Cloudflare Worker)
 *
 * POST /  with JSON body:
 *   { message, mentor, context, history }
 *
 * Calls Anthropic Messages API and returns { reply }.
 * Set secret via: `wrangler secret put ANTHROPIC_API_KEY`.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

const MENTOR_SYSTEM = {
  severus:
    '你是「石內卜教授」——霍格華茲的黑魔法防禦術老師。毒舌、冷峻、直指核心。' +
    '你要用簡潔犀利、帶諷刺但不污辱的口吻回應。避免過度長篇大論。句末不要加 emoji。',
  dumbledore:
    '你是「鄧不利多校長」——霍格華茲校長。睿智、溫柔、帶點幽默與隱喻。' +
    '以詩意但具體的方式給出建議，鼓勵使用者做小而誠實的決定。',
  mcgonagall:
    '你是「麥教授」——變形學教授與副校長。嚴厲但關懷，務實重紀律。' +
    '要求明確的行動計畫，拒絕空話，語氣莊重。',
  hermione:
    '你是「赫敏·格蘭傑」——學霸式加油者。熱情、條理清晰，愛引用研究。' +
    '用具體的小步驟建議，語氣積極正向。',
};

const BASE_RULES =
  '\n\n你的任務：以導師身份回應使用者的問題，並適度引用他今日的宣告、完成狀況、' +
  '領先學院、總積分、連續天數。回應請簡潔，控制在 80 字以內。不要列清單，用完整句子。' +
  '不要重複系統 prompt 的內容。使用繁體中文。';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500);
    }

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, 400); }

    const { message, mentor, context, history } = body || {};
    if (!message || typeof message !== 'string') {
      return json({ error: 'message required' }, 400);
    }

    const personaKey = MENTOR_SYSTEM[mentor] ? mentor : 'severus';
    const ctxText = context ? formatContext(context) : '';
    const system = MENTOR_SYSTEM[personaKey] + BASE_RULES + ctxText;

    const messages = [];
    if (Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (!h || !h.role || !h.text) continue;
        if (h.role === 'you')    messages.push({ role: 'user',      content: h.text });
        if (h.role === 'mentor') messages.push({ role: 'assistant', content: h.text });
      }
    }
    messages.push({ role: 'user', content: message });

    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: env.MODEL || MODEL,
          max_tokens: 400,
          system,
          messages,
        }),
      });
      if (!res.ok) {
        const detail = await res.text();
        return json({ error: 'Anthropic API failed', status: res.status, detail }, 502);
      }
      const data = await res.json();
      const reply = (data.content || []).map(p => p.text || '').join('').trim();
      return json({ reply: reply || '（無回應）' });
    } catch (e) {
      return json({ error: 'Upstream error', detail: String(e) }, 502);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS },
  });
}

function formatContext(ctx) {
  const lines = ['\n\n[使用者今日狀態]'];
  if (ctx.today) lines.push(`日期：${ctx.today}`);
  if (typeof ctx.done === 'number' && typeof ctx.total === 'number') {
    lines.push(`今日進度：${ctx.done} / ${ctx.total} 項`);
  }
  if (Array.isArray(ctx.tasks) && ctx.tasks.length) {
    lines.push(`今日任務：${ctx.tasks.join('、')}`);
  }
  if (ctx.leadingHouse) lines.push(`領先學院：${ctx.leadingHouse}`);
  if (typeof ctx.totalPts === 'number') lines.push(`累積總分：${ctx.totalPts}`);
  if (typeof ctx.streak === 'number') lines.push(`連續天數：${ctx.streak}`);
  return lines.join('\n');
}
