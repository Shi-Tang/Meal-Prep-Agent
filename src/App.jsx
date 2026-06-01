import { useState, useCallback, useRef, useEffect } from "react";

// ─── Persist preference to memory (no localStorage in artifacts) ───────────────
const prefStore = { liked: [], disliked: [] };

// ─── Styles ────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  :root {
    --bg:      #eef6ef; --surf:  #ffffff; --surf2: #e9f3e7;
    --border:  #d2e5d1; --acc:   #3a9d5d; --acc2:  #2f8650;
    --gold:    #b07d22; --text:  #1f3325; --muted: #6c8472;
    --red:     #c84a37; --green: #3a9d5d;
    --shadow:  0 1px 3px rgba(31,51,37,.06), 0 1px 2px rgba(31,51,37,.04);
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-text-size-adjust: 100%; }
  body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 14px; line-height: 1.6; min-height: 100vh; -webkit-font-smoothing: antialiased; }
  .app { max-width: 920px; margin: 0 auto; padding: 20px 14px 60px; }

  .hdr { text-align: center; padding: 28px 0 22px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
  .hdr-tag { font-size: 10px; letter-spacing: 3px; color: var(--acc); text-transform: uppercase; margin-bottom: 8px; }
  .hdr h1 { font-family: 'Playfair Display', serif; font-size: 2rem; }
  .hdr h1 span { color: var(--acc); }
  .hdr-sub { color: var(--muted); font-size: 12px; margin-top: 6px; }

  .steps { display: flex; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; margin-bottom: 22px; }
  .step-btn { flex: 1; background: transparent; border: none; padding: 11px 6px; color: var(--muted); cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 5px; border-right: 1px solid var(--border); }
  .step-btn:last-child { border-right: none; }
  .step-btn.active { background: var(--acc); color: #fff; }
  .step-btn.done { color: var(--gold); }
  .step-num { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid currentColor; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
  .step-btn.active .step-num { border-color: rgba(255,255,255,.6); }

  .card { background: var(--surf); border: 1px solid var(--border); border-radius: 12px; padding: 22px; margin-bottom: 14px; box-shadow: var(--shadow); }
  .card-title { font-family: 'Playfair Display', serif; font-size: 1.05rem; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
  .card-title .ico { width: 30px; height: 30px; background: var(--acc); border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }

  input, select { background: var(--surf2); border: 1px solid var(--border); border-radius: 7px; color: var(--text); padding: 7px 10px; font-family: 'DM Sans', sans-serif; font-size: 12px; width: 100%; outline: none; transition: border-color .2s; }
  input:focus, select:focus { border-color: var(--acc); }
  select option { background: var(--surf2); }

  .btn { border: none; border-radius: 8px; padding: 9px 16px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; transition: all .2s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: var(--acc); color: #fff; }
  .btn-primary:hover:not(:disabled) { background: var(--acc2); }
  .btn-primary:disabled { opacity: .45; cursor: not-allowed; }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--muted); }
  .btn-ghost:hover:not(:disabled) { border-color: var(--acc); color: var(--acc); }
  .btn-ghost:disabled { opacity: .45; cursor: not-allowed; }
  .btn-del { background: transparent; border: none; color: var(--muted); padding: 3px 7px; font-size: 15px; cursor: pointer; }
  .btn-del:hover { color: var(--red); }
  .btn-add { background: var(--surf2); border: 1px dashed var(--border); color: var(--muted); width: 100%; margin-top: 12px; padding: 9px; justify-content: center; }
  .btn-add:hover { border-color: var(--acc); color: var(--acc); }
  .btn-row { display: flex; gap: 9px; margin-top: 18px; flex-wrap: wrap; }
  .divider { border: none; border-top: 1px solid var(--border); margin: 18px 0; }

  .spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: var(--acc); border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .load-txt { color: var(--muted); font-size: 12px; }
  .error { background: rgba(200,74,55,.1); border: 1px solid rgba(200,74,55,.3); border-radius: 8px; padding: 11px 15px; color: #b03a28; font-size: 12px; margin-top: 10px; }
  .empty { text-align: center; padding: 30px; color: var(--muted); font-size: 13px; }
  .empty-ico { font-size: 30px; margin-bottom: 8px; }

  /* ── Ingredient table ── */
  .ing-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .ing-table th:nth-child(1), .ing-table td:nth-child(1) { width: 32%; }
  .ing-table th:nth-child(2), .ing-table td:nth-child(2) { width: 15%; }
  .ing-table th:nth-child(3), .ing-table td:nth-child(3) { width: 17%; }
  .ing-table th:nth-child(4), .ing-table td:nth-child(4) { width: 28%; }
  .ing-table th:nth-child(5), .ing-table td:nth-child(5) { width: 8%; }
  .ing-table th { font-size: 10px; color: var(--muted); letter-spacing: 1px; text-transform: uppercase; padding: 0 6px 8px; text-align: left; font-weight: 500; }
  .ing-table td { padding: 4px 4px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .ing-table tr:last-child td { border-bottom: none; }
  .ing-table input, .ing-table select { padding: 6px 8px; font-size: 12px; min-width: 0; text-overflow: ellipsis; }

  /* ── Receipt upload ── */
  .upload-zone { border: 2px dashed var(--border); border-radius: 10px; padding: 24px; text-align: center; cursor: pointer; transition: border-color .2s; position: relative; }
  .upload-zone:hover, .upload-zone.drag { border-color: var(--acc); }
  .upload-zone input[type=file] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .upload-icon { font-size: 32px; margin-bottom: 8px; }
  .upload-label { font-size: 13px; color: var(--muted); }
  .upload-label strong { color: var(--acc); }

  /* Receipt preview items */
  .receipt-item { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 12px; }
  .receipt-item:last-child { border-bottom: none; }
  .receipt-cb { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--border); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all .2s; cursor: pointer; }
  .receipt-cb.on { background: var(--green); border-color: var(--green); color: #fff; font-size: 10px; }
  .receipt-name { flex: 1; color: var(--text); }
  .receipt-qty { color: var(--gold); font-size: 11px; min-width: 60px; }
  .receipt-cat select { padding: 4px 6px; font-size: 11px; }

  /* ── Recipe grid ── */
  .recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(255px, 1fr)); gap: 16px; }

  /* ── Flip card ── */

  .flip-wrap { perspective: 1000px; height: 340px; cursor: pointer; }
  .flip-inner { position: relative; width: 100%; height: 100%; transition: transform .5s cubic-bezier(.4,0,.2,1); transform-style: preserve-3d; }
  .flip-wrap.flipped .flip-inner { transform: rotateY(180deg); }
  .flip-front, .flip-back { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
  .flip-front { background: var(--surf); display: flex; flex-direction: column; transition: border-color .2s; position: absolute; }
  .flip-front.selected { border-color: var(--green); box-shadow: 0 0 0 1px var(--green); }

  .flip-front-top { padding: 14px 14px 10px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .flip-name { font-family: 'Playfair Display', serif; font-size: 1.05rem; color: var(--acc); line-height: 1.2; }
  .flip-name-en { font-size: 10px; color: var(--muted); margin-top: 2px; font-style: italic; }
  .flip-meta { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 7px; }
  .flip-tag { font-size: 10px; padding: 2px 7px; border-radius: 20px; background: var(--surf2); color: var(--muted); border: 1px solid var(--border); }
  .flip-tag.device { border-color: rgba(201,160,54,.35); color: var(--gold); }
  .flip-body { padding: 10px 14px; flex: 1; overflow-y: auto; min-height: 0; }
  .ing-row-f { display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); font-size: 12px; line-height: 1.8; }
  .ing-row-f:last-child { border-bottom: none; }
  .ing-name { color: var(--text); } .ing-amt { color: var(--gold); font-weight: 500; }
  .flip-hint { padding: 6px 14px; font-size: 10px; color: var(--muted); text-align: right; border-top: 1px solid var(--border); flex-shrink: 0; }

  /* Select checkbox */
  .dish-check { position: absolute; top: 10px; right: 10px; width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--border); background: var(--surf); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .2s; z-index: 2; font-size: 12px; color: transparent; }
  .dish-check:hover { border-color: var(--green); }
  .dish-check.on { background: var(--green); border-color: var(--green); color: #fff; }
  /* Hide the front checkbox once flipped so it can't bleed through onto the back header (iOS backface bug) */
  .flip-wrap.flipped .dish-check { opacity: 0; pointer-events: none; }

  /* Skel */
  .skel { background: linear-gradient(90deg, var(--surf2) 25%, var(--border) 50%, var(--surf2) 75%); background-size: 200% 100%; animation: skel-shine 1.2s infinite; border-radius: 4px; }
  @keyframes skel-shine { to { background-position: -200% 0; } }

  /* Back */
  .flip-back { background: var(--surf2); transform: rotateY(180deg); display: flex; flex-direction: column; }
  .flip-back-hdr { background: var(--acc); padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .flip-back-name { font-family: 'Playfair Display', serif; font-size: .9rem; color: #fff; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 10px; }
  .flip-back-close { background: rgba(255,255,255,.2); border: none; color: #fff; font-size: 16px; width: 22px; height: 22px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; flex-shrink: 0; }
  .flip-back-body { flex: 1; overflow-y: auto; min-height: 0; padding: 10px 14px 16px; }
  .back-label { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--acc); margin-bottom: 5px; }
  .step-item { display: flex; gap: 7px; font-size: 11px; line-height: 1.6; margin-bottom: 5px; }
  .step-dot { width: 17px; height: 17px; background: var(--acc); border-radius: 50%; color: #fff; font-size: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

  /* Prep notes */
  .prep-notes { display: flex; flex-direction: column; gap: 6px; }
  .prep-note { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; padding: 8px 10px; background: var(--surf2); border-radius: 7px; border-left: 3px solid var(--gold); line-height: 1.5; }

  /* Confirm bar */
  .confirm-bar { background: var(--surf2); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .confirm-bar-info { font-size: 12px; color: var(--muted); line-height: 1.5; }
  .confirm-bar-info strong { color: var(--text); }
  .pref-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
  .pref-chip { font-size: 10px; padding: 2px 8px; border-radius: 20px; }
  .pref-chip.like { background: rgba(58,157,93,.15); color: #2f8650; }
  .pref-chip.dislike { background: rgba(200,74,55,.12); color: #b03a28; }

  /* Shopping */
  .shop-store-badge { display: inline-flex; align-items: center; gap: 8px; background: var(--acc); color: #fff; border-radius: 8px; padding: 8px 16px; font-family: 'Playfair Display', serif; font-size: 1rem; margin-bottom: 18px; }
  .shop-cat { margin-bottom: 16px; }
  .shop-cat-hdr { display: flex; align-items: center; gap: 6px; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); font-weight: 500; padding: 8px 0; border-bottom: 1px solid var(--border); margin-bottom: 2px; }
  .shop-item { display: flex; align-items: center; gap: 12px; padding: 8px 6px; border-bottom: 1px solid var(--border); cursor: pointer; user-select: none; transition: opacity .2s; }
  .shop-item:last-child { border-bottom: none; }
  .shop-item.checked { opacity: .45; }
  .shop-cb { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid var(--border); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all .2s; }
  .shop-item.checked .shop-cb { background: var(--green); border-color: var(--green); }
  .shop-check-icon { font-size: 11px; color: #fff; display: none; }
  .shop-item.checked .shop-check-icon { display: block; }
  .shop-names { flex: 1; }
  .shop-cn { font-size: 13px; font-weight: 500; }
  .shop-item.checked .shop-cn { text-decoration: line-through; }
  .shop-en { font-size: 10px; color: var(--muted); }
  .shop-qty { font-size: 12px; color: var(--gold); font-weight: 500; flex-shrink: 0; }
  .shop-warn { font-size: 10px; color: var(--red); margin-left: 4px; }
  .shop-progress { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .progress-bar { flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--green); border-radius: 2px; transition: width .3s; }
  .progress-txt { font-size: 11px; color: var(--muted); flex-shrink: 0; }
  .asian-hdr { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--muted); padding: 8px 0 6px; border-top: 1px solid var(--border); margin-top: 16px; margin-bottom: 2px; }

  /* ── Phone adaptive (iPhone 15 Pro ≈ 393px and similar) ── */
  @media (max-width: 480px) {
    body { font-size: 15px; }
    .app { padding: 14px 10px 48px; }
    .hdr { padding: 20px 0 18px; margin-bottom: 18px; }
    .hdr h1 { font-size: 1.55rem; }
    .hdr-tag { letter-spacing: 2px; }

    .steps { margin-bottom: 18px; }
    .step-btn { flex-direction: column; gap: 4px; padding: 9px 2px; font-size: 11px; line-height: 1.25; }

    .card { padding: 16px 13px; }
    .card-title { font-size: 1rem; gap: 8px; }
    .card-title .ico { width: 27px; height: 27px; font-size: 14px; }

    /* Ingredient table: keep all columns visible, no clipped labels */
    .ing-table th { font-size: 9px; letter-spacing: .5px; padding: 0 3px 8px; }
    .ing-table td { padding: 4px 2px; }
    .ing-table input, .ing-table select { padding: 6px 4px; font-size: 12px; }
    .ing-table th:nth-child(1), .ing-table td:nth-child(1) { width: 30%; }
    .ing-table th:nth-child(2), .ing-table td:nth-child(2) { width: 16%; }
    .ing-table th:nth-child(3), .ing-table td:nth-child(3) { width: 18%; }
    .ing-table th:nth-child(4), .ing-table td:nth-child(4) { width: 28%; }
    .ing-table th:nth-child(5), .ing-table td:nth-child(5) { width: 8%; }

    .recipe-grid { grid-template-columns: 1fr; gap: 14px; }
    .flip-wrap { height: 360px; }
    .step-item { font-size: 12px; }

    input, select { font-size: 14px; }
    .btn { font-size: 13px; padding: 10px 14px; }
    .confirm-bar { padding: 12px 13px; }
    .shop-store-badge { font-size: .9rem; padding: 7px 13px; }
    .shop-cn { font-size: 14px; }
  }
`;

const UNITS = ["lb","oz","个","包","瓶","ml","L","cup","g","kg","片","根","头","束","盒","块"];
const CATS  = ["肉类","蔬菜","碳水","蛋奶","调料","其他"];
const SYS   = `你是专业的川渝料理备餐规划师。两人家庭（50kg/75kg，轻中度活动），每周备餐一次冷冻存放。约束：每餐含蔬菜+肉类（禁羊肉/鱼肉）+碳水；设备：炒锅/平底锅/炖锅/高压锅/微波炉/烤箱；川渝风味；单位用美制（°F/lb/oz/cup/tbsp/tsp/inch）；只用当前库存食材。回复中文。`;

// ─── Backend call (Vercel serverless → Gemini) ────────────────────────────────
// Override with VITE_API_URL if the backend lives on a different origin.
const API_URL = import.meta.env.VITE_API_URL || "/api/chat";

async function callClaude(messages, onChunk, maxTokens = 2000) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ max_tokens: maxTokens, system: SYS, messages }),
  });
  if (!res.ok) {
    // 429 = upstream rate limit (Gemini free tier ≈ 10–15 req/min). The backend
    // already retries with backoff; if it still bubbles up, tell the user to
    // wait rather than showing a cryptic "API 429".
    if (res.status === 429) throw new Error("请求过于频繁，已触发接口限流，请等待约 30 秒后再试");
    throw new Error(`服务暂时不可用（API ${res.status}），请稍后重试`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6);
      if (raw === "[DONE]") continue;
      try {
        const j = JSON.parse(raw);
        if (j.type === "content_block_delta" && j.delta?.text) {
          full += j.delta.text; onChunk && onChunk(full);
        }
      } catch {}
    }
  }
  return full;
}

function extractJSON(text) {
  const b = text.match(/```json\s*([\s\S]*?)```/);
  if (b) { try { return JSON.parse(b[1].trim()); } catch {} }
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  if (s !== -1 && e > s) { try { return JSON.parse(text.slice(s, e+1)); } catch {} }
  const as = text.indexOf("["), ae = text.lastIndexOf("]");
  if (as !== -1 && ae > as) { try { return JSON.parse(text.slice(as, ae+1)); } catch {} }
  return null;
}

// ─── Skeleton Card ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flip-wrap" style={{ cursor:"default" }}>
      <div className="flip-front" style={{ position:"relative", inset:"auto", backfaceVisibility:"visible", borderRadius:12 }}>
        <div className="flip-front-top">
          <div className="skel" style={{ height:18, width:"60%", marginBottom:8 }} />
          <div className="skel" style={{ height:10, width:"40%", marginBottom:8 }} />
          <div style={{ display:"flex", gap:6 }}>
            <div className="skel" style={{ height:18, width:55, borderRadius:20 }} />
            <div className="skel" style={{ height:18, width:45, borderRadius:20 }} />
          </div>
        </div>
        <div className="flip-body">
          {[75,55,65,60,50].map((w,i) => <div key={i} className="skel" style={{ height:11, width:`${w}%`, marginBottom:10 }} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Flip Card ──────────────────────────────────────────────────────────────────
function FlipCard({ dish, selected, onSelect }) {
  const [flipped,      setFlipped]      = useState(false);
  const [steps,        setSteps]        = useState([]);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [stepsError,   setStepsError]   = useState("");
  const fetchedRef = useRef(false);

  // Strip a leading list marker ("1. ", "2) ", "- ", "步骤3：") from a line.
  const cleanStepLine = (l) =>
    l.replace(/^\s*[-*•]?\s*(?:步骤)?\s*\d+\s*[\.\)、:：]?\s*/, "").trim();

  const loadSteps = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setStepsLoading(true);
    setStepsError("");
    try {
      // Ask for one step per line (instead of a JSON array) so we can render
      // each completed line the moment it streams in — the user sees steps
      // appear progressively within ~1–2s instead of waiting for the whole
      // response. This is the main fix for the slow flip-to-steps loading.
      const prompt = `为川渝菜「${dish.name}」生成备餐步骤。
食材：${(dish.ingredients||[]).map(i=>`${i.name} ${i.amount}`).join("、")}
设备：${dish.device}，份量：${dish.servings || "12人份"}
要求：5-7步，每步单独一行并以序号开头（如"1. ..."），含°F/lb/cup等美制单位，最后一步为分装冷冻保存。只输出步骤行，不要标题或其他文字。`;

      let committed = 0;
      const raw = await callClaude([{ role:"user", content:prompt }], (full) => {
        // Only commit lines already terminated by a newline, so the
        // half-streamed final line doesn't flicker in and out.
        const done = full.split("\n").slice(0, -1).map(cleanStepLine).filter(l => l.length > 3);
        if (done.length > committed) {
          committed = done.length;
          setSteps(done);
          setStepsLoading(false); // first step is visible → drop the spinner
        }
      }, 1200);

      // Final flush: the last line has no trailing newline once streaming ends.
      let finalSteps = raw.split("\n").map(cleanStepLine).filter(l => l.length > 3);
      if (!finalSteps.length) {
        const arr = extractJSON(raw); // tolerate a JSON-array style reply
        if (Array.isArray(arr) && arr.length) finalSteps = arr.filter(x => typeof x === "string" && x.trim());
      }
      if (finalSteps.length) { setSteps(finalSteps); setStepsError(""); }
      else { setStepsError("步骤生成失败，点击下方重试"); fetchedRef.current = false; }
    } catch (err) {
      // Network error / rate-limit / server overload — keep the card retryable.
      setStepsError(err.message ? `加载失败：${err.message}` : "加载失败，点击下方重试");
      fetchedRef.current = false;
    } finally { setStepsLoading(false); }
  }, [dish]);

  const retrySteps = (e) => {
    e.stopPropagation();
    fetchedRef.current = false;
    setSteps([]);
    loadSteps();
  };

  const handleFlip = (e) => {
    if (e.target.closest(".dish-check")) return;
    const next = !flipped;
    setFlipped(next);
    if (next && !fetchedRef.current && steps.length === 0) loadSteps();
  };

  return (
    <div className={`flip-wrap ${flipped ? "flipped" : ""}`} onClick={handleFlip}>
      <div className="flip-inner">
        {/* Front */}
        <div className={`flip-front ${selected ? "selected" : ""}`}>
          {/* Checkbox in top-right corner */}
          <div className={`dish-check ${selected ? "on" : ""}`}
            onClick={e => { e.stopPropagation(); onSelect(); }}>
            {selected && "✓"}
          </div>
          <div className="flip-front-top">
            <div className="flip-name">{dish.name}</div>
            {dish.name_en && <div className="flip-name-en">{dish.name_en}</div>}
            <div className="flip-meta">
              {dish.device  && <span className="flip-tag device">🍳 {dish.device}</span>}
              {dish.time    && <span className="flip-tag">⏱ {dish.time}</span>}
              {dish.servings && <span className="flip-tag">👥 {dish.servings}</span>}
            </div>
          </div>
          <div className="flip-body">
            {(dish.ingredients||[]).map((ing,i) => (
              <div key={i} className="ing-row-f">
                <span className="ing-name">{ing.name}</span>
                {ing.amount && <span className="ing-amt">{ing.amount}</span>}
              </div>
            ))}
          </div>
          <div className="flip-hint">点击查看做法 ↗</div>
        </div>
        {/* Back */}
        <div className="flip-back" onClick={e => e.stopPropagation()}>
          <div className="flip-back-hdr" onClick={() => setFlipped(false)}>
            <div className="flip-back-name">{dish.name}</div>
            <button className="flip-back-close">×</button>
          </div>
          <div className="flip-back-body">
            <div className="back-label">详细步骤</div>
            {stepsLoading && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"16px 0", color:"var(--muted)", fontSize:12 }}>
                <div className="spinner" style={{ width:20, height:20, borderWidth:2 }} />加载中...
              </div>
            )}
            {steps.map((s,i) => (
              <div key={i} className="step-item">
                <div className="step-dot">{i+1}</div><div>{s}</div>
              </div>
            ))}
            {stepsError && !stepsLoading && steps.length === 0 && (
              <div style={{ marginTop:4 }}>
                <div className="error">❌ {stepsError}</div>
                <button className="btn btn-ghost" style={{ marginTop:10, width:"100%", justifyContent:"center" }}
                  onClick={retrySteps}>🔄 重新加载做法</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shopping List ──────────────────────────────────────────────────────────────
function ShoppingList({ data, onConfirmPurchase }) {
  const [checked, setChecked]   = useState({});
  const [confirmed, setConfirmed] = useState(false);
  if (!data) return null;
  const allFlat = [
    ...(data.main_store_items||[]).flatMap((cat,ci) => (cat.items||[]).map((item,ii) => ({ key:`m-${ci}-${ii}`, item }))),
    ...(data.asian_store_items||[]).map((item,ii) => ({ key:`a-${ii}`, item })),
  ];
  const total = allFlat.length;
  const doneCount = allFlat.filter(({key}) => !!checked[key]).length;
  const toggle = key => setChecked(p => ({ ...p, [key]: !p[key] }));
  const handleConfirm = () => { onConfirmPurchase(allFlat.filter(({key}) => !!checked[key]).map(({item}) => item)); setConfirmed(true); };
  const renderItem = ({ key, item }) => {
    const isChecked = !!checked[key];
    return (
      <div key={key} className={`shop-item ${isChecked?"checked":""}`} onClick={() => toggle(key)}>
        <div className="shop-cb"><span className="shop-check-icon">✓</span></div>
        <div className="shop-names">
          <div className="shop-cn">{item.name_cn}{item.low_stock && <span className="shop-warn">⚠ 库存预警</span>}</div>
          {item.name_en && <div className="shop-en">{item.name_en}</div>}
        </div>
        <div className="shop-qty">{item.qty_display || item.qty}</div>
      </div>
    );
  };
  return (
    <div>
      {data.store_name && <div className="shop-store-badge">🏪 {data.store_name}</div>}
      <div className="shop-progress">
        <div className="progress-bar"><div className="progress-fill" style={{ width: total ? `${(doneCount/total)*100}%` : "0%" }} /></div>
        <div className="progress-txt">{doneCount} / {total} 已购</div>
      </div>
      {(data.main_store_items||[]).map((cat,ci) => cat.items?.length > 0 && (
        <div key={ci} className="shop-cat">
          <div className="shop-cat-hdr">{cat.icon} {cat.category}</div>
          {cat.items.map((item,ii) => renderItem({ key:`m-${ci}-${ii}`, item }))}
        </div>
      ))}
      {data.asian_store_items?.length > 0 && (
        <div>
          <div className="asian-hdr">🏮 中超单独购买（H Mart / 99 Ranch）</div>
          {data.asian_store_items.map((item,ii) => renderItem({ key:`a-${ii}`, item }))}
        </div>
      )}
      {!confirmed && doneCount > 0 && (
        <div style={{ marginTop:20, paddingTop:14, borderTop:"1px solid var(--border)" }}>
          <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center", padding:"11px" }} onClick={handleConfirm}>
            ✅ 确认已购 {doneCount} 件，更新食材库存 →
          </button>
          <div style={{ fontSize:11, color:"var(--muted)", textAlign:"center", marginTop:7 }}>勾选的食材将自动追加到食材库存</div>
        </div>
      )}
      {confirmed && <div style={{ marginTop:14, padding:"11px 14px", background:"rgba(58,157,93,.15)", border:"1px solid rgba(58,157,93,.3)", borderRadius:8, fontSize:13, color:"#2f8650" }}>✅ 库存已更新！</div>}
    </div>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0);
  const [ings, setIngs] = useState([
    { id:1,  name:"鸡腿（带骨）", qty:"3",   unit:"lb",  cat:"肉类" },
    { id:2,  name:"猪五花肉",     qty:"2",   unit:"lb",  cat:"肉类" },
    { id:3,  name:"牛腱子肉",     qty:"1.5", unit:"lb",  cat:"肉类" },
    { id:4,  name:"西兰花",       qty:"2",   unit:"个",  cat:"蔬菜" },
    { id:5,  name:"土豆",         qty:"3",   unit:"个",  cat:"蔬菜" },
    { id:6,  name:"嫩豆腐",       qty:"2",   unit:"盒",  cat:"蔬菜" },
    { id:7,  name:"大蒜",         qty:"1",   unit:"头",  cat:"蔬菜" },
    { id:8,  name:"生姜",         qty:"1",   unit:"块",  cat:"蔬菜" },
    { id:9,  name:"鸡蛋",         qty:"6",   unit:"个",  cat:"蛋奶" },
    { id:10, name:"郫县豆瓣酱",   qty:"0.5", unit:"瓶",  cat:"调料" },
    { id:11, name:"生抽",         qty:"0.8", unit:"瓶",  cat:"调料" },
    { id:12, name:"花椒",         qty:"20",  unit:"g",   cat:"调料" },
    { id:13, name:"干辣椒",       qty:"30",  unit:"g",   cat:"调料" },
    { id:14, name:"香油",         qty:"0.6", unit:"瓶",  cat:"调料" },
  ]);
  const [nid, setNid] = useState(20);

  // Receipt scan state
  const [receiptLoading,  setReceiptLoading]  = useState(false);
  const [receiptError,    setReceiptError]    = useState("");
  const [receiptItems,    setReceiptItems]    = useState([]);   // parsed from receipt
  const [receiptChecked,  setReceiptChecked]  = useState({});  // which to import
  const [receiptCats,     setReceiptCats]     = useState({});  // category overrides

  // Menu state
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuDone,    setMenuDone]    = useState(false);
  const [menuError,   setMenuError]   = useState("");
  const [dishes,      setDishes]      = useState([]);   // length-3 array; null = loading slot
  const [prepNotes,   setPrepNotes]   = useState([]);
  const [selected,    setSelected]    = useState(new Set()); // dish names user picked

  // Preference memory (in-session)
  const [liked,    setLiked]    = useState(prefStore.liked);
  const [disliked, setDisliked] = useState(prefStore.disliked);

  // Shopping state
  const [shopLoading, setShopLoading] = useState(false);
  const [shopError,   setShopError]   = useState("");
  const [shopData,    setShopData]    = useState(null);

  const ingStr = ings.filter(r => r.name.trim()).map(r => `${r.name} ${r.qty}${r.unit}（${r.cat}）`).join("\n");
  const ingCount = ings.filter(r => r.name.trim()).length;

  // ── Ingredient CRUD
  const addRow    = () => { setIngs(p => [...p, { id:nid, name:"", qty:"", unit:"个", cat:"蔬菜" }]); setNid(n=>n+1); };
  const removeRow = id => setIngs(p => p.filter(r => r.id !== id));
  const upd       = (id, f, v) => setIngs(p => p.map(r => r.id===id ? {...r,[f]:v} : r));

  // ── Receipt photo scan
  const fileRef = useRef();

  // Downscale + re-encode to JPEG in the browser before upload. Phone photos
  // are often several MB (and sometimes HEIC); a raw base64 upload can exceed
  // Vercel's 4.5MB request-body limit and silently fail. This normalizes the
  // format and keeps the payload small + fast.
  const fileToCompressedJpeg = (file, maxDim = 1600, quality = 0.8) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("无法读取这张图片（可能是 HEIC 等格式），请换成 JPG/PNG 再试"));
      };
      img.src = url;
    });

  const scanReceipt = async (file) => {
    if (!file) return;
    setReceiptLoading(true);
    setReceiptError("");
    setReceiptItems([]);
    setReceiptChecked({});
    setReceiptCats({});
    try {
      const b64 = await fileToCompressedJpeg(file);
      const mediaType = "image/jpeg";
      const raw = await callClaude([{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
          { type: "text", text: `识别这张超市小票中的所有食材和商品，只返回JSON数组，不要其他文字。
每项格式：{"name":"商品名（中文）","qty":数量数字,"unit":"单位","cat":"肉类/蔬菜/碳水/蛋奶/调料/其他"}
单位从以下选：lb/oz/个/包/瓶/ml/L/cup/g/kg/片/根/头/束/盒/块
如果看不清数量就默认1，单位根据商品合理推断，非食品类商品忽略。` }
        ]
      }], null, 1500);
      const arr = extractJSON(raw);
      if (!Array.isArray(arr) || arr.length === 0) throw new Error("未识别到食材，请检查小票图片是否清晰");
      setReceiptItems(arr);
      // default: all checked
      const initChecked = {};
      arr.forEach((_, i) => { initChecked[i] = true; });
      setReceiptChecked(initChecked);
    } catch(e) {
      setReceiptError(e.message);
    } finally {
      setReceiptLoading(false);
    }
  };

  const importReceipt = () => {
    const toAdd = receiptItems
      .filter((_, i) => receiptChecked[i])
      .map((item, i) => ({ ...item, cat: receiptCats[i] || item.cat || "其他" }));
    setIngs(prev => {
      let updated = [...prev];
      let nextId = Math.max(...prev.map(r => r.id), nid) + 1;
      toAdd.forEach(item => {
        const idx = updated.findIndex(r => r.name.trim() === item.name.trim());
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], qty: String(parseFloat(updated[idx].qty||0) + (parseFloat(item.qty)||1)) };
        } else {
          updated.push({ id: nextId++, name: item.name, qty: String(item.qty||1), unit: item.unit||"个", cat: item.cat||"其他" });
        }
      });
      return updated;
    });
    setReceiptItems([]);
    setReceiptChecked({});
  };

  // ── Generate menu: single streaming request, fill slots as each line arrives
  const generateMenu = useCallback(async (keepDishes = []) => {
    setMenuLoading(true);
    setMenuDone(false);
    setMenuError("");
    setPrepNotes([]);
    setSelected(new Set());

    // Pre-fill slots: kept dishes in place, null for new ones
    const slots = [null, null, null];
    keepDishes.forEach((d, i) => { if (i < 3) slots[i] = d; });
    setDishes([...slots]);

    const needCount = 3 - keepDishes.length;
    if (needCount === 0) { setMenuLoading(false); setMenuDone(true); return; }

    const prefCtx = [
      liked.length    ? `喜欢（优先）：${liked.slice(-8).join("、")}` : "",
      disliked.length ? `不喜欢（避免）：${disliked.slice(-12).join("、")}` : "",
      keepDishes.length ? `已保留（不要重复）：${keepDishes.map(d=>d.name).join("、")}` : "",
    ].filter(Boolean).join("；");

    // Which slots need filling
    const emptySlots = slots.map((d, i) => d === null ? i : -1).filter(i => i >= 0);

    const prompt = `根据食材库存规划川渝备餐，只输出 ${needCount} 行JSON，每行一道菜，不要任何其他文字。
${prefCtx ? `偏好约束：${prefCtx}` : ""}
【食材库存】${ingStr || "（无）"}

每行格式（单行紧凑JSON）：
{"name":"水煮牛肉","name_en":"Sichuan Boiled Beef","device":"炒锅","time":"约30分钟","servings":"12人份","ingredients":[{"name":"牛里脊","amount":"2.5 lbs"},{"name":"郫县豆瓣酱","amount":"3 tbsp"}]}

规则：禁羊肉/鱼肉，只用库存食材，用量用美制单位，每行必须是完整合法JSON。`;

    try {
      let buf = "";
      let filledCount = 0;
      const filledNames = new Set();

      const fillSlot = (obj) => {
        if (!obj || !obj.name || filledNames.has(obj.name)) return;
        const slotIdx = emptySlots[filledCount];
        if (slotIdx === undefined) return;
        filledNames.add(obj.name);
        filledCount++;
        setDishes(prev => {
          const next = [...prev];
          next[slotIdx] = obj;
          return next;
        });
      };

      await callClaude([{ role:"user", content:prompt }], (full) => {
        buf = full;
        // Check each line for a complete dish JSON. The model sometimes wraps
        // dishes in a pretty-printed array, so tolerate a trailing comma.
        for (const line of buf.split("\n")) {
          const t = line.trim().replace(/,\s*$/, "");
          if (!t.startsWith("{") || !t.endsWith("}")) continue;
          try { fillSlot(JSON.parse(t)); } catch {}
        }
      }, 1800);

      // Fallback: if line-by-line streaming missed dishes (e.g. the model
      // returned a fenced/pretty-printed JSON array instead of one dish per
      // line), parse the full buffer once and fill any still-empty slots.
      if (filledCount < needCount) {
        const parsed = extractJSON(buf);
        const arr = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
        for (const obj of arr) fillSlot(obj);
      }

      // After dishes done, fetch prep notes (non-blocking, don't await for UX)
      const allNames = [...keepDishes.map(d=>d.name), ...Array.from(filledNames)];
      if (allNames.length > 0) {
        callClaude([{ role:"user", content:
          `针对菜肴「${allNames.join("、")}」，列出备餐前必须提前做的操作（只写：解冻/泡血水/腌制/预热烤箱），若无则返回[]。
只返回JSON数组，每条≤12字：[{"icon":"❄️","text":"牛肉提前12h解冻"}]` }],
        null, 300).then(raw => {
          const as = raw.indexOf("["), ae = raw.lastIndexOf("]");
          if (as !== -1 && ae > as) {
            try {
              const arr = JSON.parse(raw.slice(as, ae+1));
              if (Array.isArray(arr)) setPrepNotes(arr.filter(n => n.icon && n.text));
            } catch {}
          }
        }).catch(() => {});
      }

    } catch(e) {
      setMenuError(e.message);
    } finally {
      setMenuLoading(false);
      setMenuDone(true);
    }
  }, [ingStr, liked, disliked]);

  // ── Confirm dish selection
  const confirmSelection = () => {
    if (selected.size === 0) return;
    const newLiked    = [...new Set([...liked,    ...Array.from(selected)])];
    const newDisliked = [...new Set([...disliked, ...dishes.filter(d => !selected.has(d.name)).map(d => d.name)])];
    setLiked(newLiked);
    setDisliked(newDisliked);
    prefStore.liked    = newLiked;
    prefStore.disliked = newDisliked;

    if (selected.size < 3) {
      // Pass the full dish objects for kept dishes, so they can be pre-populated
      const keepDishes = dishes.filter(d => selected.has(d.name));
      generateMenu(keepDishes);
    } else {
      setStep(2);
      generateShopping();
    }
  };

  // ── Generate shopping list
  const generateShopping = useCallback(async () => {
    setShopLoading(true); setShopError(""); setShopData(null);
    try {
      const dishSummary = dishes.map(d => `${d.name}：${(d.ingredients||[]).map(i=>`${i.name} ${i.amount}`).join("、")}`).join("\n");
      const prompt = `为下周备餐生成超市采购建议，只返回JSON，不要其他文字。

【本周菜单消耗】
${dishSummary}

【当前剩余库存】
${ingStr || "（已清空）"}

\`\`\`json
{
  "store_name": "Whole Foods",
  "main_store_items": [
    {"category":"肉类","icon":"🥩","items":[{"name_cn":"牛里脊","name_en":"Beef Tenderloin","qty_display":"2.5 lbs","qty":2.5,"unit":"lb","cat":"肉类","low_stock":false}]},
    {"category":"蔬菜 & 豆制品","icon":"🥦","items":[]},
    {"category":"碳水 & 干货","icon":"🌾","items":[]},
    {"category":"调料补充","icon":"🧂","items":[{"name_cn":"郫县豆瓣酱","name_en":"Doubanjiang","qty_display":"1瓶","qty":1,"unit":"瓶","cat":"调料","low_stock":true}]}
  ],
  "asian_store_items":[{"name_cn":"花椒","name_en":"Sichuan Peppercorn","qty_display":"1包(2oz)","qty":56,"unit":"g","cat":"调料"}]
}
\`\`\`

Whole Foods有豆瓣酱；TJ's肉类实惠；特殊川渝调料去中超。推荐覆盖最广的一家。`;
      let raw = "";
      await callClaude([{ role:"user", content:prompt }], t => { raw = t; }, 3000);
      const parsed = extractJSON(raw);
      if (!parsed) throw new Error("解析失败，请重试");
      setShopData(parsed);
    } catch(e) { setShopError(e.message); }
    finally { setShopLoading(false); }
  }, [ingStr, dishes]);

  // ── Confirm purchase
  const confirmPurchase = useCallback((purchasedItems) => {
    setIngs(prev => {
      let updated = [...prev];
      let nextId = Math.max(...prev.map(r => r.id), nid) + 1;
      purchasedItems.forEach(item => {
        const name = item.name_cn, qty = parseFloat(item.qty)||1, unit = item.unit||"个", cat = item.cat||"其他";
        const idx = updated.findIndex(r => r.name.trim() === name.trim() || r.name.includes(name) || name.includes(r.name));
        if (idx !== -1) {
          const ex = updated[idx];
          updated[idx] = { ...ex, qty: String(ex.unit === unit ? parseFloat(ex.qty||0)+qty : qty), unit };
        } else { updated.push({ id: nextId++, name, qty: String(qty), unit, cat }); }
      });
      return updated;
    });
  }, [nid]);

  // ── Toggle dish selection
  const toggleDish = (name) => setSelected(prev => {
    const s = new Set(prev);
    s.has(name) ? s.delete(name) : s.add(name);
    return s;
  });

  return (
    <>
      <style>{css}</style>
      <div className="app">

        <div className="hdr">
          <div className="hdr-tag">川渝风味 · 每周备餐</div>
          <h1>备餐 <span>规划师</span></h1>
          <div className="hdr-sub">智能菜单 · 营养均衡 · 超市采购一站搞定</div>
        </div>

        <div className="steps">
          {[{l:"食材库存",i:"🥕"},{l:"菜单食谱",i:"🍳"},{l:"采购清单",i:"🛒"}].map((s,idx) => (
            <button key={idx}
              className={`step-btn ${step===idx?"active":""} ${(idx===1&&menuDone)||(idx===2&&shopData)?"done":""}`}
              onClick={() => setStep(idx)}>
              <span className="step-num">{idx+1}</span>{s.i} {s.l}
            </button>
          ))}
        </div>

        {/* ════ Step 0: Ingredients ════ */}
        {step === 0 && (
          <>
            {/* Receipt scan */}
            <div className="card">
              <div className="card-title"><span className="ico">🧾</span>拍照导入小票</div>
              <div className="upload-zone">
                <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; e.target.value = ""; scanReceipt(f); }} />
                {receiptLoading
                  ? <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                      <div className="spinner" /><div className="load-txt">正在识别小票...</div>
                    </div>
                  : <>
                      <div className="upload-icon">📷</div>
                      <div className="upload-label">点击上传超市小票照片<br/><strong>自动识别所有食材和数量</strong></div>
                    </>
                }
              </div>
              {receiptError && <div className="error">❌ {receiptError}</div>}

              {receiptItems.length > 0 && (
                <div style={{ marginTop:16 }}>
                  <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8, display:"flex", justifyContent:"space-between" }}>
                    <span>识别到 {receiptItems.length} 件商品，勾选要导入的：</span>
                    <span style={{ color:"var(--acc)", cursor:"pointer" }}
                      onClick={() => { const a={}; receiptItems.forEach((_,i)=>a[i]=true); setReceiptChecked(a); }}>全选</span>
                  </div>
                  {receiptItems.map((item, i) => (
                    <div key={i} className="receipt-item">
                      <div className={`receipt-cb ${receiptChecked[i]?"on":""}`}
                        onClick={() => setReceiptChecked(p => ({ ...p, [i]: !p[i] }))}>
                        {receiptChecked[i] && "✓"}
                      </div>
                      <div className="receipt-name">{item.name}</div>
                      <div className="receipt-qty">{item.qty} {item.unit}</div>
                      <div className="receipt-cat">
                        <select value={receiptCats[i] || item.cat || "其他"}
                          onChange={e => setReceiptCats(p => ({ ...p, [i]: e.target.value }))}>
                          {CATS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-primary" style={{ marginTop:12, width:"100%", justifyContent:"center" }}
                    onClick={importReceipt}>
                    ✅ 导入 {Object.values(receiptChecked).filter(Boolean).length} 件食材到库存
                  </button>
                </div>
              )}
            </div>

            {/* Manual pantry */}
            <div className="card">
              <div className="card-title"><span className="ico">🥕</span>手动添加食材</div>
              <table className="ing-table">
                <thead>
                  <tr>
                    {["食材名称","数量","单位","类别",""].map((h,i) => <th key={i}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {ings.map(row => (
                    <tr key={row.id}>
                      <td><input value={row.name} onChange={e=>upd(row.id,"name",e.target.value)} placeholder="鸡腿、豆瓣酱..." /></td>
                      <td><input value={row.qty}  onChange={e=>upd(row.id,"qty",e.target.value)}  type="number" min="0" step="0.1" /></td>
                      <td>
                        <select value={row.unit} onChange={e=>upd(row.id,"unit",e.target.value)}>
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td>
                        <select value={row.cat} onChange={e=>upd(row.id,"cat",e.target.value)}>
                          {CATS.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </td>
                      <td><button className="btn-del" onClick={() => removeRow(row.id)}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-add" onClick={addRow}>+ 添加一行</button>
              <hr className="divider"/>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
                <div style={{ fontSize:12, color:"var(--muted)" }}>
                  库存 <strong style={{ color:"var(--acc)" }}>{ingCount}</strong> 种食材
                </div>
                <button className="btn btn-primary" disabled={ingCount===0}
                  onClick={() => { setStep(1); generateMenu(); }}>
                  🍳 生成本周菜单 →
                </button>
              </div>
            </div>
          </>
        )}

        {/* ════ Step 1: Menu ════ */}
        {step === 1 && (
          <>
            <div className="card">
              <div className="card-title">
                <span className="ico">🍳</span>
                <span>本周菜肴</span>
                {(liked.length > 0 || disliked.length > 0) && (
                  <div style={{ marginLeft:"auto", display:"flex", gap:5, flexWrap:"wrap" }}>
                    {liked.slice(-3).map(n => <span key={n} className="pref-chip like">❤ {n}</span>)}
                    {disliked.slice(-2).map(n => <span key={n} className="pref-chip dislike">✕ {n}</span>)}
                  </div>
                )}
              </div>

              {dishes.length > 0 && (
                <div className="recipe-grid">
                  {dishes.map((d, i) =>
                    d
                      ? <FlipCard key={d.name || i} dish={d} selected={selected.has(d.name)} onSelect={() => toggleDish(d.name)} />
                      : <SkeletonCard key={`sk-${i}`} />
                  )}
                </div>
              )}

              {menuError && <div className="error">❌ {menuError}</div>}

              {menuLoading && dishes.length === 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"24px 0", justifyContent:"center" }}>
                  <div className="spinner"/><div className="load-txt">正在生成菜单...</div>
                </div>
              )}
            </div>

            {/* Prep notes */}
            {prepNotes.length > 0 && (
              <div className="card">
                <div className="card-title"><span className="ico">📋</span>备餐前注意</div>
                <div className="prep-notes">
                  {prepNotes.map((n,i) => (
                    <div key={i} className="prep-note">
                      <span style={{ fontSize:14 }}>{n.icon}</span><span>{n.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm bar — only show when all 3 dishes loaded */}
            {dishes.filter(Boolean).length === 3 && !menuLoading && (
              <div className="confirm-bar">
                <div className="confirm-bar-info">
                  <strong>已选 {selected.size} / 3 道菜</strong>
                  {selected.size > 0 && selected.size < 3 && (
                    <span style={{ color:"var(--muted)" }}>  —— 确认后将自动替换未选菜肴</span>
                  )}
                  {selected.size === 3 && (
                    <span style={{ color:"var(--green)" }}>  —— 完美！进入采购清单</span>
                  )}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ghost" onClick={() => generateMenu()} disabled={menuLoading}>🔄 全部重换</button>
                  <button className="btn btn-primary" disabled={selected.size===0 || menuLoading} onClick={confirmSelection}>
                    {selected.size === 3 ? "🛒 去采购 →" : "✓ 确认选择"}
                  </button>
                </div>
              </div>
            )}

            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => setStep(0)}>← 修改食材</button>
            </div>
          </>
        )}

        {/* ════ Step 2: Shopping ════ */}
        {step === 2 && (
          <>
            <div className="card">
              <div className="card-title"><span className="ico">🛒</span>下周采购清单</div>
              <div style={{ fontSize:12, color:"var(--muted)", marginBottom:16, padding:"8px 12px", background:"var(--surf2)", borderRadius:7, borderLeft:"3px solid var(--acc)" }}>
                基于本周菜单消耗推算，购买完成后可一键更新库存
              </div>
              {shopLoading && (
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"24px 0", justifyContent:"center" }}>
                  <div className="spinner"/><div className="load-txt">生成下周采购清单...</div>
                </div>
              )}
              {shopData && <ShoppingList data={shopData} onConfirmPurchase={(items) => { confirmPurchase(items); setStep(0); }} />}
              {shopError && <div className="error">❌ {shopError}</div>}
            </div>
            <div className="btn-row">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← 返回菜单</button>
              <button className="btn btn-ghost" onClick={generateShopping} disabled={shopLoading}>🔄 重新生成</button>
            </div>
          </>
        )}

      </div>
    </>
  );
}
