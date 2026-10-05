import { useEffect, useState } from "react";
import { AppState, Linking, Platform, Pressable, StyleSheet, Switch, View } from "react-native";
import { requestPinWidget } from "react-native-android-widget";

import { canScheduleExactAlarms, openExactAlarmSettings } from "../../modules/exact-alarm";

import { AppText, Button, Card, Header, Screen } from "@/components/ui";
import { Colors, Radius, Spacing } from "@/constants/theme";
import { useStoredValue } from "@/hooks/useStoredValue";
import { formatMinutes } from "@/lib/format";
import {
  notificationsSupported,
  requestNotificationPermission,
  sendTestNotification,
} from "@/lib/notifications";
import { OBLIGATORY_PRAYERS } from "@/lib/prayer";
import {
  ADHAN_SOUNDS,
  REMINDER_OPTIONS,
  parseNotificationSettings,
  type NotificationSettings,
} from "@/lib/settings";
import { NOTIFICATION_SETTINGS_KEY } from "@/lib/storage";
import { WIDGET_NAME } from "@/widgets/NextPrayerWidget";

const switchColors = {
  trackColor: { false: "rgba(255, 255, 255, 0.2)", true: Colors.goldBorder },
  thumbColor: Colors.gold,
};

export default function SettingsScreen() {
  const [raw, setRaw] = useStoredValue(NOTIFICATION_SETTINGS_KEY);
  const settings = parseNotificationSettings(raw);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [widgetMessage, setWidgetMessage] = useState<string | null>(null);
  const [exactAlarms, setExactAlarms] = useState(canScheduleExactAlarms);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") setExactAlarms(canScheduleExactAlarms());
    });
    return () => subscription.remove();
  }, []);

  const update = (patch: Partial<NotificationSettings>) => setRaw(JSON.stringify({ ...settings, ...patch }));

  const toggleEnabled = async (enabled: boolean) => {
    if (!enabled) {
      update({ enabled: false });
      return;
    }
    const granted = await requestNotificationPermission();
    setPermissionDenied(!granted);
    if (granted) update({ enabled: true });
  };

  const addWidget = async () => {
    const accepted = await requestPinWidget({ widgetName: WIDGET_NAME }).catch(() => false);
    setWidgetMessage(
      accepted
        ? null
        : "اضغط مطولًا على مساحة فارغة في الشاشة الرئيسية، ثم اختر «الأدوات» وابحث عن «القبلة».",
    );
  };

  if (!notificationsSupported) {
    return (
      <Screen>
        <Header title="الإعدادات" subtitle="الأذان والتنبيهات" />
        <Card>
          <AppText style={styles.caption}>
            إشعارات الأذان وأداة الشاشة الرئيسية متاحة في تطبيق أندرويد فقط.
          </AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="الإعدادات" subtitle="الأذان والتنبيهات" />

      <Card>
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <AppText weight="bold">إشعار الأذان</AppText>
            <AppText style={styles.caption}>تنبيه بصوت الأذان عند دخول وقت كل صلاة</AppText>
          </View>
          <Switch value={settings.enabled} onValueChange={toggleEnabled} {...switchColors} />
        </View>
        {permissionDenied ? (
          <View style={styles.block}>
            <AppText style={styles.error}>
              الإشعارات غير مسموح بها. فعّلها للتطبيق من إعدادات الهاتف.
            </AppText>
            <View style={styles.row}>
              <Button title="فتح إعدادات التطبيق" variant="outline" onPress={() => Linking.openSettings()} />
            </View>
          </View>
        ) : null}
        {settings.enabled && !exactAlarms ? (
          <View style={styles.block}>
            <AppText style={styles.error}>
              قد يتأخر الأذان عدة دقائق. اسمح للتطبيق بـ«المنبّهات والتذكيرات» ليصل في وقته تمامًا.
            </AppText>
            <View style={styles.row}>
              <Button title="السماح بالمنبّهات" variant="outline" onPress={openExactAlarmSettings} />
            </View>
          </View>
        ) : null}
      </Card>

      <View style={[styles.block, !settings.enabled && styles.disabled]}>
        <AppText weight="bold" style={styles.sectionTitle}>
          صوت الأذان
        </AppText>
        <Card style={styles.list}>
          {ADHAN_SOUNDS.map((sound, i) => {
            const selected = settings.sound === sound.id;
            return (
              <Pressable
                key={sound.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => update({ sound: sound.id })}
                style={[styles.option, i > 0 && styles.optionBorder]}
              >
                <View style={[styles.radio, selected && styles.radioSelected]} />
                <AppText weight={selected ? "bold" : "regular"} style={styles.optionLabel}>
                  {sound.label}
                </AppText>
              </Pressable>
            );
          })}
        </Card>
        <View style={styles.row}>
          <Button title="تجربة الصوت" variant="outline" onPress={() => sendTestNotification(settings.sound)} />
        </View>

        <AppText weight="bold" style={styles.sectionTitle}>
          الصلوات
        </AppText>
        <Card style={styles.list}>
          {OBLIGATORY_PRAYERS.map((prayer, i) => (
            <View key={prayer.key} style={[styles.option, i > 0 && styles.optionBorder]}>
              <AppText style={styles.optionLabel}>{prayer.name}</AppText>
              <Switch
                value={settings.prayers[prayer.key]}
                onValueChange={(on) => update({ prayers: { ...settings.prayers, [prayer.key]: on } })}
                {...switchColors}
              />
            </View>
          ))}
        </Card>

        <AppText weight="bold" style={styles.sectionTitle}>
          تذكير قبل الأذان
        </AppText>
        <View style={styles.chips}>
          {REMINDER_OPTIONS.map((minutes) => {
            const selected = settings.reminderMinutes === minutes;
            return (
              <Pressable
                key={minutes}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => update({ reminderMinutes: minutes })}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <AppText weight="bold" style={[styles.chipText, selected && { color: Colors.background }]}>
                  {minutes === 0 ? "بدون" : formatMinutes(minutes)}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <AppText style={styles.caption}>
          إذا تأخّر الإشعار أو لم يظهر: أوقف «تحسين البطارية» للتطبيق من إعدادات الهاتف.
        </AppText>
        <View style={styles.row}>
          <Button title="فتح إعدادات التطبيق" variant="outline" onPress={() => Linking.openSettings()} />
        </View>
      </View>

      {Platform.OS === "android" ? (
        <Card>
          <AppText weight="bold">أداة الشاشة الرئيسية</AppText>
          <AppText style={styles.caption}>اعرض الصلاة القادمة ومواقيت اليوم على الشاشة الرئيسية.</AppText>
          <View style={styles.row}>
            <Button title="إضافة الأداة" onPress={addWidget} />
          </View>
          {widgetMessage ? <AppText style={styles.caption}>{widgetMessage}</AppText> : null}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: Spacing.three,
  },
  disabled: {
    opacity: 0.4,
    pointerEvents: "none",
  },
  row: {
    flexDirection: "row",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  switchText: {
    flex: 1,
  },
  caption: {
    fontSize: 13,
    color: Colors.faint,
  },
  error: {
    fontSize: 14,
    color: Colors.error,
  },
  sectionTitle: {
    color: Colors.gold,
    marginTop: Spacing.two,
  },
  list: {
    padding: 0,
    gap: 0,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    minHeight: 52,
  },
  optionBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
  },
  optionLabel: {
    flex: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  radioSelected: {
    borderColor: Colors.gold,
    backgroundColor: Colors.gold,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  chipSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  chipText: {
    fontSize: 14,
  },
});
