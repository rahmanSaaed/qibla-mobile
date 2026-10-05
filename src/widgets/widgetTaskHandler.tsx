import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { NextPrayerWidget, WIDGET_NAME } from "./NextPrayerWidget";
import { buildWidgetProps } from "./widgetData";

export async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget }: WidgetTaskHandlerProps) {
  if (widgetInfo.widgetName !== WIDGET_NAME) return;

  switch (widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      renderWidget(<NextPrayerWidget {...await buildWidgetProps()} />);
      break;
    default:
      break;
  }
}
