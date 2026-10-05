import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Colors, Spacing } from "@/constants/theme";
import type { useLocation } from "@/hooks/useLocation";
import { COUNTRIES, findCountry, type Country } from "@/lib/locations";
import { OptionSheet } from "./OptionSheet";
import { AppText, Button, Card } from "./ui";

type Props = ReturnType<typeof useLocation>;

const countryOptions = COUNTRIES.map((c) => ({ key: c.code, label: c.name }));

export function LocationPicker({ location, loading, error, request, selectCity }: Props) {
  const [sheet, setSheet] = useState<"country" | "city" | null>(null);
  const [country, setCountry] = useState<Country | undefined>();

  const currentLabel = loading
    ? "جارٍ تحديد موقعك..."
    : location
      ? (location.label ?? "جارٍ تحديد اسم المدينة...")
      : "لم يتم تحديد الموقع بعد";

  return (
    <Card>
      <View style={styles.current}>
        <AppText style={styles.caption}>موقعك الحالي</AppText>
        <AppText weight="bold" style={styles.label}>
          {currentLabel}
        </AppText>
        {location && !loading ? (
          <AppText style={styles.caption}>{location.source === "gps" ? "حسب GPS" : "اختيار يدوي"}</AppText>
        ) : null}
      </View>

      <View style={styles.row}>
        <Button title="استخدام موقعي الحالي" onPress={request} disabled={loading} />
        <Button title="اختيار الدولة والمدينة" variant="outline" onPress={() => setSheet("country")} />
      </View>

      {error ? <AppText style={styles.error}>{error}</AppText> : null}

      <OptionSheet
        visible={sheet === "country"}
        title="اختر الدولة"
        options={countryOptions}
        selectedKey={(country ?? findCountry(location?.countryCode))?.code}
        onClose={() => setSheet(null)}
        onSelect={(code) => {
          setCountry(findCountry(code));
          setSheet("city");
        }}
      />
      <OptionSheet
        visible={sheet === "city"}
        title={country ? `اختر المدينة في ${country.name}` : "اختر المدينة"}
        options={country?.cities.map((city, i) => ({ key: String(i), label: city.name })) ?? []}
        onClose={() => setSheet(null)}
        onSelect={(index) => {
          const city = country?.cities[Number(index)];
          if (country && city) selectCity(country, city);
          setSheet(null);
        }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  current: {
    alignItems: "center",
  },
  caption: {
    fontSize: 12,
    color: Colors.faint,
    textAlign: "center",
  },
  label: {
    fontSize: 18,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  error: {
    fontSize: 14,
    color: Colors.error,
    textAlign: "center",
  },
});
