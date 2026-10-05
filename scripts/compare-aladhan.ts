/// <reference types="node" />
// Compares on-device prayer times with the Aladhan API (what the web app uses)
// for the first city of every country. Run with: npm run verify:times
import { COUNTRIES } from "../src/lib/locations";
import { PRAYERS } from "../src/lib/prayer";
import { computeDay } from "../src/lib/prayerCalc";

const TOLERANCE_MIN = 2;
// Aladhan's Asr runs 2–4 min later than an exact solar-position calculation, which `adhan` matches.
const ASR_TOLERANCE_MIN = 4;

type Aladhan = {
  data: { timings: Record<string, string>; meta: { timezone: string } };
};

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(" ")[0].split(":").map(Number);
  return h * 60 + m;
}

function wallClockMinutes(date: Date, timeZone: string) {
  const [h, m] = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(date)
    .split(":")
    .map(Number);
  return h * 60 + m;
}

async function main() {
  const today = new Date();
  const apiDate = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;
  let failures = 0;

  for (const country of COUNTRIES) {
    const city = country.cities[0];
    const url = `https://api.aladhan.com/v1/timings/${apiDate}?latitude=${city.lat}&longitude=${city.lng}&method=${country.method}`;
    const { data } = (await (await fetch(url)).json()) as Aladhan;
    const ours = computeDay(city.lat, city.lng, country.method, today);

    const diffs = PRAYERS.map(({ key }) => {
      const theirs = toMinutes(
        data.timings[key[0].toUpperCase() + key.slice(1)],
      );
      let diff = wallClockMinutes(ours[key], data.meta.timezone) - theirs;
      if (diff > 720) diff -= 1440;
      if (diff < -720) diff += 1440;
      return diff;
    });
    const ok = PRAYERS.every(
      ({ key }, i) =>
        Math.abs(diffs[i]) <=
        (key === "asr" ? ASR_TOLERANCE_MIN : TOLERANCE_MIN),
    );
    if (!ok) failures++;
    console.log(
      `${ok ? "✓" : "✗"} ${country.code} method ${String(country.method).padStart(2)}  ` +
        PRAYERS.map(
          (p, i) => `${p.key} ${diffs[i] >= 0 ? "+" : ""}${diffs[i]}`,
        ).join("  "),
    );
  }

  console.log(
    failures
      ? `\n${failures} countries differ by more than ${TOLERANCE_MIN} min`
      : "\nAll within tolerance",
  );
  process.exitCode = failures ? 1 : 0;
}

main();
