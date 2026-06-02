/**
 * 采购清单：由 Step 2 菜单卡片上的缺料（missingGroups）聚合，不调用 AI。
 * 只输出商品清单，不推荐超市。
 */
import { ALWAYS_AVAILABLE } from "./ingredientCanon";

const SPICE_CANONS = new Set([
  "豆瓣酱", "花椒", "干辣椒", "豆豉", "泡椒", "剁椒", "香糟卤", "野山椒", "小米辣", "辣椒油",
]);

const MEAT_CANONS = new Set([
  "鸡腿", "鸡胸", "鸡翅", "鸡块", "整鸡", "牛肉", "牛腩", "牛腱", "牛里脊", "牛瘦肉",
  "五花肉", "猪里脊", "猪瘦肉", "猪绞肉", "排骨", "梅头肉", "腊肉", "猪肉", "羊肉", "鱼肉", "虾",
]);

const VEG_CANONS = new Set([
  "青椒", "番茄", "土豆", "胡萝卜", "黄瓜", "大白菜", "包菜", "芹菜", "洋葱", "大葱", "蒜", "姜",
  "茄子", "豆角", "西兰花", "木耳", "香菇", "蘑菇", "豆芽", "藕", "芋头", "萝卜", "菠萝",
  "雪菜", "酸菜", "外婆菜", "酸豆角", "烟笋", "蒜苔", "上海青", "荷叶", "豆腐", "香干", "油面筋", "腐竹", "香菜",
]);

const CARB_CANONS = new Set(["面粉", "意面", "粉丝", "粉条", "糯米", "米饭"]);

const DAIRY_EGG_CANONS = new Set(["鸡蛋", "蛋清", "鹌鹑蛋", "牛奶", "黄油"]);

const CANON_EN = {
  鸡腿: "Chicken Thigh", 鸡胸: "Chicken Breast", 牛腩: "Beef Brisket", 牛里脊: "Beef Tenderloin",
  五花肉: "Pork Belly", 猪里脊: "Pork Loin", 豆瓣酱: "Doubanjiang", 花椒: "Sichuan Peppercorn",
  干辣椒: "Dried Chili", 生抽: "Soy Sauce", 料酒: "Cooking Wine", 花生: "Peanuts",
};

const SECTIONS = [
  { key: "肉类", icon: "🥩", category: "肉类" },
  { key: "蔬菜", icon: "🥦", category: "蔬菜 & 豆制品" },
  { key: "碳水", icon: "🌾", category: "碳水 & 干货" },
  { key: "蛋奶", icon: "🥚", category: "蛋奶" },
  { key: "调料", icon: "🧂", category: "调料" },
  { key: "其他", icon: "📦", category: "其他" },
];

const CAT_LABEL = { 肉类: "肉类", 蔬菜: "蔬菜", 碳水: "碳水", 蛋奶: "蛋奶", 调料: "调料", 其他: "其他" };

function canonSection(canon) {
  if (MEAT_CANONS.has(canon)) return "肉类";
  if (VEG_CANONS.has(canon)) return "蔬菜";
  if (CARB_CANONS.has(canon)) return "碳水";
  if (DAIRY_EGG_CANONS.has(canon)) return "蛋奶";
  if (SPICE_CANONS.has(canon) || /酱|醋|油|盐|糖|淀粉|孜然|八角|桂皮|香叶|大料|啤酒|麦芽|面包糠|芝麻|胡椒|番茄沙司|甜面/.test(canon)) {
    return "调料";
  }
  return "其他";
}

function groupKey(group) {
  return group.slice().sort().join("|");
}

/** 从已确认菜单聚合缺料（规范名） */
export function collectMissingFromDishes(dishes) {
  const map = new Map();

  for (const dish of dishes.filter(Boolean)) {
    if (dish.inventoryComplete !== false) continue;
    for (const group of dish.missingGroups || []) {
      const filtered = group.filter((c) => c && !ALWAYS_AVAILABLE.has(c));
      if (!filtered.length) continue;

      const key = groupKey(filtered);
      if (!map.has(key)) {
        map.set(key, {
          canons: filtered,
          label: filtered.length === 1 ? filtered[0] : filtered.join(" / "),
          shop_canon: filtered[0],
          dishes: new Set(),
        });
      }
      map.get(key).dishes.add(dish.name);
    }
  }

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "zh"));
}

function toShopItem(entry) {
  const primary = entry.canons[0];
  const sec = canonSection(primary);
  return {
    name_cn: entry.label,
    name_en: entry.canons.map((c) => CANON_EN[c]).filter(Boolean).join(" / ") || undefined,
    qty_display: entry.canons.length > 1 ? "任选其一" : "1 份",
    qty: 1,
    unit: "份",
    cat: CAT_LABEL[sec] || "其他",
    shop_canon: entry.shop_canon,
    for_dishes: [...entry.dishes].join("、"),
    low_stock: false,
  };
}

/**
 * @param {object[]} dishes Step 2 确认后的菜单（含 missingGroups / inventoryComplete）
 */
export function buildShoppingFromDishes(dishes) {
  const missing = collectMissingFromDishes(dishes);

  if (missing.length === 0) {
    const allComplete = dishes.filter(Boolean).every((d) => d.inventoryComplete !== false);
    return {
      categories: [],
      emptyMessage: allComplete
        ? "本周菜单所需食材已在库存中，无需额外采购。"
        : "当前菜单未标注缺料项；请返回重新生成菜单，或先在库存中补充食材。",
    };
  }

  const buckets = Object.fromEntries(SECTIONS.map((s) => [s.key, []]));
  for (const entry of missing) {
    const sec = canonSection(entry.canons[0]);
    buckets[sec]?.push(toShopItem(entry));
  }

  const categories = SECTIONS.map((s) => ({
    category: s.category,
    icon: s.icon,
    items: buckets[s.key] || [],
  })).filter((cat) => cat.items.length > 0);

  return { categories, emptyMessage: null };
}
