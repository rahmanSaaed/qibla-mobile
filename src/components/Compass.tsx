import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, G, Line, Polygon, Rect, Text as SvgText } from "react-native-svg";

import { Colors, Fonts } from "@/constants/theme";
import { normalizeDegrees } from "@/lib/qibla";

const ALIGN_TOLERANCE_DEG = 5;

const cardinals = [
  { angle: 0, label: "ش" },
  { angle: 90, label: "ق" },
  { angle: 180, label: "ج" },
  { angle: 270, label: "غ" },
];

const ticks = Array.from({ length: 72 }, (_, i) => i * 5);

type Props = {
  bearing: number;
  heading: number | null;
  continuousHeading: number;
};

export function isAligned(bearing: number, heading: number | null) {
  if (heading === null) return false;
  const diff = Math.abs(((normalizeDegrees(bearing - heading) + 180) % 360) - 180);
  return diff <= ALIGN_TOLERANCE_DEG;
}

export function Compass({ bearing, heading, continuousHeading }: Props) {
  const aligned = isAligned(bearing, heading);
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withTiming(heading === null ? 0 : -continuousHeading, { duration: 200 });
  }, [continuousHeading, heading, rotation]);

  useEffect(() => {
    if (aligned) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [aligned]);

  const dialStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  const accent = aligned ? "#34d399" : Colors.gold;

  return (
    <View style={styles.container} accessibilityRole="image" accessibilityLabel="بوصلة القبلة">
      <Svg viewBox="0 0 200 200" style={styles.pointer}>
        <Polygon points="100,200 40,40 160,40" fill={accent} />
      </Svg>

      <Animated.View style={[styles.dial, dialStyle]}>
        <Svg viewBox="0 0 200 200" width="100%" height="100%">
          <Circle
            cx="100"
            cy="100"
            r="96"
            fill={aligned ? Colors.successDeep : "rgba(0, 0, 0, 0.25)"}
            stroke={Colors.foreground}
            strokeOpacity={0.3}
            strokeWidth={2}
          />

          {ticks.map((angle) => {
            const major = angle % 30 === 0;
            return (
              <Line
                key={angle}
                x1="100"
                y1="6"
                x2="100"
                y2={major ? 16 : 11}
                stroke={Colors.foreground}
                strokeOpacity={major ? 0.8 : 0.35}
                strokeWidth={major ? 1.5 : 1}
                transform={`rotate(${angle} 100 100)`}
              />
            );
          })}

          {cardinals.map(({ angle, label }) => (
            <SvgText
              key={angle}
              x="100"
              y="32"
              textAnchor="middle"
              fontSize="13"
              fontFamily={Fonts.bold}
              fill={angle === 0 ? Colors.north : Colors.foreground}
              transform={`rotate(${angle} 100 100)`}
            >
              {label}
            </SvgText>
          ))}

          <G transform={`rotate(${bearing} 100 100)`}>
            <Line x1="100" y1="100" x2="100" y2="52" stroke={Colors.gold} strokeWidth={3} strokeLinecap="round" />
            <G transform="translate(88 30)">
              <Rect width="24" height="24" rx="2" fill="#111" stroke={Colors.gold} strokeWidth={1} />
              <Rect y="6" width="24" height="4" fill={Colors.gold} />
            </G>
          </G>

          <Circle cx="100" cy="100" r="5" fill={Colors.gold} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 288,
    aspectRatio: 1,
    alignSelf: "center",
  },
  pointer: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    width: 24,
    height: 24,
    zIndex: 1,
  },
  dial: {
    width: "100%",
    height: "100%",
  },
});
