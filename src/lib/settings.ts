import { OBLIGATORY_PRAYERS, type ObligatoryPrayerKey } from "./prayer";

export const ADHAN_SOUNDS = [
  { id: "adhan_full", label: "الأذان كاملًا" },
  { id: "adhan_short", label: "أذان قصير" },
  { id: "default", label: "نغمة الإشعارات" },
  { id: "silent", label: "صامت (اهتزاز فقط)" },
] as const;

export type AdhanSound = (typeof ADHAN_SOUNDS)[number]["id"];

export const REMINDER_OPTIONS = [0, 5, 10, 15, 30] as const;
export type ReminderMinutes = (typeof REMINDER_OPTIONS)[number];

export type NotificationSettings = {
  enabled: boolean;
  sound: AdhanSound;
  prayers: Record<ObligatoryPrayerKey, boolean>;
  /** Extra heads-up notification this many minutes before each adhan; 0 disables it. */
  reminderMinutes: ReminderMinutes;
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  sound: "adhan_full",
  prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  reminderMinutes: 0,
};

export function parseNotificationSettings(raw: string | null): NotificationSettings {
  const defaults = DEFAULT_NOTIFICATION_SETTINGS;
  if (!raw) return defaults;
  try {
    const value = JSON.parse(raw);
    const prayers = { ...defaults.prayers };
    for (const { key } of OBLIGATORY_PRAYERS) {
      if (typeof value?.prayers?.[key] === "boolean") prayers[key] = value.prayers[key];
    }
    return {
      enabled: value?.enabled === true,
      sound: ADHAN_SOUNDS.some((s) => s.id === value?.sound) ? value.sound : defaults.sound,
      prayers,
      reminderMinutes: REMINDER_OPTIONS.includes(value?.reminderMinutes)
        ? value.reminderMinutes
        : defaults.reminderMinutes,
    };
  } catch {
    return defaults;
  }
}
