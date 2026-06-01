import { RECIPES } from "./recipes";

// ─── 菜名 → 菜系（按 recipes.js 中录入顺序与分段注释） ─────────────────────────
const CUISINE_BOUNDARIES = [
  ["粤菜", "菠萝咕噜肉"],
  ["湘菜", "辣椒炒肉"],
  ["江浙菜", "东坡肉"],
  ["东北菜", "锅包肉"],
  ["西北菜", "大盘鸡"],
  ["鲁菜", "焦溜肉段"],
];

export const RECIPE_CUISINE = (() => {
  const map = {};
  let cuisine = "川菜";
  let bi = 0;
  for (const name of Object.keys(RECIPES)) {
    if (bi < CUISINE_BOUNDARIES.length && name === CUISINE_BOUNDARIES[bi][1]) {
      cuisine = CUISINE_BOUNDARIES[bi][0];
      bi++;
    }
    map[name] = cuisine;
  }
  return map;
})();

const norm = (s = "") =>
  String(s)
    .replace(/[\s（）()【】\[\]{}·•・\-—_/、,，。.!！?？:：;；'"“”]/g, "")
    .toLowerCase();

const ALWAYS_AVAILABLE = new Set(["清水", "水", "白开水", "饮用水"]);

/** 同一食材的不同叫法（任一对命中即视为同一种） */
const SYNONYM_GROUPS = [
  ["猪绞肉", "猪肉末", "肉末", "三分肥七分瘦肉末"],
  ["鸡腿", "鸡腿肉", "鸡肉", "鸡块", "鸡胸", "鸡翅", "鸡丁", "童子鸡", "嫩鸡", "三黄鸡", "走地鸡", "鸡半只", "鸡大腿", "去骨鸡腿肉", "带骨鸡腿肉"],
  ["五花肉", "猪五花", "带皮五花肉", "猪五花肉", "梅头肉"],
  ["牛里脊", "牛肉", "牛里脊肉", "牛瘦肉", "牛腩", "牛腱", "牛腩块", "牛腱子肉"],
  ["猪里脊", "里脊", "猪瘦肉", "瘦肉"],
  ["排骨", "猪小排", "猪寸骨", "排骨中段", "猪脊骨", "颈骨"],
  ["豆瓣酱", "郫县豆瓣酱"],
  ["粉丝", "红薯粉丝"],
  ["黑木耳", "木耳", "泡发木耳"],
  ["青椒", "青尖椒", "螺丝椒", "杭椒", "青辣椒"],
  ["大葱", "葱白", "山东大葱白", "葱"],
  ["姜", "姜片", "姜丝", "姜块", "姜蒜"],
  ["蒜", "大蒜", "蒜末", "蒜瓣", "蒜段", "姜蒜"],
  ["鸡蛋", "蛋", "蛋清", "蛋黄", "煮熟剥壳的鹌鹑蛋", "鹌鹑蛋"],
  ["豆腐", "嫩豆腐", "老豆腐", "内酯豆腐", "豆腐干", "香干", "烟熏香干"],
  ["腊肉", "湖南腊肉", "咸肉"],
];

const AMOUNT_TAIL =
  /(\d+(\.\d+)?\s*(g|kg|ml|l|lb|oz|cup|tbsp|tsp|个|只|根|片|颗|把|束|盒|块|瓶|包|斤|两|cm|mm|°c|°f)|各\s*\d+|适量|少许|少许即可).*$/i;

const LABEL_PREFIX = /^(调料|腌肉|腌料|料汁|小料|复合料汁|底汤调料|刀口辣椒[^：:]*|配乐|蘸料|调汁|调白汁|挂糊|切片扎线|焯水|备料|腌瘦肉)[:：]\s*/;

function isAlwaysAvailable(name) {
  return ALWAYS_AVAILABLE.has(norm(name));
}

function inSynonymGroup(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  if (na.includes(nb) || nb.includes(na)) return true;
  for (const group of SYNONYM_GROUPS) {
    const hitA = group.some((g) => {
      const ng = norm(g);
      return na.includes(ng) || ng.includes(na);
    });
    const hitB = group.some((g) => {
      const ng = norm(g);
      return nb.includes(ng) || ng.includes(nb);
    });
    if (hitA && hitB) return true;
  }
  return false;
}

export function ingredientLabelMatches(ingLabel, missingName) {
  if (!ingLabel || !missingName) return false;
  const a = norm(ingLabel);
  const b = norm(missingName);
  if (a.includes(b) || b.includes(a)) return true;
  return inSynonymGroup(ingLabel, missingName);
}

export function inventoryHasIngredient(reqName, inventory) {
  if (!reqName || reqName.length < 1) return true;
  if (isAlwaysAvailable(reqName)) return true;
  const nr = norm(reqName);
  return inventory.some((inv) => {
    const ni = norm(inv.name);
    if (!ni) return false;
    if (ni.includes(nr) || nr.includes(ni)) return true;
    return inSynonymGroup(reqName, inv.name);
  });
}

function isOptionalSegment(segment) {
  return /适量|少许|可选|各少许/.test(segment);
}

function isInstructionSegment(segment) {
  return /^(片|切|备料|热锅|油炸|干煸|混合|调味|加酱|煮汁|挂霜|出锅|腌制|泡发|干煎|熬底|慢熬|啫啫)[:：]?/.test(
    segment.trim()
  );
}

function trimAmount(segment) {
  let s = segment.trim();
  s = s.replace(LABEL_PREFIX, "");
  s = s.replace(AMOUNT_TAIL, "").trim();
  return s;
}

function parseSingleName(raw) {
  if (!raw) return null;
  let s = raw.trim();
  s = s.replace(AMOUNT_TAIL, "").trim();
  const parenOr = s.match(/^(.+?)[（(]或([^）)]+)[）)]/);
  if (parenOr) {
    return { type: "or", options: [parenOr[1], parenOr[2]].map((x) => parseSingleName(x)).filter(Boolean) };
  }
  s = s.replace(/[（(][^）)]*[）)]/g, "").trim();
  if (/^葱姜/.test(s)) return { type: "and", items: ["葱", "姜"] };
  if (/姜蒜/.test(s)) return { type: "and", items: ["姜", "蒜"] };
  const m = s.match(/^([^\d\s/或、，]+)/);
  if (!m) return null;
  let name = m[1].replace(/各$/, "").trim();
  if (name.length < 1) return null;
  if (/^(少许|适量|各)$/.test(name)) return null;
  return { type: "leaf", name };
}

function parseSegment(segment) {
  if (!segment || isInstructionSegment(segment)) return null;
  let s = trimAmount(segment);
  if (!s) return null;

  if (s.includes("/")) {
    const opts = s
      .split("/")
      .map((p) => parseSingleName(trimAmount(p)))
      .filter(Boolean);
    const names = opts.flatMap((o) => (o.type === "leaf" ? [o.name] : o.type === "or" ? o.options : o.items || []));
    if (names.length) return { type: "or", options: names, optional: isOptionalSegment(segment) };
  }

  if (s.includes("或")) {
    const parts = s.split(/或/).map((p) => {
      const parsed = parseSingleName(trimAmount(p));
      if (!parsed) return null;
      if (parsed.type === "leaf") return parsed.name;
      if (parsed.type === "or") return parsed.options;
      if (parsed.type === "and") return parsed.items;
      return null;
    });
    const flat = parts.flat().filter(Boolean);
    if (flat.length) return { type: "or", options: flat, optional: isOptionalSegment(segment) };
  }

  const parsed = parseSingleName(s);
  if (!parsed) return null;
  if (parsed.type === "or") return { ...parsed, optional: isOptionalSegment(segment) };
  if (parsed.type === "and") return { ...parsed, optional: isOptionalSegment(segment) };
  return { type: "and", items: [parsed.name], optional: isOptionalSegment(segment) };
}

export function collectRequirements(recipe) {
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

export function checkRecipeAgainstInventory(recipe, inventory) {
  const groups = collectRequirements(recipe);
  const missing = [];
  for (const g of groups) {
    if (g.type === "or") {
      const ok = g.options.some((opt) => inventoryHasIngredient(opt, inventory));
      if (!ok && !g.optional) missing.push(g.options.join(" / "));
    } else {
      for (const item of g.items) {
        if (!inventoryHasIngredient(item, inventory) && !g.optional) missing.push(item);
      }
    }
  }
  return { satisfied: missing.length === 0, missing };
}

function parseRestrictions(text = "") {
  const banned = [];
  const parts = text.split(/[、,，;；\s]+/).filter(Boolean);
  for (const p of parts) {
    const m = p.match(/禁(.+)/);
    if (m) banned.push(m[1].trim());
  }
  return banned;
}

function violatesRestrictions(name, recipe, banned) {
  if (!banned.length) return false;
  const blob = norm(name + recipe.ingredients + (recipe.prep || []).join(""));
  return banned.some((b) => {
    const nb = norm(b);
    return nb && blob.includes(nb);
  });
}

function cuisineMatches(name, cuisineSetting) {
  if (!cuisineSetting || cuisineSetting === "不限" || cuisineSetting === "家常菜") return true;
  return RECIPE_CUISINE[name] === cuisineSetting;
}

function inferDevice(recipe) {
  const blob = [...(recipe.steps || []), ...(recipe.prep || []), recipe.ingredients].join("");
  if (/烤箱|烘烤|烘焙/.test(blob)) return "烤箱";
  if (/高压锅|压力锅/.test(blob)) return "高压锅";
  if (/微波炉/.test(blob)) return "微波炉";
  if (/炖|焖|煲|煮.*小时|慢炖/.test(blob)) return "炖锅";
  if (/煎|平底锅|烙/.test(blob)) return "平底锅";
  return "炒锅";
}

function inferTime(recipe) {
  const blob = (recipe.steps || []).join("");
  const hours = blob.match(/(\d+)\s*小时/);
  if (hours) return `约${hours[1]}小时`;
  if (/炖|焖|煲/.test(blob)) return "约45分钟";
  return "约30分钟";
}

/** 从菜谱字符串拆出正面展示的食材行 */
export function recipeToIngredientRows(recipe) {
  const rows = [];
  const push = (name, amount = "") => {
    const n = name.trim();
    if (n && !rows.some((r) => r.name === n)) rows.push({ name: n, amount });
  };

  const ingest = (text) => {
    if (!text) return;
    for (const seg of text.split(/[，,；;]/)) {
      const s = seg.trim();
      if (!s || isInstructionSegment(s)) continue;
      const amt = s.match(AMOUNT_TAIL);
      const label = trimAmount(s);
      if (s.includes("或") && !amt) {
        push(label || s.replace(LABEL_PREFIX, ""), "");
        continue;
      }
      const namePart = trimAmount(s);
      if (namePart) push(namePart, amt ? amt[0].trim() : "");
    }
  };

  ingest(recipe.ingredients);
  for (const line of recipe.prep || []) ingest(line);
  return rows;
}

function scoreCandidate(entry, favorites, cuisineSetting) {
  let score = 1000 - entry.missing.length * 50;
  if (entry.satisfied) score += 500;
  if (favorites.includes(entry.name)) score += 200;
  if (cuisineMatches(entry.name, cuisineSetting)) score += 80;
  score += Math.random() * 20;
  return score;
}

function pickUnique(candidates, count, favorites, cuisineSetting) {
  const sorted = [...candidates].sort(
    (a, b) => scoreCandidate(b, favorites, cuisineSetting) - scoreCandidate(a, favorites, cuisineSetting)
  );
  const picked = [];
  const used = new Set();
  for (const c of sorted) {
    if (picked.length >= count) break;
    if (used.has(c.name)) continue;
    used.add(c.name);
    picked.push(c);
  }
  return picked;
}

function toDish(entry, settings, partial) {
  return {
    name: entry.name,
    device: inferDevice(entry.recipe),
    time: inferTime(entry.recipe),
    servings: `${settings.servings}人份`,
    ingredients: recipeToIngredientRows(entry.recipe),
    inventoryComplete: !partial,
    missingIngredients: partial ? entry.missing.map((name) => ({ name })) : [],
  };
}

/**
 * 根据库存硬规则生成菜单。
 * @returns {{ dishes: object[], fallbackMode: boolean, message: string }}
 */
export function buildMenuFromInventory(inventoryRows, settings, favorites, needCount) {
  const inventory = inventoryRows.filter((r) => r.name?.trim());
  const banned = parseRestrictions(settings.restrictions);
  const cuisineSetting = settings.cuisine;

  const evaluated = Object.entries(RECIPES)
    .map(([name, recipe]) => {
      if (violatesRestrictions(name, recipe, banned)) return null;
      const { satisfied, missing } = checkRecipeAgainstInventory(recipe, inventory);
      return { name, recipe, satisfied, missing, cuisine: RECIPE_CUISINE[name] };
    })
    .filter(Boolean);

  let makeable = evaluated.filter((e) => e.satisfied);
  const cuisineFiltered = makeable.filter((e) => cuisineMatches(e.name, cuisineSetting));
  if (cuisineFiltered.length >= needCount) makeable = cuisineFiltered;
  else if (cuisineFiltered.length > 0) makeable = cuisineFiltered;

  const picked = [];
  const used = new Set();

  const addFrom = (list, partial) => {
    const chosen = pickUnique(
      list.filter((e) => !used.has(e.name)),
      needCount - picked.length,
      favorites,
      cuisineSetting
    );
    for (const e of chosen) {
      used.add(e.name);
      picked.push({ entry: e, partial });
    }
  };

  if (makeable.length > 0) {
    addFrom(makeable, false);
  }

  if (picked.length < needCount) {
    const partialPool = evaluated
      .filter((e) => !e.satisfied && !used.has(e.name))
      .sort((a, b) => a.missing.length - b.missing.length);
    addFrom(partialPool, true);
  }

  const fallbackMode = makeable.length === 0;
  const dishes = picked.map(({ entry, partial }) => toDish(entry, settings, partial));

  const message = fallbackMode
    ? "当前库存无法凑齐任何一道已收录菜谱的全部用料，以下为最接近的推荐（卡片上标注了缺少的食材）。"
    : picked.some((p) => p.partial)
      ? "部分菜品库存尚不完整，已标注缺少的食材；完整可做的菜已优先推荐。"
      : "";

  return { dishes, fallbackMode, message };
}
