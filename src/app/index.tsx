import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { Compass, isAligned } from "@/components/Compass";
import { LocationPicker } from "@/components/LocationPicker";
import { AppText, Button, Card, Header, Screen } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useCompass } from "@/hooks/useCompass";
import { useLocation } from "@/hooks/useLocation";
import { formatNumber } from "@/lib/format";
import { distanceToKaabaKm, qiblaBearing } from "@/lib/qibla";

export default function QiblaScreen() {
  const loc = useLocation();
  const compass = useCompass();
  const { startIfPermitted, pause } = compass;

  // The magnetometer drains battery, so only listen while this tab is visible.
  useFocusEffect(
    useCallback(() => {
      startIfPermitted();
      return pause;
    }, [startIfPermitted, pause]),
  );

  const qibla = loc.location
    ? {
        bearing: qiblaBearing(loc.location.lat, loc.location.lng),
        distanceKm: distanceToKaabaKm(loc.location.lat, loc.location.lng),
      }
    : null;
  const aligned = qibla ? isAligned(qibla.bearing, compass.heading) : false;

  return (
    <Screen>
      <Header title="اتجاه القبلة" subtitle="﴿فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ﴾" />

      {!loc.location ? (
        <AppText style={styles.centered}>حدّد موقعك أو اختر مدينتك لحساب اتجاه القبلة.</AppText>
      ) : null}

      {qibla ? (
        <>
          <Compass
            bearing={qibla.bearing}
            heading={compass.heading}
            continuousHeading={compass.continuousHeading}
          />

          <AppText weight="bold" style={[styles.status, aligned && { color: Colors.success }]}>
            {compass.status === "active"
              ? aligned
                ? "أنت الآن في اتجاه القبلة"
                : "أدِر الهاتف حتى يصل رمز الكعبة إلى المؤشر"
              : "اتجاه القبلة بالنسبة للشمال الحقيقي"}
          </AppText>

          <View style={styles.stats}>
            <Card style={styles.stat}>
              <AppText style={styles.statLabel}>زاوية القبلة</AppText>
              <AppText weight="bold" style={styles.statValue}>
                {formatNumber(qibla.bearing, 1)}°
              </AppText>
            </Card>
            <Card style={styles.stat}>
              <AppText style={styles.statLabel}>المسافة إلى مكة</AppText>
              <AppText weight="bold" style={styles.statValue}>
                {formatNumber(qibla.distanceKm)} كم
              </AppText>
            </Card>
          </View>

          {compass.status !== "active" ? (
            <View style={styles.compassActions}>
              <View style={styles.row}>
                <Button title="تفعيل البوصلة" onPress={compass.start} />
              </View>
              {compass.status === "denied" ? (
                <AppText style={[styles.hint, { color: Colors.error }]}>
                  البوصلة تحتاج إذن الموقع لتحديد الشمال الحقيقي. فعّله من إعدادات الهاتف.
                </AppText>
              ) : null}
              {compass.status === "unsupported" ? (
                <AppText style={styles.hint}>
                  هاتفك لا يحتوي على حساس بوصلة. وجّه حرف «ش» إلى الشمال وستجد القبلة عند رمز الكعبة.
                </AppText>
              ) : null}
            </View>
          ) : compass.lowAccuracy ? (
            <AppText style={[styles.hint, { color: Colors.gold }]}>
              دقة البوصلة منخفضة: حرّك الهاتف في الهواء على شكل الرقم ٨ عدة مرات لمعايرتها.
            </AppText>
          ) : (
            <AppText style={styles.hint}>
              للحصول على دقة أفضل: ضع الهاتف مستويًا وابتعد عن المعادن والأجهزة الكهربائية.
            </AppText>
          )}
        </>
      ) : null}

      <LocationPicker {...loc} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    textAlign: "center",
    color: Colors.muted,
  },
  status: {
    fontSize: 18,
    textAlign: "center",
  },
  stats: {
    flexDirection: "row",
    gap: Spacing.three,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.half,
    padding: Spacing.three,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.faint,
    textAlign: "center",
  },
  statValue: {
    fontSize: 20,
    textAlign: "center",
  },
  compassActions: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: "row",
  },
  hint: {
    fontSize: 13,
    color: Colors.faint,
    textAlign: "center",
  },
});
