// ─── Apple 同步：把采购清单导出到 iPhone 日历 (.ics) ────────────────────────────────
// 生成 .ics → iPhone Safari 下载后用「日历」打开，清单写在日程备注里。

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function flattenShopping(data) {
  if (!data) return [];
  return (data.categories || []).flatMap((cat) => cat.items || []);
}

export function shoppingLines(data) {
  return flattenShopping(data).map((it) => {
    const qty = it.qty_display || (it.qty != null ? `${it.qty}${it.unit || ""}` : "");
    return qty ? `${it.name_cn} — ${qty}` : it.name_cn;
  });
}

export function nextOccurrence(weekday, hour, minute = 0, from = new Date()) {
  const d = new Date(from);
  d.setHours(hour, minute, 0, 0);
  let diff = (weekday - d.getDay() + 7) % 7;
  if (diff === 0 && d <= from) diff = 7;
  d.setDate(d.getDate() + diff);
  return d;
}

const pad = (n) => String(n).padStart(2, "0");

const fmtLocal = (d) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

const fmtUTC = (d) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const escICS = (s) =>
  String(s)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

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

export function buildICS({ lines, start, durationMin = 60 }) {
  const end = new Date(start.getTime() + durationMin * 60000);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@meal-prep-agent`;
  const summary = "备餐采购 🛒";
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

export function downloadICS(icsText, filename = "备餐采购.ics") {
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

export { WEEKDAYS };
