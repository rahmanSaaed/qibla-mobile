import { requireOptionalNativeModule } from "expo";

type ExactAlarmModule = {
  canScheduleExactAlarms(): boolean;
  openExactAlarmSettings(): void;
};

// Only exists in Android builds; null on iOS, web and Expo Go.
const ExactAlarm = requireOptionalNativeModule<ExactAlarmModule>("ExactAlarm");

/** Whether notifications fire on the minute. Without this, Android may delay them to save battery. */
export function canScheduleExactAlarms() {
  return ExactAlarm?.canScheduleExactAlarms() ?? true;
}

/** Opens the system "Alarms & reminders" page for this app. */
export function openExactAlarmSettings() {
  ExactAlarm?.openExactAlarmSettings();
}
