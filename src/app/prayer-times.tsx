import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { LocationPicker } from "@/components/LocationPicker";
import { OptionSheet } from "@/components/OptionSheet";
import { AppText, Header, Screen } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useLocation } from "@/hooks/useLocation";
import { useStoredValue } from "@/hooks/useStoredValue";
import { formatCountdown, formatGregorianDate, formatHijriDate, formatTime } from "@/lib/format";
import { CALCULATION_METHODS, METHOD_STORAGE_KEY, PRAYERS, methodName } from "@/lib/prayer";
import { computeDay, nextPrayer } from "@/lib/prayerCalc";
import { parseMethod } from "@/lib/storage";

const methodOptions = CALCULATION_METHODS.map((m) => ({ key: String(m.id), label: m.name }));

export default function PrayerTimesScreen() {
  const loc = useLocation();
  const { location } = loc;
  const [storedMethod, setStoredMethod] = useStoredValue(METHOD_STORAGE_KEY);
  const method = parseMethod(storedMethod);
  const [methodSheetOpen, setMethodSheetOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const times = location ? computeDay(location.lat, location.lng, method, now) : null;
  const next = location ? nextPrayer(location.lat, location.lng, method, now) : null;

  return (
    <Screen>
      <Header
        title="مواقيت الصلاة"
        subtitle={`${formatHijriDate(now)}  |  ${formatGregorianDate(now)}`}
      />

      <LocationPicker {...loc} />

      {times && next ? (
        <>
          <View style={styles.nextCard}>
            <AppText style={styles.nextLabel}>الصلاة القادمة</AppText>
            <AppText weight="extrabold" style={styles.nextName}>
              {next.name}
            </AppText>
            <AppText style={styles.nextLabel}>
              بعد{" "}
              <AppText weight="bold" style={styles.countdown}>
                {formatCountdown(next.at.getTime() - now.getTime())}
              </AppText>
            </AppText>
          </View>

          <View style={styles.list}>
            {PRAYERS.map((prayer, i) => {
              const isNext = prayer.key === next.key;
              return (
                <View
                  key={prayer.key}
                  style={[styles.item, i > 0 && styles.itemBorder, isNext && styles.itemNext]}
                >
                  <AppText
                    weight="bold"
                    style={[!prayer.isPrayer && styles.dim, isNext && { color: Colors.gold }]}
                  >
                    {prayer.name}
                  </AppText>
                  <AppText weight="semibold" style={[styles.time, !prayer.isPrayer && styles.dim]}>
                    {formatTime(times[prayer.key])}
                  </AppText>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      <View style={styles.methodBlock}>
        <AppText style={styles.methodLabel}>طريقة الحساب</AppText>
        <Pressable
          accessibilityRole="button"
          onPress={() => setMethodSheetOpen(true)}
          style={({ pressed }) => [styles.select, pressed && { opacity: 0.7 }]}
        >
          <AppText>{methodName(method)}</AppText>
          <AppText style={styles.chevron}>▾</AppText>
        </Pressable>
        <AppText style={styles.note}>
          تُحسب المواقيت على الهاتف دون إنترنت، وتُعرض بتوقيت الهاتف.
        </AppText>
      </View>

      <OptionSheet
        visible={methodSheetOpen}
        title="طريقة الحساب"
        options={methodOptions}
        selectedKey={String(method)}
        onClose={() => setMethodSheetOpen(false)}
        onSelect={(key) => {
          setStoredMethod(key);
          setMethodSheetOpen(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  nextCard: {
    alignItems: "center",
    padding: Spacing.five,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    backgroundColor: Colors.goldSoft,
  },
  nextLabel: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
  },
  nextName: {
    fontSize: 32,
    lineHeight: 52,
    color: Colors.gold,
    textAlign: "center",
  },
  countdown: {
    fontSize: 18,
    color: Colors.foreground,
  },
  list: {
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
  },
  itemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
  },
  itemNext: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
  },
  dim: {
    color: Colors.faint,
  },
  time: {
    fontSize: 18,
  },
  methodBlock: {
    gap: Spacing.two,
  },
  methodLabel: {
    fontSize: 14,
    color: Colors.muted,
  },
  select: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  chevron: {
    color: Colors.faint,
  },
  note: {
    fontSize: 12,
    color: Colors.faint,
  },
});
