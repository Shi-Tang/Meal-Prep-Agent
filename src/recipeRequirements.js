/**
 * 从 recipes.js 的 ingredients / prep 解析「规范用料需求」。
 * 菜谱原文保留用于展示；匹配只走 canonical。
 */
import {
  ALWAYS_AVAILABLE,
  canonicalize,
  expandAmbiguousOr,
  inventoryHasCanon,
  normKey,
} from "./ingredientCanon";

const AMOUNT_TAIL =
  /(\d+(\.\d+)?\s*(g|kg|ml|l|lb|oz|cup|tbsp|tsp|个|只|根|片|颗|把|束|盒|块|瓶|包|斤|两|cm|mm|°c|°f|罐)|各\s*\d+|适量|少许|少许即可).*$/i;

const LABEL_PREFIX = /^(调料|腌肉|腌料|料汁|小料|复合料汁|底汤调料|刀口辣椒[^：:]*|配乐|蘸料|调汁|调白汁|挂糊|切片扎线|焯水|备料|腌瘦肉|宫保汁|鱼香汁)[:：]\s*/;

const JUNK = /^(抓匀|混合|搅匀|腌制|泡发|切片|切块|备用|传统|片|切|备料|牙签约)/;

function trimAmount(segment) {
  let s = segment.trim();
  s = s.replace(LABEL_PREFIX, "");
  s = s.replace(AMOUNT_TAIL, "").trim();
  return s;
}

function toCanonOrRaw(label) {
  const trimmed = trimAmount(label);
  if (!trimmed || JUNK.test(trimmed)) return null;

  const ambiguous = expandAmbiguousOr(trimmed);
  if (ambiguous) return { type: "or", options: ambiguous };

  const c = canonicalize(trimmed);
  if (c) return { type: "leaf", canon: c };

  const parts = trimmed.split(/[/或]/).map((p) => trimAmount(p)).filter(Boolean);
  if (parts.length > 1) {
    const opts = [];
    for (const p of parts) {
      const amb = expandAmbiguousOr(p);
      if (amb) opts.push(...amb);
      else {
        const cp = canonicalize(p);
        if (cp) opts.push(cp);
      }
    }
    const uniq = [...new Set(opts)];
    if (uniq.length) return { type: "or", options: uniq };
  }

  return null;
}

function parseSegment(segment) {
  if (!segment?.trim()) return null;
  const s = trimAmount(segment);
  if (!s) return null;
  const optional = /适量|少许|可选|各少许|各\s*\d/.test(segment);

  if (/^葱姜蒜/.test(s)) return { type: "and", items: ["大葱", "姜", "蒜"], optional };
  if (/^姜蒜/.test(s)) return { type: "and", items: ["姜", "蒜"], optional };
  if (/^葱姜/.test(s)) return { type: "and", items: ["大葱", "姜"], optional };

  if (s.includes("/") || s.includes("或")) {
    const parts = s.split(/[/或]/).map((p) => trimAmount(p)).filter(Boolean);
    const opts = [];
    for (const p of parts) {
      const node = toCanonOrRaw(p);
      if (!node) continue;
      if (node.type === "or") opts.push(...node.options);
      else opts.push(node.canon);
    }
    const uniq = [...new Set(opts)];
    if (uniq.length) return { type: "or", options: uniq, optional };
  }

  const node = toCanonOrRaw(s);
  if (!node) return null;
  if (node.type === "or") return { type: "or", options: node.options, optional };
  return { type: "and", items: [node.canon], optional };
}

export function collectCanonRequirements(recipe) {
  const groups = [];
  const texts = [recipe.ingredients, ...(recipe.prep || [])];
  for (const text of texts) {
    if (!text) continue;
    for (const seg of text.split(/[，,；;]/)) {
      const g = parseSegment(seg.trim());
      if (g) groups.push(g);
    }
  }
  return groups;
}

export function getMainCanons(recipe) {
  const first = recipe.ingredients?.split(/[，,]/)?.[0]?.trim();
  if (!first) return [];
  const g = parseSegment(first);
  if (!g) return [];
  if (g.type === "or") return g.options;
  return g.items || [];
}

export function evaluateCanonRequirements(groups, canonSet) {
  const missing = [];
  const missingLabels = [];
  let requiredCount = 0;
  let matchedCount = 0;

  for (const g of groups) {
    if (g.optional) continue;
    if (g.type === "or") {
      requiredCount++;
      const ok = g.options.some((c) => inventoryHasCanon(c, canonSet));
      if (ok) matchedCount++;
      else {
        missing.push(g.options);
        missingLabels.push(g.options.join(" / "));
      }
    } else {
      for (const canon of g.items) {
        if (!canon || ALWAYS_AVAILABLE.has(canon)) continue;
        requiredCount++;
        if (inventoryHasCanon(canon, canonSet)) matchedCount++;
        else {
          missing.push([canon]);
          missingLabels.push(canon);
        }
      }
    }
  }

  if (requiredCount === 0) {
    return {
      satisfied: false,
      missing: missingLabels,
      missingGroups: missing,
      matchedCount: 0,
      requiredCount: 0,
      matchRatio: 0,
    };
  }

  return {
    satisfied: missingLabels.length === 0,
    missing: missingLabels,
    missingGroups: missing,
    matchedCount,
    requiredCount,
    matchRatio: matchedCount / requiredCount,
  };
}

export function buildRecipeCanonIndex(recipes) {
  const index = {};
  for (const [name, recipe] of Object.entries(recipes)) {
    index[name] = {
      groups: collectCanonRequirements(recipe),
      mains: getMainCanons(recipe),
      recipe,
    };
  }
  return index;
}

export function evaluateRecipeForInventory(recipeEntry, canonSet) {
  const { groups, mains, recipe } = recipeEntry;
  const ev = evaluateCanonRequirements(groups, canonSet);
  const mainMatched = mains.length === 0 || mains.some((c) => inventoryHasCanon(c, canonSet));
  return { ...ev, mainMatched, recipe };
}

export function recipeToDisplayRows(recipe) {
  const rows = [];
  const push = (name, amount = "") => {
    const n = name.trim();
    if (n && !rows.some((r) => r.name === n)) rows.push({ name: n, amount });
  };
  const ingest = (text) => {
    if (!text) return;
    for (const seg of text.split(/[，,；;]/)) {
      const s = seg.trim();
      if (!s) continue;
      const amt = s.match(AMOUNT_TAIL);
      const namePart = trimAmount(s);
      if (namePart) push(namePart, amt ? amt[0].trim() : "");
    }
  };
  ingest(recipe.ingredients);
  for (const line of recipe.prep || []) ingest(line);
  return rows;
}

export function displayRowIsMissing(displayName, missingGroups) {
  const canon = canonicalize(displayName);
  if (canon) return missingGroups.some((g) => g.includes(canon));
  const nk = normKey(displayName);
  return missingGroups.some((g) =>
    g.some((m) => {
      const nm = normKey(m);
      return nm.includes(nk) || nk.includes(nm);
    })
  );
}
