import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { formatMinutes } from "./format";
import { upcomingPrayers } from "./prayerCalc";
import type { AdhanSound } from "./settings";
import { readAppState } from "./storage";

const SCHEDULE_DAYS = 7;

/** Local scheduled notifications only exist in the native app, not the web preview. */
export const notificationsSupported = Platform.OS !== "web";

// Android fixes a channel's sound when it is created, so each sound gets its own
// channel. Bump the suffix if a channel's settings ever need to change.
const CHANNELS: Record<AdhanSound, { id: string; name: string; sound: string | null }> = {
  adhan_full: { id: "adhan-full-v1", name: "الأذان كاملًا", sound: "adhan_full.ogg" },
  adhan_short: { id: "adhan-short-v1", name: "أذان قصير", sound: "adhan_short.ogg" },
  default: { id: "adhan-default-v1", name: "نغمة الإشعارات", sound: "default" },
  silent: { id: "adhan-silent-v1", name: "صامت", sound: null },
};
const REMINDER_CHANNEL = { id: "prayer-reminder-v1", name: "التذكير قبل الأذان" };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureChannels() {
  if (Platform.OS !== "android") return;
  await Promise.all([
    ...Object.values(CHANNELS).map((channel) =>
      Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: "إشعار عند دخول وقت كل صلاة",
        importance: Notifications.AndroidImportance.HIGH,
        sound: channel.sound,
        enableVibrate: true,
        vibrationPattern: [0, 400, 200, 400],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      }),
    ),
    Notifications.setNotificationChannelAsync(REMINDER_CHANNEL.id, {
      name: REMINDER_CHANNEL.name,
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    }),
  ]);
}

/** Asks for notification permission (Android 13+ shows a system prompt). */
export async function requestNotificationPermission() {
  if (!notificationsSupported) return false;
  await ensureChannels();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

/** Fires a sample adhan notification a few seconds from now, to preview the chosen sound. */
export async function sendTestNotification(sound: AdhanSound) {
  if (!notificationsSupported) return;
  await ensureChannels();
  const channel = CHANNELS[sound];
  await Notifications.scheduleNotificationAsync({
    content: { title: "تجربة صوت الأذان", body: channel.name, sound: channel.sound ?? false },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      channelId: channel.id,
    },
  });
}

let pending: Promise<void> = Promise.resolve();

/**
 * Replaces all scheduled prayer notifications with fresh ones for the next week,
 * based on the saved location, calculation method and notification settings.
 */
export function reschedulePrayerNotifications() {
  pending = pending.then(scheduleAll, scheduleAll);
  return pending;
}

async function scheduleAll() {
  if (!notificationsSupported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { location, method, notifications: settings } = await readAppState();
  if (!settings.enabled || !location) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;

  await ensureChannels();
  const channel = CHANNELS[settings.sound];
  const now = new Date();
  const place = location.label ? `حسب التوقيت في ${location.label}` : undefined;

  const requests: Notifications.NotificationRequestInput[] = [];
  for (const prayer of upcomingPrayers(location.lat, location.lng, method, now, SCHEDULE_DAYS)) {
    if (!settings.prayers[prayer.key]) continue;

    requests.push({
      content: {
        title: `حان الآن موعد أذان ${prayer.name}`,
        body: place,
        sound: channel.sound ?? false,
        data: { prayer: prayer.key },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: prayer.at,
        channelId: channel.id,
      },
    });

    const reminderAt = new Date(prayer.at.getTime() - settings.reminderMinutes * 60_000);
    if (settings.reminderMinutes > 0 && reminderAt > now) {
      requests.push({
        content: {
          title: `بقي ${formatMinutes(settings.reminderMinutes)} على أذان ${prayer.name}`,
          sound: "default",
          data: { prayer: prayer.key, reminder: true },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderAt,
          channelId: REMINDER_CHANNEL.id,
        },
      });
    }
  }

  await Promise.all(requests.map((request) => Notifications.scheduleNotificationAsync(request)));
}
