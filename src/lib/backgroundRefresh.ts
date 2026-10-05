import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

import { refreshWidgets } from "@/widgets/widgetData";
import { reschedulePrayerNotifications } from "./notifications";

const TASK_NAME = "prayer-refresh";

/** Notifications are only scheduled a week ahead, so this keeps topping them up. */
export async function refreshPrayerData() {
  await Promise.allSettled([reschedulePrayerNotifications(), refreshWidgets()]);
}

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    await refreshPrayerData();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundRefresh() {
  if ((await BackgroundTask.getStatusAsync()) !== BackgroundTask.BackgroundTaskStatus.Available) return;
  if (await TaskManager.isTaskRegisteredAsync(TASK_NAME)) return;
  await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 12 * 60 });
}
