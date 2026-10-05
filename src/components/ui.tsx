import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { Colors, Fonts, MaxContentWidth, Radius, Spacing } from "@/constants/theme";

type Weight = keyof typeof Fonts;

export function AppText({
  weight = "regular",
  style,
  ...rest
}: TextProps & { weight?: Weight }) {
  // "left" means "start" under RTL; without it Android aligns text to the physical left.
  return <Text style={[styles.text, { fontFamily: Fonts[weight] }, style]} {...rest} />;
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <View style={styles.screen}>
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="bg" cx="50" cy="0" r="80" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={Colors.backgroundTop} />
            <Stop offset="1" stopColor={Colors.background} />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#bg)" />
      </Svg>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      </SafeAreaView>
    </View>
  );
}

export function Header({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <View style={styles.header}>
      <AppText weight="extrabold" style={styles.title}>
        {title}
      </AppText>
      {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  variant = "primary",
  style,
  ...rest
}: PressableProps & { title: string; variant?: "primary" | "outline"; style?: StyleProp<ViewStyle> }) {
  const primary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonOutline,
        (pressed || rest.disabled) && { opacity: 0.7 },
        style,
      ]}
      {...rest}
    >
      <AppText
        weight="bold"
        style={[styles.buttonText, { color: primary ? Colors.background : Colors.foreground }]}
      >
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    color: Colors.foreground,
    textAlign: "left",
    fontSize: 16,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: MaxContentWidth,
    alignSelf: "center",
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six * 3,
    gap: Spacing.five,
  },
  header: {
    alignItems: "center",
    gap: Spacing.one,
  },
  title: {
    fontSize: 26,
    color: Colors.gold,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: "center",
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: Colors.gold,
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    fontSize: 14,
    textAlign: "center",
  },
});
