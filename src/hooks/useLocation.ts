import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { findCountry, type City, type Country } from "@/lib/locations";
import { METHOD_STORAGE_KEY } from "@/lib/prayer";
import { reverseGeocode } from "@/lib/reverseGeocode";
import { parseLocation, type SavedLocation } from "@/lib/savedLocation";
import { getStoredValue, LOCATION_STORAGE_KEY, setStoredValue } from "@/lib/storage";
import { useStoredValue } from "./useStoredValue";

const LOCATION_TIMEOUT_MS = 15_000;

const messages = {
  denied: "تم رفض إذن الموقع. فعّله من إعدادات الهاتف، أو اختر الدولة والمدينة يدويًا.",
  unavailable: "تعذّر تحديد موقعك. تأكد من تشغيل خدمة الموقع (GPS)، أو اختر المدينة يدويًا.",
  timeout: "انتهت مهلة تحديد الموقع. حاول مرة أخرى، أو اختر المدينة يدويًا.",
};

function save(location: SavedLocation) {
  setStoredValue(LOCATION_STORAGE_KEY, JSON.stringify(location));
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

/**
 * The user's location, from GPS or a manually picked city, persisted so all
 * screens share it. GPS positions get a human-readable label via reverse geocoding.
 */
export function useLocation() {
  const [stored] = useStoredValue(LOCATION_STORAGE_KEY);
  const location = useMemo(() => parseLocation(stored), [stored]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labelRequestedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!location || location.label || location.source === "manual") return;
    const key = `${location.lat},${location.lng}`;
    if (labelRequestedFor.current === key) return;
    labelRequestedFor.current = key;

    reverseGeocode(location.lat, location.lng).then((place) => {
      if (!place) return;
      const latest = parseLocation(getStoredValue(LOCATION_STORAGE_KEY));
      if (!latest || latest.lat !== location.lat || latest.lng !== location.lng) return;

      const label = [place.city, place.country].filter(Boolean).join("، ");
      save({ ...latest, label: label || undefined, countryCode: place.countryCode ?? undefined });

      const country = findCountry(place.countryCode ?? undefined);
      if (country && !getStoredValue(METHOD_STORAGE_KEY)) {
        setStoredValue(METHOD_STORAGE_KEY, String(country.method));
      }
    });
  }, [location]);

  const request = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setError(messages.denied);
        return;
      }
      if (!(await Location.hasServicesEnabledAsync())) {
        setError(messages.unavailable);
        return;
      }
      const position = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        LOCATION_TIMEOUT_MS,
      );
      save({ lat: position.coords.latitude, lng: position.coords.longitude, source: "gps" });
    } catch (err) {
      setError(err instanceof Error && err.message === "timeout" ? messages.timeout : messages.unavailable);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectCity = useCallback((country: Country, city: City) => {
    setError(null);
    save({
      lat: city.lat,
      lng: city.lng,
      source: "manual",
      label: `${city.name}، ${country.name}`,
      countryCode: country.code,
    });
    setStoredValue(METHOD_STORAGE_KEY, String(country.method));
  }, []);

  return { location, loading, error, request, selectCity };
}
