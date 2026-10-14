// Turns a typed place ("Hawthorne", "97214", "SE 20th & Belmont") into a point in Portland,
// so the directory can sort projects by distance when no project name matches.
// Mapbox Geocoding v6 with a token; Photon (OSM data, no key) without one.

const PORTLAND_BBOX = [-122.84, 45.43, -122.47, 45.65];

export function parsePlace(body, provider) {
  const f = body?.features?.[0];
  const [lng, lat] = f?.geometry?.coordinates || [];
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const p = f.properties || {};
  const label = provider === "mapbox"
    ? p.name || p.full_address
    : p.name || [p.housenumber, p.street].filter(Boolean).join(" ");
  return { label: label || "that place", lngLat: [lng, lat] };
}

export async function geocode(q, { mapboxToken, signal } = {}) {
  const provider = mapboxToken ? "mapbox" : "photon";
  const url = new URL(provider === "mapbox" ? "https://api.mapbox.com/search/geocode/v6/forward" : "https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("bbox", PORTLAND_BBOX.join(","));
  url.searchParams.set("limit", "1");
  if (provider === "mapbox") url.searchParams.set("access_token", mapboxToken);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  return parsePlace(await res.json(), provider);
}
