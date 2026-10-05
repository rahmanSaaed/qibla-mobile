import { Platform } from "react-native";
import { requestWidgetUpdate } from "react-native-android-widget";

import { computeDay, nextPrayer } from "@/lib/prayerCalc";
import { readAppState } from "@/lib/storage";
import { NextPrayerWidget, WIDGET_NAME, type NextPrayerWidgetProps } from "./NextPrayerWidget";

export async function buildWidgetProps(now = new Date()): Promise<NextPrayerWidgetProps> {
  const { location, method } = await readAppState();
  if (!location) return { ready: false };

  const next = nextPrayer(location.lat, location.lng, method, now);
  // After Isha, show tomorrow's table so the highlighted Fajr time is the one that's coming.
  const day = next ? next.at : now;
  return {
    ready: true,
    label: location.label ?? "موقعك",
    date: day,
    times: computeDay(location.lat, location.lng, method, day),
    next,
  };
}

export async function refreshWidgets() {
  if (Platform.OS !== "android") return;
  const props = await buildWidgetProps();
  await requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: () => <NextPrayerWidget {...props} />,
  });
}
