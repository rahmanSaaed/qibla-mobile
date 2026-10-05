import AsyncStorage from "@react-native-async-storage/async-storage";

import { parseLocation, type SavedLocation } from "./savedLocation";
import { parseNotificationSettings } from "./settings";
import { DEFAULT_METHOD, METHOD_STORAGE_KEY, isValidMethod } from "./prayer";

export const LOCATION_STORAGE_KEY = "last-location";
export const NOTIFICATION_SETTINGS_KEY = "notification-settings";

const KEYS = [LOCATION_STORAGE_KEY, METHOD_STORAGE_KEY, NOTIFICATION_SETTINGS_KEY];

const cache = new Map<string, string | null>();
const listeners = new Set<() => void>();

/** Loads persisted values into memory so screens can read them synchronously. */
export async function loadStore() {
  try {
    const entries = await AsyncStorage.multiGet(KEYS);
    for (const [key, value] of entries) cache.set(key, value);
  } catch {
    // Start with empty values; writes will still be attempted.
  }
}

export function getStoredValue(key: string) {
  return cache.get(key) ?? null;
}

export function setStoredValue(key: string, value: string) {
  cache.set(key, value);
  listeners.forEach((listener) => listener());
  AsyncStorage.setItem(key, value).catch(() => {});
}

export function subscribeStore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export type AppState = {
  location: SavedLocation | null;
  method: number;
  notifications: ReturnType<typeof parseNotificationSettings>;
};

export function parseMethod(raw: string | null) {
  const method = Number(raw);
  return raw && isValidMethod(method) ? method : DEFAULT_METHOD;
}

/** Reads straight from disk; for the widget and background tasks, which can run without the UI. */
export async function readAppState(): Promise<AppState> {
  const entries = Object.fromEntries(await AsyncStorage.multiGet(KEYS));
  return {
    location: parseLocation(entries[LOCATION_STORAGE_KEY] ?? null),
    method: parseMethod(entries[METHOD_STORAGE_KEY] ?? null),
    notifications: parseNotificationSettings(entries[NOTIFICATION_SETTINGS_KEY] ?? null),
  };
}
