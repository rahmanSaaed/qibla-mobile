import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  HighLatitudeRule,
  PrayerTimes,
} from "adhan";

import { hijriDate } from "./hijri";
import { OBLIGATORY_PRAYERS, PRAYERS, type ObligatoryPrayerKey, type PrayerKey } from "./prayer";

export type DayTimes = Record<PrayerKey, Date>;
export type UpcomingPrayer = { key: ObligatoryPrayerKey; name: string; at: Date };

type Adjustments = Partial<CalculationParameters["methodAdjustments"]>;

const custom =
  (fajrAngle: number, ishaAngle: number, ishaInterval = 0, adjustments: Adjustments = {}) =>
  () => {
    const params = new CalculationParameters("Other", fajrAngle, ishaAngle, ishaInterval);
    params.methodAdjustments = { ...params.methodAdjustments, ...adjustments };
    return params;
  };

const withoutAdjustments = (preset: () => CalculationParameters) => () => {
  const params = preset();
  params.methodAdjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
  return params;
};

/**
 * Keyed by the Aladhan method IDs in `CALCULATION_METHODS`, so stored settings carry over
 * from the web app. Angles and offsets follow Aladhan so both apps show the same times;
 * check with `npm run verify:times`.
 */
const METHOD_PARAMS: Record<number, () => CalculationParameters> = {
  1: CalculationMethod.Karachi,
  2: CalculationMethod.NorthAmerica,
  3: CalculationMethod.MuslimWorldLeague,
  4: CalculationMethod.UmmAlQura,
  5: CalculationMethod.Egyptian,
  8: custom(19.5, 0, 90),
  9: CalculationMethod.Kuwait,
  10: CalculationMethod.Qatar,
  11: CalculationMethod.Singapore,
  12: custom(12, 12),
  13: CalculationMethod.Turkey,
  14: custom(16, 15),
  15: withoutAdjustments(CalculationMethod.MoonsightingCommittee),
  16: CalculationMethod.Dubai,
  17: custom(20, 18),
  18: custom(18, 18),
  19: custom(18, 17),
  20: custom(20, 18),
  21: custom(19, 17, 0, { dhuhr: 5, maghrib: 5 }),
  22: custom(18, 0, 77),
  23: custom(18, 18, 0, { maghrib: 5 }),
};

const RAMADAN = 9;

function parametersFor(method: number, date: Date) {
  const params = (METHOD_PARAMS[method] ?? CalculationMethod.Egyptian)();
  params.highLatitudeRule = HighLatitudeRule.TwilightAngle;
  // Umm al-Qura moves Isha to two hours after Maghrib during Ramadan.
  if (method === 4 && hijriDate(date).month === RAMADAN) params.ishaInterval = 120;
  return params;
}

/** Prayer times for the calendar day of `date` (device-local) at the given coordinates. */
export function computeDay(lat: number, lng: number, method: number, date: Date): DayTimes {
  const coordinates = new Coordinates(lat, lng);
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const times = new PrayerTimes(coordinates, day, parametersFor(method, day));
  return {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };
}

/** Obligatory prayers from `from` onwards, covering `days` calendar days. */
export function upcomingPrayers(
  lat: number,
  lng: number,
  method: number,
  from: Date,
  days: number,
): UpcomingPrayer[] {
  const result: UpcomingPrayer[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const times = computeDay(lat, lng, method, date);
    for (const prayer of OBLIGATORY_PRAYERS) {
      const at = times[prayer.key];
      if (at > from) result.push({ key: prayer.key, name: prayer.name, at });
    }
  }
  return result;
}

export function nextPrayer(lat: number, lng: number, method: number, now: Date) {
  return upcomingPrayers(lat, lng, method, now, 2)[0];
}

export function prayerName(key: PrayerKey) {
  return PRAYERS.find((p) => p.key === key)?.name ?? "";
}
