/// <reference types="node" />
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { arabicDigits, formatCountdown, formatMinutes, formatNumber, formatTime } from "../src/lib/format";
import { hijriDate } from "../src/lib/hijri";
import { computeDay, nextPrayer, upcomingPrayers } from "../src/lib/prayerCalc";
import { distanceToKaabaKm, qiblaBearing } from "../src/lib/qibla";
import { parseNotificationSettings } from "../src/lib/settings";

const CAIRO = { lat: 30.0444, lng: 31.2357 };

describe("qibla", () => {
  it("points south-east from Cairo, about 1,290 km away", () => {
    assert.ok(Math.abs(qiblaBearing(CAIRO.lat, CAIRO.lng) - 136.1) < 0.5);
    assert.ok(Math.abs(distanceToKaabaKm(CAIRO.lat, CAIRO.lng) - 1290) < 15);
  });

  it("points north-east from London", () => {
    assert.ok(Math.abs(qiblaBearing(51.5074, -0.1278) - 119) < 1);
  });
});

describe("prayer times", () => {
  it("orders the day's times", () => {
    const t = computeDay(CAIRO.lat, CAIRO.lng, 5, new Date(2026, 9, 4));
    const order = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha].map((d) => d.getTime());
    assert.deepEqual(order, [...order].sort((a, b) => a - b));
  });

  it("schedules five prayers per day, all in the future", () => {
    const from = new Date(2026, 9, 4, 0, 0);
    const list = upcomingPrayers(CAIRO.lat, CAIRO.lng, 5, from, 7);
    assert.equal(list.length, 35);
    assert.ok(list.every((p) => p.at > from));
  });

  it("rolls over to tomorrow's Fajr after Isha", () => {
    const lateNight = new Date(2026, 9, 4, 23, 59);
    const next = nextPrayer(CAIRO.lat, CAIRO.lng, 5, lateNight);
    assert.equal(next.key, "fajr");
    assert.equal(next.at.getDate(), 5);
  });

  it("delays Umm al-Qura Isha to two hours after Maghrib in Ramadan", () => {
    const ramadanDay = new Date(2027, 1, 20);
    assert.equal(hijriDate(ramadanDay).month, 9);
    const t = computeDay(21.3891, 39.8579, 4, ramadanDay);
    assert.equal(Math.round((t.isha.getTime() - t.maghrib.getTime()) / 60_000), 120);
  });
});

describe("hijri", () => {
  it("converts a known date", () => {
    // 1 Ramadan 1447 AH = 18 February 2026 (Umm al-Qura), ±1 day with the tabular fallback.
    const h = hijriDate(new Date(2026, 1, 18));
    assert.equal(h.year, 1447);
    assert.ok((h.month === 9 && h.day <= 2) || (h.month === 8 && h.day >= 29));
  });
});

describe("format", () => {
  it("uses Arabic-Indic digits", () => {
    assert.equal(arabicDigits("2026"), "٢٠٢٦");
    assert.equal(formatNumber(1290.4), "١٬٢٩٠");
    assert.equal(formatNumber(136.14, 1), "١٣٦٫١");
    assert.equal(formatCountdown(3_723_000), "٠١:٠٢:٠٣");
  });

  it("formats 12-hour times with ص/م", () => {
    assert.equal(formatTime(new Date(2026, 0, 1, 4, 5)), "٤:٠٥ ص");
    assert.equal(formatTime(new Date(2026, 0, 1, 12, 30)), "١٢:٣٠ م");
    assert.equal(formatTime(new Date(2026, 0, 1, 0, 0)), "١٢:٠٠ ص");
  });

  it("pluralises minutes the Arabic way", () => {
    assert.equal(formatMinutes(5), "٥ دقائق");
    assert.equal(formatMinutes(15), "١٥ دقيقة");
  });
});

describe("settings", () => {
  it("falls back to defaults for bad input", () => {
    const s = parseNotificationSettings('{"enabled":true,"sound":"nope","reminderMinutes":7}');
    assert.equal(s.enabled, true);
    assert.equal(s.sound, "adhan_full");
    assert.equal(s.reminderMinutes, 0);
    assert.equal(parseNotificationSettings("not json").enabled, false);
  });
});
