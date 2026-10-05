import { hijriDate } from "./hijri";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const GREGORIAN_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

// Formatting by hand keeps output identical to the web app's "ar-EG" Intl output
// without depending on how much locale data the device's JS engine ships.
export function arabicDigits(value: string | number) {
  return String(value).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatNumber(value: number, maxFractionDigits = 0) {
  const [int, frac] = (Math.round(value * 10 ** maxFractionDigits) / 10 ** maxFractionDigits)
    .toFixed(maxFractionDigits)
    .split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
  const trimmed = frac?.replace(/0+$/, "");
  return arabicDigits(trimmed ? `${grouped}٫${trimmed}` : grouped);
}

export function formatTime(date: Date) {
  const h = date.getHours();
  const hour12 = h % 12 || 12;
  return `${arabicDigits(hour12)}:${arabicDigits(pad2(date.getMinutes()))} ${h < 12 ? "ص" : "م"}`;
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return arabicDigits(`${pad2(h)}:${pad2(m)}:${pad2(s)}`);
}

/** "٥ دقائق" / "١٥ دقيقة": Arabic uses the plural only for 3–10. */
export function formatMinutes(n: number) {
  return `${arabicDigits(n)} ${n >= 3 && n <= 10 ? "دقائق" : "دقيقة"}`;
}

export function formatGregorianDate(date: Date) {
  return `${arabicDigits(date.getDate())} ${GREGORIAN_MONTHS[date.getMonth()]} ${arabicDigits(date.getFullYear())}`;
}

export function formatHijriDate(date: Date, withWeekday = true) {
  const h = hijriDate(date);
  const text = `${arabicDigits(h.day)} ${h.monthName} ${arabicDigits(h.year)} هـ`;
  return withWeekday ? `${WEEKDAYS[date.getDay()]} ${text}` : text;
}
