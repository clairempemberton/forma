// Public, client-side tokens. Both are read at build time from a gitignored .env.local
// in this folder. Mapbox "pk." tokens are designed to ship to browsers: restrict them
// by URL in the Mapbox account. Never put a secret "sk." token here.

const clean = (v) => (typeof v === "string" && v.trim() && !v.includes("YOUR_") ? v.trim() : "");

export const MAPBOX_TOKEN = clean(import.meta.env.VITE_MAPBOX_ACCESS_TOKEN);

export const HAS_MAPBOX = MAPBOX_TOKEN.startsWith("pk.");

// Without a Mapbox token, Map and 3D fall back to MapLibre with OpenFreeMap vector tiles
// (no key needed). Satellite needs licensed imagery, so it shows a setup state instead.
export const ENGINE = HAS_MAPBOX ? "mapbox" : "maplibre";
