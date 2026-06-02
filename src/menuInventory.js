import { RECIPES } from "./recipes";
import { inventoryCanonSet } from "./ingredientCanon";
import {
  buildRecipeCanonIndex,
  evaluateRecipeForInventory,
  recipeToDisplayRows,
} from "./recipeRequirements";

const RECIPE_INDEX = buildRecipeCanonIndex(RECIPES);

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

const PARTIAL_MIN_MATCHED = 2;
const PARTIAL_MIN_RATIO = 0.34;

function parseRestrictions(text = "") {
  const banned = [];
  for (const p of text.split(/[、,，;；\s]+/).filter(Boolean)) {
    const m = p.match(/禁(.+)/);
    if (m) banned.push(m[1].trim());
  }
  return banned;
}

function violatesRestrictions(name, recipe, banned) {
  if (!banned.length) return false;
  const blob = name + recipe.ingredients + (recipe.prep || []).join("");
  return banned.some((b) => b && blob.includes(b));
}

function cuisineMatches(name, cuisineSetting) {
  if (!cuisineSetting || cuisineSetting === "不限" || cuisineSetting === "家常菜") return true;
  return RECIPE_CUISINE[name] === cuisineSetting;
}

function isPartialEligible(entry) {
  return (
    !entry.satisfied &&
    entry.mainMatched &&
    entry.matchedCount >= PARTIAL_MIN_MATCHED &&
    entry.matchRatio >= PARTIAL_MIN_RATIO
  );
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

function scoreCandidate(entry, favorites, cuisineSetting) {
  let score = entry.matchedCount * 40 + entry.matchRatio * 200;
  if (entry.satisfied) score += 800;
  if (favorites.includes(entry.name)) score += 120;
  if (cuisineMatches(entry.name, cuisineSetting)) score += 60;
  score += Math.random() * 15;
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
    ingredients: recipeToDisplayRows(entry.recipe),
    inventoryComplete: !partial,
    missingIngredients: partial ? entry.missing.map((name) => ({ name })) : [],
    missingGroups: partial ? entry.missingGroups : [],
    matchRatio: entry.matchRatio,
    matchedCount: entry.matchedCount,
  };
}

/**
 * 根据规范名库存硬规则生成菜单。
 */
export function buildMenuFromInventory(inventoryRows, settings, favorites, needCount) {
  const canonSet = inventoryCanonSet(inventoryRows.filter((r) => r.name?.trim()));
  const banned = parseRestrictions(settings.restrictions);
  const cuisineSetting = settings.cuisine;

  const evaluated = Object.entries(RECIPE_INDEX)
    .map(([name, recipeEntry]) => {
      if (violatesRestrictions(name, recipeEntry.recipe, banned)) return null;
      const ev = evaluateRecipeForInventory(recipeEntry, canonSet);
      return { name, ...ev, cuisine: RECIPE_CUISINE[name] };
    })
    .filter(Boolean);

  let makeable = evaluated.filter((e) => e.satisfied);
  const cuisineFiltered = makeable.filter((e) => cuisineMatches(e.name, cuisineSetting));
  if (cuisineFiltered.length >= needCount) makeable = cuisineFiltered;
  else if (cuisineFiltered.length > 0) makeable = cuisineFiltered;

  const partialPool = evaluated
    .filter((e) => !e.satisfied && isPartialEligible(e))
    .sort((a, b) => b.matchRatio - a.matchRatio || b.matchedCount - a.matchedCount);

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

  if (makeable.length > 0) addFrom(makeable, false);
  if (picked.length < needCount && partialPool.length > 0) addFrom(partialPool, true);

  const fallbackMode = makeable.length === 0 && picked.length > 0;
  const dishes = picked.map(({ entry, partial }) => toDish(entry, settings, partial));

  let message = "";
  if (dishes.length === 0) {
    message =
      "当前库存无法匹配任何已收录菜谱。小票会先译为中文并规范为部位名（如「鸡腿」「牛腩」）；请补充常见中式食材与调料。";
  } else if (fallbackMode) {
    message =
      "库存无法完整制作任何一道菜；以下为与现有食材重叠较多、且主料已在库中的推荐（卡片标注仍缺食材）。";
  } else if (picked.some((p) => p.partial)) {
    message = "部分菜品仍缺少量调料或配菜，已在卡片标注；可完整制作的菜已优先列出。";
  }

  return { dishes, fallbackMode, message };
}

export { displayRowIsMissing } from "./recipeRequirements";
