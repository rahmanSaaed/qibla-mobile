import { DarkTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

import AppTabs from "@/components/app-tabs";
import { Colors } from "@/constants/theme";
import { refreshPrayerData, registerBackgroundRefresh } from "@/lib/backgroundRefresh";
import { loadStore, subscribeStore } from "@/lib/storage";

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: Colors.background, primary: Colors.gold },
};

const REFRESH_DEBOUNCE_MS = 500;

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadStore().finally(() => {
      setReady(true);
      SplashScreen.hideAsync();
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    refreshPrayerData();
    registerBackgroundRefresh().catch(() => {});

    // Location, method and notification settings all feed the schedule and the widget.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribeStore(() => {
      clearTimeout(timer);
      timer = setTimeout(refreshPrayerData, REFRESH_DEBOUNCE_MS);
    });
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshPrayerData();
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
      appState.remove();
    };
  }, [ready]);

  if (!ready) return null;

  return (
    <ThemeProvider value={theme}>
      <StatusBar style="light" />
      <AppTabs />
    </ThemeProvider>
  );
}
