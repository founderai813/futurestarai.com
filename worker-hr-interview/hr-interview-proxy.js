/**
 * HR 智慧面試助手 · Cloudflare Worker
 *
 * POST /  — generic AI task proxy (Gemini or Anthropic), used by hr-interview.html for:
 *   - task: "parse_resume"     → structured candidate fields from raw resume text
 *   - task: "generate_summary" → structured strengths/concerns/recommendation summary
 *
 * The Worker only ever receives plain text (resume text, transcript excerpts,
 * computed metrics) — no video/audio is ever uploaded here. Everything else
 * (recording, face/voice analysis, scoring, storage) happens client-side.
 *
 * Choose ONE of the following:
 *   wrangler secret put GEMINI_API_KEY         (Google AI Studio, free tier)
 *   wrangler secret put ANTHROPIC_API_KEY      (Anthropic Claude)
 * If both are set, GEMINI_API_KEY wins.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const CLAUDE_MODEL = 'claude-sonnet-4-6';
const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_TEXT_CHARS = 16000;

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

    const hasGemini = !!env.GEMINI_API_KEY;
    const hasAnthropic = !!env.ANTHROPIC_API_KEY;
    if (!hasGemini && !hasAnthropic) {
      return json({ error: 'No AI key configured (GEMINI_API_KEY or ANTHROPIC_API_KEY)' }, 500);
    }

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Invalid JSON' }, 400); }

    const { task, payload } = body || {};
    if (task === 'parse_resume') return handleTask(env, hasGemini, buildResumePrompt(payload || {}));
    if (task === 'generate_summary') return handleTask(env, hasGemini, buildSummaryPrompt(payload || {}));
    return json({ error: 'Unknown task. Expected "parse_resume" or "generate_summary".' }, 400);
  },
};

async function handleTask(env, hasGemini, prompt) {
  try {
    const raw = hasGemini
      ? await callGemini(env, prompt.system, prompt.user)
      : await callAnthropic(env, prompt.system, prompt.user);
    const result = extractJson(raw);
    return json({ result, raw, provider: hasGemini ? 'gemini' : 'anthropic' });
  } catch (e) {
    return json({ error: 'Upstream error', detail: String(e) }, 502);
  }
}

/* ---------------- Prompt builders ---------------- */
function buildResumePrompt(p) {
  const resumeText = String(p.resumeText || '').slice(0, MAX_TEXT_CHARS);
  const jobTitle = String(p.jobTitle || '');
  const jobSkills = Array.isArray(p.jobSkills) ? p.jobSkills.join('、') : '';
  const system =
    '你是專業的 HR 履歷分析助手。請閱讀使用者提供的履歷全文，並「只」以嚴格 JSON 格式輸出，' +
    '不要有任何前後說明文字或 Markdown code fence。JSON 格式為：\n' +
    '{"name":string,"email":string,"phone":string,"yearsExperience":number,' +
    '"education":[string],"experience":[string],"skills":[string],"summary":string}\n' +
    '其中 summary 為 50 字以內的重點摘要。skills 請盡量列出履歷中出現、且與職缺相關的技能關鍵字。' +
    '若欄位無法判斷請填空字串或空陣列，不要捏造資訊。使用繁體中文。';
  const user =
    `職缺名稱：${jobTitle}\n職缺所需技能：${jobSkills}\n\n履歷全文：\n${resumeText}`;
  return { system, user };
}

function buildSummaryPrompt(p) {
  const system =
    '你是資深招募主管，請根據候選人的履歷技能匹配度、溝通與行為量化指標、以及部分逐字稿，' +
    '生成結構化的面試評估。請「只」以嚴格 JSON 格式輸出，不要有其他文字或 code fence，格式為：\n' +
    '{"strengths":[string],"concerns":[string],"recommendation":"強烈推薦|推薦|保留|不建議","summary":string}\n' +
    'strengths 與 concerns 各列 2-3 點，summary 為 120 字以內的繁體中文綜合建議摘要，語氣專業中性。';
  const user = JSON.stringify({
    candidateName: p.candidateName, jobTitle: p.jobTitle, jobSkills: p.jobSkills,
    resumeSkills: p.resumeSkills, skillMatchPercent: p.skillMatchPercent,
    communicationScore: p.communicationScore, behavioralScore: p.behavioralScore,
    technicalScore: p.technicalScore, interviewerScore: p.interviewerScore,
    metrics: p.metrics, transcriptExcerpt: String(p.transcriptExcerpt || '').slice(0, MAX_TEXT_CHARS),
  }, null, 0);
  return { system, user };
}

/* ---------------- Provider calls ---------------- */
async function callGemini(env, system, message) {
  const model = env.GEMINI_MODEL || GEMINI_MODEL;
  const url = `${GEMINI_URL}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 1200, temperature: 0.4 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
}

async function callAnthropic(env, system, message) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.CLAUDE_MODEL || CLAUDE_MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: 'user', content: message }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return (data.content || []).map(p => p.text || '').join('').trim();
}

/* ---------------- Helpers ---------------- */
function extractJson(text) {
  if (!text) return null;
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try { return JSON.parse(s.slice(start, end + 1)); }
  catch { return null; }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS },
  });
}
