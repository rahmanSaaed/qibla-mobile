import { getLocales } from "expo-localization";
import { FlexWidget, TextWidget } from "react-native-android-widget";

import { formatHijriDate, formatTime } from "@/lib/format";
import { OBLIGATORY_PRAYERS, type ObligatoryPrayerKey } from "@/lib/prayer";
import type { DayTimes } from "@/lib/prayerCalc";

export const WIDGET_NAME = "NextPrayer";

const GOLD = "#d4af37";
const CREAM = "#f5f1e3";
const MUTED = "#c9c4b2";

export type NextPrayerWidgetProps =
  | {
      ready: true;
      label: string;
      date: Date;
      times: DayTimes;
      next: { key: ObligatoryPrayerKey; name: string; at: Date };
    }
  | { ready: false };

export function NextPrayerWidget(props: NextPrayerWidgetProps) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      accessibilityLabel="مواقيت الصلاة"
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundGradient: { from: "#14573f", to: "#0b3d2e", orientation: "TOP_BOTTOM" },
        borderRadius: 20,
        padding: 12,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {props.ready ? <Content {...props} /> : <Empty />}
    </FlexWidget>
  );
}

function Empty() {
  return (
    <FlexWidget
      style={{ height: "match_parent", width: "match_parent", justifyContent: "center", alignItems: "center" }}
    >
      <TextWidget
        text="افتح التطبيق وحدّد موقعك لعرض مواقيت الصلاة"
        style={{ color: CREAM, fontSize: 14, fontFamily: "Cairo_600SemiBold", textAlign: "center" }}
      />
    </FlexWidget>
  );
}

function Content({ label, date, times, next }: Extract<NextPrayerWidgetProps, { ready: true }>) {
  // Widgets lay out in the device's direction, not the app's forced RTL; keep Fajr on the right.
  const prayers =
    getLocales()[0]?.textDirection === "rtl" ? OBLIGATORY_PRAYERS : [...OBLIGATORY_PRAYERS].reverse();

  return (
    <>
      <FlexWidget style={{ width: "match_parent", flexDirection: "column", alignItems: "center" }}>
        <TextWidget
          text={`${next.name}  ${formatTime(next.at)}`}
          style={{ color: GOLD, fontSize: 22, fontFamily: "Cairo_800ExtraBold" }}
        />
        <TextWidget
          text={`${label} · ${formatHijriDate(date, false)}`}
          maxLines={1}
          truncate="END"
          style={{ color: MUTED, fontSize: 11, fontFamily: "Cairo_400Regular" }}
        />
      </FlexWidget>

      <FlexWidget style={{ width: "match_parent", flexDirection: "row", justifyContent: "space-between" }}>
        {prayers.map((prayer) => {
          const isNext = prayer.key === next.key;
          return (
            <FlexWidget
              key={prayer.key}
              style={{
                flex: 1,
                flexDirection: "column",
                alignItems: "center",
                borderRadius: 10,
                paddingVertical: 4,
                backgroundColor: isNext ? "rgba(212, 175, 55, 0.2)" : "rgba(0, 0, 0, 0)",
              }}
            >
              <TextWidget
                text={prayer.name}
                style={{ color: isNext ? GOLD : CREAM, fontSize: 12, fontFamily: "Cairo_700Bold" }}
              />
              <TextWidget
                text={formatTime(times[prayer.key])}
                style={{ color: isNext ? GOLD : MUTED, fontSize: 11, fontFamily: "Cairo_600SemiBold" }}
              />
            </FlexWidget>
          );
        })}
      </FlexWidget>
    </>
  );
}
