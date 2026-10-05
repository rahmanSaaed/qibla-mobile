export const HIJRI_MONTHS = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
] as const;

export type HijriDate = { day: number; month: number; year: number; monthName: string };

let umalquraFormat: Intl.DateTimeFormat | null | undefined;

function getUmalquraFormat() {
  if (umalquraFormat !== undefined) return umalquraFormat;
  try {
    umalquraFormat = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  } catch {
    umalquraFormat = null;
  }
  return umalquraFormat;
}

function fromIntl(date: Date): Omit<HijriDate, "monthName"> | null {
  const format = getUmalquraFormat();
  if (!format) return null;
  try {
    const parts = format.formatToParts(date);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const day = get("day");
    const month = get("month");
    const year = get("year") || get("relatedYear");
    // Engines without Islamic calendar data silently fall back to Gregorian.
    if (!(day >= 1 && day <= 30 && month >= 1 && month <= 12 && year > 1300 && year < 1700)) {
      return null;
    }
    return { day, month, year };
  } catch {
    return null;
  }
}

const ISLAMIC_EPOCH = 1948439.5;

function gregorianToJd(year: number, month: number, day: number) {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
}

function islamicToJd(year: number, month: number, day: number) {
  return (
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    ISLAMIC_EPOCH -
    1
  );
}

/** Tabular (arithmetic) Islamic calendar; can differ from Umm al-Qura by a day. */
function tabular(date: Date): Omit<HijriDate, "monthName"> {
  const jd = gregorianToJd(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const year = Math.floor((30 * (jd - ISLAMIC_EPOCH) + 10646) / 10631);
  const month = Math.min(12, Math.ceil((jd - (29 + islamicToJd(year, 1, 1))) / 29.5) + 1);
  const day = jd - islamicToJd(year, month, 1) + 1;
  return { day, month, year };
}

export function hijriDate(date: Date): HijriDate {
  const value = fromIntl(date) ?? tabular(date);
  return { ...value, monthName: HIJRI_MONTHS[value.month - 1] };
}
