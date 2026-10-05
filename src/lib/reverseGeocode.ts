import type { ReverseGeocodeResponse } from "./locations";

type NominatimReverse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
};

/** City and country names in Arabic for a GPS position, or null when offline or unavailable. */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResponse | null> {
  // ~1 km precision is enough to name the city.
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=ar" +
    `&lat=${lat.toFixed(2)}&lon=${lng.toFixed(2)}`;

  try {
    const res = await fetch(url, {
      // Nominatim's usage policy requires an identifying User-Agent.
      headers: { "User-Agent": "qibla-prayer-times-app/1.0 (android)" },
    });
    if (!res.ok) return null;
    const a = ((await res.json()) as NominatimReverse).address ?? {};
    return {
      city: a.city ?? a.town ?? a.village ?? a.county ?? a.state ?? null,
      country: a.country ?? null,
      countryCode: a.country_code ?? null,
    };
  } catch {
    return null;
  }
}
