// Node.js serverless runtime (reliably loads .env.local in `vercel dev`, supports streaming).

// Gemini model to use. Override via env var GEMINI_MODEL if needed.
// flash-lite has a far more generous free tier (15 RPM / 1000 RPD vs flash's
// 10 RPM / 250 RPD), which is the main lever against 429 rate-limit errors.
const MODEL = "gemini-2.5-flash-lite";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ─── Anthropic-style request  →  Gemini request ────────────────────────────────
// Frontend sends: { system, messages:[{ role, content }], max_tokens }
//   - content can be a string, OR an array of blocks:
//       { type:"text", text } | { type:"image", source:{ media_type, data } }
function toGeminiBody({ system, messages = [], max_tokens }) {
  const toParts = (content) => {
    if (typeof content === "string") return [{ text: content }];
    if (Array.isArray(content)) {
      return content.map((b) => {
        if (b.type === "image" && b.source) {
          return { inlineData: { mimeType: b.source.media_type, data: b.source.data } };
        }
        return { text: b.text || "" };
      });
    }
    return [{ text: String(content ?? "") }];
  };

  const body = {
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: toParts(m.content),
    })),
    // thinkingBudget:0 disables Gemini 2.5's internal "thinking" step, which
    // otherwise adds several seconds of latency before any tokens stream out.
    generationConfig: {
      maxOutputTokens: max_tokens || 2000,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  return body;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).end("Method Not Allowed");
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server" });
    return;
  }

  // Vercel's Node runtime auto-parses JSON bodies into req.body.
  const reqBody = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

  const model = process.env.GEMINI_MODEL || MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;
  const payload = JSON.stringify(toGeminiBody(reqBody));

  // Gemini's free tier enforces a low requests-per-minute quota, so bursts of
  // calls can return 429. Retry transient 429/503 with exponential backoff,
  // honoring the upstream Retry-After hint, so the client doesn't see a hard
  // failure for a momentary rate limit. Kept low (2) on purpose: each retry is
  // itself a billable request against the per-minute quota, so retrying too
  // aggressively burns the budget and makes 429s more likely, not less.
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const MAX_ATTEMPTS = 2;
  let upstream;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: payload,
    });

    if (upstream.ok || (upstream.status !== 429 && upstream.status !== 503)) break;
    if (attempt === MAX_ATTEMPTS - 1) break;

    const retryAfter = parseFloat(upstream.headers.get("retry-after"));
    const backoff = Number.isFinite(retryAfter)
      ? retryAfter * 1000
      : Math.min(8000, 500 * 2 ** attempt) + Math.random() * 250;
    await upstream.body?.cancel?.().catch(() => {});
    await sleep(backoff);
  }

  // If Gemini errors, surface a non-2xx so the frontend's `if (!res.ok) throw` fires.
  if (!upstream.ok) {
    const errText = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", "application/json");
    res.end(errText);
    return;
  }

  // Stream Gemini SSE → Anthropic-style SSE that the frontend already parses:
  //   data: { "type":"content_block_delta", "delta":{ "text":"..." } }
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const j = JSON.parse(payload);
        const parts = j.candidates?.[0]?.content?.parts || [];
        const text = parts.map((p) => p.text || "").join("");
        if (text) {
          res.write(`data: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text } })}\n\n`);
        }
      } catch {
        // ignore non-JSON keepalive lines
      }
    }
  }

  res.write(`data: {"type":"message_stop"}\n\n`);
  res.end();
}
