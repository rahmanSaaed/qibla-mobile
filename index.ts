import "expo-router/entry";
import { Platform } from "react-native";
import { registerWidgetTaskHandler } from "react-native-android-widget";

import "@/lib/backgroundRefresh";
import { widgetTaskHandler } from "@/widgets/widgetTaskHandler";

if (Platform.OS === "android") registerWidgetTaskHandler(widgetTaskHandler);
