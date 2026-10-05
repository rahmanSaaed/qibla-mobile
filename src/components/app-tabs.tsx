import { NativeTabs } from "expo-router/unstable-native-tabs";

import { Colors, Fonts } from "@/constants/theme";

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Colors.background}
      indicatorColor={Colors.goldSoft}
      iconColor={{ default: Colors.faint, selected: Colors.gold }}
      labelStyle={{
        default: { color: Colors.faint, fontFamily: Fonts.semibold },
        selected: { color: Colors.gold, fontFamily: Fonts.bold },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>القبلة</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="location.north.circle.fill" md="explore" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="prayer-times">
        <NativeTabs.Trigger.Label>مواقيت الصلاة</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="clock.fill" md="schedule" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>الإعدادات</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
