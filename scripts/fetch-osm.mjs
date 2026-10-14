// Fetches real OpenStreetMap features around SE Alder St & SE 8th Ave, Portland, OR
// and writes them as GeoJSON for Forma's "existing conditions" layer.
// Data © OpenStreetMap contributors, ODbL. Usage: node scripts/forma/fetch-osm.mjs
import { writeFile } from "node:fs/promises";

const CENTER = { lat: 45.51793, lon: -122.65771 };
const RADIUS = 260;
const query = `[out:json][timeout:60];
(
  way["highway"](around:${RADIUS},${CENTER.lat},${CENTER.lon});
  node["highway"~"crossing|bus_stop|traffic_signals|stop"](around:${RADIUS},${CENTER.lat},${CENTER.lon});
  node["natural"="tree"](around:${RADIUS},${CENTER.lat},${CENTER.lon});
  node["public_transport"](around:${RADIUS},${CENTER.lat},${CENTER.lon});
);
out tags geom;`;

const MIRRORS = ["https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
let res;
for (const url of MIRRORS) {
  res = await fetch(url, {
    method: "POST",
    headers: { "User-Agent": "forma-prototype/1.0", "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(query),
  }).catch(() => null);
  if (res?.ok) break;
}
if (!res?.ok) throw new Error(`Overpass unavailable (${res?.status})`);
const { elements } = await res.json();

const KEEP = ["highway", "name", "lanes", "oneway", "cycleway", "cycleway:left", "cycleway:right", "sidewalk", "footway", "crossing", "crossing:markings", "maxspeed", "surface", "width", "kerb", "tactile_paving", "bus", "shelter", "bench", "route_ref", "natural", "public_transport", "service"];
const pick = (t) => Object.fromEntries(Object.entries(t || {}).filter(([k]) => KEEP.includes(k)));

const features = elements.map((e) => {
  const props = { osm: `${e.type}/${e.id}`, ...pick(e.tags) };
  if (e.type === "node") return { type: "Feature", properties: props, geometry: { type: "Point", coordinates: [e.lon, e.lat] } };
  return { type: "Feature", properties: props, geometry: { type: "LineString", coordinates: e.geometry.map((p) => [p.lon, p.lat]) } };
});

const out = {
  type: "FeatureCollection",
  metadata: { source: "OpenStreetMap via Overpass API", license: "ODbL 1.0", attribution: "© OpenStreetMap contributors", fetchedAt: new Date().toISOString(), center: [CENTER.lon, CENTER.lat], radiusMeters: RADIUS },
  features,
};
await writeFile(new URL("../src/data/osm-existing.json", import.meta.url), JSON.stringify(out));
console.log(`${features.length} features written`);
