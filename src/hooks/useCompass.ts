import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { normalizeDegrees } from "@/lib/qibla";

export type CompassStatus = "idle" | "active" | "denied" | "unsupported";

const NO_READING_TIMEOUT_MS = 3000;

/**
 * Device heading in degrees clockwise from true north.
 * `continuousHeading` is unwrapped (it can go past 360 or below 0) so rotations
 * animate the short way instead of spinning around at north.
 * `lowAccuracy` is true when the magnetometer needs calibrating.
 */
export function useCompass() {
  const [status, setStatus] = useState<CompassStatus>("idle");
  const [heading, setHeading] = useState<number | null>(null);
  const [continuousHeading, setContinuousHeading] = useState(0);
  const [lowAccuracy, setLowAccuracy] = useState(false);
  const lastRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    if (Platform.OS === "web") {
      setStatus("unsupported");
      return;
    }
    // True north needs the location permission; without it only magnetic north is available.
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) {
      setStatus("denied");
      return;
    }

    stop();
    lastRef.current = null;

    subscriptionRef.current = await Location.watchHeadingAsync((reading) => {
      const value = reading.trueHeading >= 0 ? reading.trueHeading : reading.magHeading;
      if (!Number.isFinite(value)) return;

      const next = normalizeDegrees(value);
      if (lastRef.current !== null) {
        const delta = ((next - lastRef.current + 540) % 360) - 180;
        accumulatedRef.current += delta;
      } else {
        accumulatedRef.current = next;
      }
      lastRef.current = next;
      setHeading(next);
      setContinuousHeading(accumulatedRef.current);
      // Android reports calibration as 0–3; iOS reports an error in degrees instead.
      setLowAccuracy(Platform.OS === "android" ? reading.accuracy < 2 : reading.accuracy > 20);
      setStatus("active");
    });

    timeoutRef.current = setTimeout(() => {
      if (lastRef.current === null) {
        stop();
        setStatus("unsupported");
      }
    }, NO_READING_TIMEOUT_MS);
  }, [stop]);

  /** Starts without prompting when the permission was already granted. */
  const startIfPermitted = useCallback(async () => {
    const { granted } = await Location.getForegroundPermissionsAsync();
    if (granted) await start();
  }, [start]);

  const pause = useCallback(() => {
    stop();
    setStatus((s) => (s === "active" ? "idle" : s));
  }, [stop]);

  return { status, heading, continuousHeading, lowAccuracy, start, startIfPermitted, pause };
}
