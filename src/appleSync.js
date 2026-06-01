// ─── Apple 同步：把采购清单导出到 iPhone 日历 (.ics) 与提醒事项 (快捷指令) ──────────
// 网页没有权限直接写入 iOS 的「日历」「提醒事项」，所以走两座标准桥：
//   1) 生成符合 RFC 5545 的 .ics 文件 → iPhone Safari 下载后用「日历」打开，
//      自动创建「去 xx 超市购物」日程，清单写在日程备注里。
//   2) 生成 shortcuts:// 深链 → 触发用户预先配置好的「快捷指令」，
//      把清单逐行拆成可逐项打勾的「提醒事项」。
// 两者都无需后端、无需登录、完全离线可用。

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

// 把采购数据拍平成单层 item 数组（主超市分区 + 中超分区）
export function flattenShopping(data) {
  if (!data) return [];
  const out = [];
  (data.main_store_items || []).forEach((cat) =>
    (cat.items || []).forEach((it) => out.push(it))
  );
  (data.asian_store_items || []).forEach((it) => out.push(it));
  return out;
}

// 每项格式化为「中文名 — 数量」一行
export function shoppingLines(data) {
  return flattenShopping(data).map((it) => {
    const qty = it.qty_display || (it.qty != null ? `${it.qty}${it.unit || ""}` : "");
    return qty ? `${it.name_cn} — ${qty}` : it.name_cn;
  });
}

// 计算「下一个指定星期几 + 时间」的 Date（若今天就是该星期几但时间已过，则顺延到下周）
export function nextOccurrence(weekday, hour, minute = 0, from = new Date()) {
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);
  let diff = (weekday - d.getDay() + 7) % 7;
  if (diff === 0 && d <= from) diff = 7;
  d.setDate(d.getDate() + diff);
  return d;
}

const pad = (n) => String(n).padStart(2, "0");

// 浮动本地时间（不带时区，按设备本地时间解释，最贴合「每周六10点」的直觉）
const fmtLocal = (d) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

const fmtUTC = (d) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

// RFC 5545 文本转义：反斜杠 / 分号 / 逗号 / 换行
const escICS = (s) =>
  String(s)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

// 行折叠：单行超过 73 字符时按规范折行（续行以空格开头）
function foldLine(line) {
  if (line.length <= 73) return line;
  const chunks = [];
  let rest = line;
  chunks.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length) {
    chunks.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  return chunks.join("\r\n");
}

// 生成 .ics 文本：一条「去 xx 超市购物」事件，清单写入备注，提前 1 小时提醒
export function buildICS({ storeName, lines, start, durationMin = 60 }) {
  const end = new Date(start.getTime() + durationMin * 60000);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@meal-prep-agent`;
  const summary = `去${storeName || "超市"}购物 🛒`;
  const desc =
    `本周备餐采购清单（共 ${lines.length} 项）：\n\n` +
    lines.map((l) => `• ${l}`).join("\n");

  const rows = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meal Prep Agent//Shopping List//CN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${fmtUTC(new Date())}`,
    `DTSTART:${fmtLocal(start)}`,
    `DTEND:${fmtLocal(end)}`,
    `SUMMARY:${escICS(summary)}`,
    `DESCRIPTION:${escICS(desc)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escICS(summary)}`,
    "TRIGGER:-PT60M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return rows.map(foldLine).join("\r\n");
}

// 触发浏览器下载 .ics（iPhone Safari 会提示用「日历」打开）
export function downloadICS(icsText, filename = "shopping.ics") {
  const blob = new Blob([icsText], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// 生成触发快捷指令的深链。input=text 时，清单整段作为快捷指令输入文本传入。
export function buildShortcutURL(shortcutName, inputText) {
  return `shortcuts://run-shortcut?name=${encodeURIComponent(
    shortcutName
  )}&input=text&text=${encodeURIComponent(inputText)}`;
}

export { WEEKDAYS };
