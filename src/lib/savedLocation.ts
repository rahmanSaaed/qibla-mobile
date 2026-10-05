export type SavedLocation = {
  lat: number;
  lng: number;
  source: "gps" | "manual";
  label?: string;
  countryCode?: string;
};

export function parseLocation(raw: string | null): SavedLocation | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (typeof value?.lat !== "number" || typeof value?.lng !== "number") return null;
    return {
      lat: value.lat,
      lng: value.lng,
      source: value.source === "manual" ? "manual" : "gps",
      label: typeof value.label === "string" ? value.label : undefined,
      countryCode: typeof value.countryCode === "string" ? value.countryCode : undefined,
    };
  } catch {
    return null;
  }
}
