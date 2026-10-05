import { useCallback, useSyncExternalStore } from "react";

import { getStoredValue, setStoredValue, subscribeStore } from "@/lib/storage";

/** A persisted string value that stays in sync across screens. */
export function useStoredValue(key: string) {
  const value = useSyncExternalStore(subscribeStore, () => getStoredValue(key));
  const setValue = useCallback((next: string) => setStoredValue(key, next), [key]);
  return [value, setValue] as const;
}
