/**
 * 食材规范名（canonical）词表
 *
 * 规则：
 * - 同一部位的不同形态/叫法 → 一个规范名（如「无骨鸡腿肉」「chicken thigh」→ 鸡腿）
 * - 不同部位不合并（鸡胸 ≠ 鸡腿，牛腩 ≠ 牛腱）
 * - 库存与菜谱匹配只比较规范名
 */

export const normKey = (s = "") =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]/g, "");

/** @type {{ canon: string, aliases: string[] }[]} */
export const CANON_ENTRIES = [
  { canon: "鸡腿", aliases: ["鸡腿", "鸡腿肉", "鸡大腿", "无骨鸡腿", "去骨鸡腿肉", "带骨鸡腿肉", "chicken thigh", "chicken leg", "boneless chicken thigh", "drumstick", "leg quarter", "鸡腿切小块", "带骨鸡腿"] },
  { canon: "鸡胸", aliases: ["鸡胸", "鸡胸肉", "chicken breast"] },
  { canon: "鸡翅", aliases: ["鸡翅", "chicken wing", "wings"] },
  { canon: "鸡块", aliases: ["鸡块", "走地鸡块", "鸡丁", "diced chicken", "chicken pieces"] },
  { canon: "整鸡", aliases: ["整鸡", "三黄鸡", "童子鸡", "嫩鸡", "鸡半只", "嫩鸡半只", "whole chicken", "half chicken"] },
  { canon: "牛肉", aliases: ["牛肉", "牛肉片", "牛肉块", "牛肉丝", "牛柳", "beef", "beef steak", "beef cubes", "stew beef", "sliced beef"] },
  { canon: "牛腩", aliases: ["牛腩", "牛腩块", "beef brisket", "brisket"] },
  { canon: "牛腱", aliases: ["牛腱", "牛腱子", "牛腱子肉", "beef shank", "shank"] },
  { canon: "牛里脊", aliases: ["牛里脊", "牛里脊肉", "beef tenderloin", "tenderloin"] },
  { canon: "牛瘦肉", aliases: ["牛瘦肉", "lean beef"] },
  { canon: "五花肉", aliases: ["五花肉", "猪五花", "带皮五花肉", "猪五花肉", "带皮猪五花", "去皮猪五花", "pork belly"] },
  { canon: "猪里脊", aliases: ["猪里脊", "猪里脊肉", "猪后腿瘦肉", "pork loin", "pork tenderloin"] },
  { canon: "猪瘦肉", aliases: ["猪瘦肉", "瘦肉", "lean pork", "pork lean", "猪肉丝"] },
  { canon: "猪绞肉", aliases: ["猪绞肉", "猪肉末", "肉末", "ground pork", "pork mince", "三分肥七分瘦肉末", "带点肥", "pork minced"] },
  { canon: "排骨", aliases: ["排骨", "猪小排", "猪寸骨", "排骨中段", "带骨猪大排", "猪脊骨", "颈骨", "spare ribs", "pork ribs", "pork neck bones"] },
  { canon: "梅头肉", aliases: ["梅头肉", "pork shoulder"] },
  { canon: "腊肉", aliases: ["腊肉", "湖南腊肉", "咸肉", "cured pork"] },
  { canon: "猪肉", aliases: ["猪肉", "猪五花片", "pork"] },
  { canon: "羊肉", aliases: ["羊肉", "lamb", "mutton"] },
  { canon: "鱼肉", aliases: ["鱼肉", "鱼", "fish fillet", "fish"] },
  { canon: "虾", aliases: ["虾", "虾仁", "shrimp", "prawn"] },
  { canon: "鸡蛋", aliases: ["鸡蛋", "蛋", "egg", "eggs", "全蛋液"] },
  { canon: "蛋清", aliases: ["蛋清", "egg white"] },
  { canon: "鹌鹑蛋", aliases: ["鹌鹑蛋", "煮熟剥壳的鹌鹑蛋", "quail egg"] },
  { canon: "牛奶", aliases: ["牛奶", "milk"] },
  { canon: "豆腐", aliases: ["豆腐", "嫩豆腐", "老豆腐", "内酯豆腐", "tofu", "firm tofu", "silken tofu"] },
  { canon: "香干", aliases: ["香干", "豆腐干", "烟熏香干", "干豆腐", "千张", "东北干豆腐", "dried tofu"] },
  { canon: "油面筋", aliases: ["油面筋", "无锡油面筋", "面筋", "fried gluten"] },
  { canon: "腐竹", aliases: ["腐竹", "干腐竹"] },
  { canon: "青椒", aliases: ["青椒", "青尖椒", "螺丝椒", "杭椒", "青辣椒", "青长椒", "bell pepper", "green pepper"] },
  { canon: "番茄", aliases: ["番茄", "西红柿", "tomato", "tomatoes"] },
  { canon: "土豆", aliases: ["土豆", "黄土豆", "马铃薯", "potato", "potatoes"] },
  { canon: "胡萝卜", aliases: ["胡萝卜", "carrot", "carrots"] },
  { canon: "黄瓜", aliases: ["黄瓜", "cucumber"] },
  { canon: "大白菜", aliases: ["大白菜", "白菜", "napa cabbage", "cabbage"] },
  { canon: "包菜", aliases: ["包菜", "卷心菜", "cabbage head"] },
  { canon: "芹菜", aliases: ["芹菜", "西芹", "celery"] },
  { canon: "洋葱", aliases: ["洋葱", "onion"] },
  { canon: "大葱", aliases: ["大葱", "葱白", "山东大葱白", "葱", "葱结", "green onion", "scallion"] },
  { canon: "蒜", aliases: ["蒜", "大蒜", "蒜末", "蒜蓉", "蒜瓣", "蒜段", "蒜头", "garlic"] },
  { canon: "姜", aliases: ["姜", "姜片", "姜丝", "姜块", "ginger"] },
  { canon: "茄子", aliases: ["茄子", "长茄子", "eggplant"] },
  { canon: "豆角", aliases: ["豆角", "green beans", "long beans"] },
  { canon: "西兰花", aliases: ["西兰花", "芥兰", "broccoli"] },
  { canon: "木耳", aliases: ["木耳", "黑木耳", "泡发木耳", "wood ear", "black fungus"] },
  { canon: "香菇", aliases: ["香菇", "干香菇", "shiitake"] },
  { canon: "蘑菇", aliases: ["蘑菇", "东北榛蘑", "mushroom"] },
  { canon: "豆芽", aliases: ["豆芽", "bean sprouts"] },
  { canon: "藕", aliases: ["藕", "马蹄", "lotus root"] },
  { canon: "芋头", aliases: ["芋头", "荔浦芋头", "taro"] },
  { canon: "萝卜", aliases: ["萝卜", "白萝卜", "radish", "daikon"] },
  { canon: "菠萝", aliases: ["菠萝", "pineapple"] },
  { canon: "雪菜", aliases: ["雪菜", "雪里蕻"] },
  { canon: "酸菜", aliases: ["酸菜", "东北酸菜", "pickled cabbage"] },
  { canon: "外婆菜", aliases: ["外婆菜", "袋装外婆菜"] },
  { canon: "酸豆角", aliases: ["酸豆角", "pickled long beans"] },
  { canon: "烟笋", aliases: ["烟笋", "水发烟笋", "bamboo shoots"] },
  { canon: "蒜苔", aliases: ["蒜苔", "garlic scapes"] },
  { canon: "上海青", aliases: ["上海青", "青菜", "bok choy"] },
  { canon: "荷叶", aliases: ["荷叶", "干荷叶", "lotus leaf"] },
  { canon: "面粉", aliases: ["面粉", "all purpose flour", "all-purpose flour", "wheat flour", "plain flour", "flour"] },
  { canon: "意面", aliases: ["意面", "意大利面", "pasta", "spaghetti", "noodles", "面条", "面"] },
  { canon: "粉丝", aliases: ["粉丝", "红薯粉丝", "红薯细粉", "vermicelli", "glass noodles"] },
  { canon: "粉条", aliases: ["粉条", "红薯宽粉", "sweet potato noodles"] },
  { canon: "糯米", aliases: ["糯米", "glutinous rice"] },
  { canon: "米饭", aliases: ["米饭", "大米", "rice"] },
  { canon: "盐", aliases: ["盐", "salt", "sea salt"] },
  { canon: "糖", aliases: ["糖", "白糖", "冰糖", "sugar", "white sugar"] },
  { canon: "生抽", aliases: ["生抽", "酱油", "light soy sauce", "soy sauce"] },
  { canon: "老抽", aliases: ["老抽", "dark soy sauce"] },
  { canon: "料酒", aliases: ["料酒", "黄酒", "米酒", "cooking wine", "shaoxing wine", "rice wine"] },
  { canon: "醋", aliases: ["醋", "陈醋", "香醋", "vinegar", "rice vinegar"] },
  { canon: "豆瓣酱", aliases: ["豆瓣酱", "郫县豆瓣酱", "doubanjiang", "chili bean paste"] },
  { canon: "豆豉", aliases: ["豆豉", "干豆豉", "fermented black beans"] },
  { canon: "干辣椒", aliases: ["干辣椒", "辣椒", "干辣椒段", "dried chili", "chili pepper"] },
  { canon: "花椒", aliases: ["花椒", "鲜花椒", "sichuan peppercorn", "peppercorn"] },
  { canon: "胡椒", aliases: ["胡椒", "黑胡椒", "black pepper", "pepper"] },
  { canon: "玉米淀粉", aliases: ["玉米淀粉", "淀粉", "生粉", "cornstarch", "starch"] },
  { canon: "食用油", aliases: ["油", "食用油", "植物油", "vegetable oil", "cooking oil", "olive oil"] },
  { canon: "香油", aliases: ["香油", "芝麻油", "sesame oil"] },
  { canon: "甜面酱", aliases: ["甜面酱", "sweet bean sauce"] },
  { canon: "番茄沙司", aliases: ["番茄沙司", "ketchup", "tomato sauce"] },
  { canon: "花生", aliases: ["花生", "花生米", "peanut", "peanuts"] },
  { canon: "芝麻", aliases: ["芝麻", "白芝麻", "sesame"] },
  { canon: "孜然", aliases: ["孜然", "cumin"] },
  { canon: "八角", aliases: ["八角", "star anise"] },
  { canon: "桂皮", aliases: ["桂皮", "cinnamon stick"] },
  { canon: "香叶", aliases: ["香叶", "bay leaf"] },
  { canon: "大料", aliases: ["大料", "八角桂皮香叶"] },
  { canon: "泡椒", aliases: ["泡椒", "泡野山椒", "泡山椒", "pickled chili"] },
  { canon: "剁椒", aliases: ["剁椒", "湖南剁椒酱", "chopped chili"] },
  { canon: "辣椒油", aliases: ["辣椒油", "红油", "chili oil"] },
  { canon: "香糟卤", aliases: ["香糟卤", "糟卤"] },
  { canon: "啤酒", aliases: ["啤酒", "beer"] },
  { canon: "清水", aliases: ["清水", "水", "water"] },
  { canon: "高汤", aliases: ["高汤", "broth", "stock"] },
  { canon: "板栗", aliases: ["板栗", "去壳熟板栗", "去壳生板栗", "chestnut"] },
  { canon: "梅菜", aliases: ["梅菜", "甜梅菜"] },
  { canon: "萝卜干", aliases: ["萝卜干", "萧山萝卜干"] },
  { canon: "香菜", aliases: ["香菜", "cilantro", "coriander"] },
  { canon: "小米辣", aliases: ["小米辣", "thai chili"] },
  { canon: "野山椒", aliases: ["野山椒", "wild pepper"] },
  { canon: "面包糠", aliases: ["面包糠", "breadcrumbs"] },
  { canon: "黄油", aliases: ["黄油", "butter"] },
  { canon: "麦芽糖", aliases: ["麦芽糖", "maltose", "蜂蜜"] },
];

export const RECIPE_AMBIGUOUS_OR = {
  鸡肉: ["鸡腿", "鸡胸", "鸡翅", "鸡块", "整鸡"],
  猪肉: ["五花肉", "猪里脊", "猪瘦肉", "猪绞肉", "排骨", "梅头肉", "腊肉", "猪肉"],
};

export const ALWAYS_AVAILABLE = new Set(["清水", "水", "高汤"]);

const ALIAS_INDEX = (() => {
  const rows = [];
  for (const { canon, aliases } of CANON_ENTRIES) {
    for (const a of [canon, ...aliases]) {
      const key = normKey(a);
      if (key) rows.push({ key, canon, len: key.length });
    }
  }
  rows.sort((a, b) => b.len - a.len);
  return rows;
})();

const CANON_SET = new Set(CANON_ENTRIES.map((e) => e.canon));

export function canonicalize(name) {
  const raw = normKey(name);
  if (!raw) return null;
  for (const { key, canon } of ALIAS_INDEX) {
    if (raw === key) return canon;
    if (key.length >= 2 && raw.includes(key)) return canon;
    if (raw.length >= 2 && key.includes(raw)) return canon;
  }
  return null;
}

export function normalizeInventoryName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "";
  return canonicalize(trimmed) || trimmed;
}

export function inventoryCanonSet(inventoryRows) {
  const set = new Set();
  for (const row of inventoryRows) {
    const n = row.name?.trim();
    if (!n) continue;
    set.add(canonicalize(n) || n);
  }
  return set;
}

export function inventoryHasCanon(canonName, canonSet) {
  if (!canonName) return false;
  if (ALWAYS_AVAILABLE.has(canonName)) return true;
  return canonSet.has(canonName);
}

export function expandAmbiguousOr(label) {
  const key = normKey(label);
  for (const [ambiguous, options] of Object.entries(RECIPE_AMBIGUOUS_OR)) {
    if (normKey(ambiguous) === key) return options;
  }
  return null;
}
