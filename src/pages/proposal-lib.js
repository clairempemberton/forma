// Shared helpers for the proposal screens (compare, alternatives, inspector, evidence, text).
// Everything is derived from data/alder.js so the map and the words never drift apart.

import { useSyncExternalStore } from "react";
import { EXISTING_FEATURES, F, OPTIONS, SAMPLE_COMMENTS } from "../data/alder.js";
import { distanceMeters } from "../lib/geo.js";

export const PROJECT_BASE = "/projects/alder-8th";

export function useMedia(query) {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(query); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// ——— Where things are, in words ———
const WHERE = {
  "X-01": "North side of the corner, crossing 8th Ave",
  "X-02": "West side of the corner, crossing Alder St",
  "X-03": "South side of the corner, crossing 8th Ave",
  "X-04": "East side of the corner, crossing Alder St",
  "S-01": "On both Alder St approaches to the corner",
  "B-01": "Along Alder St, west of the corner toward 7th Ave",
  "T-01": "Southeast of the corner, on SE Morrison St near 9th Ave",
};
const DIRS = ["east", "northeast", "north", "northwest", "west", "southwest", "south", "southeast"];
export function describeWhere(f) {
  if (WHERE[f.id]) return WHERE[f.id];
  const [x, y] = F.toLocal(f.lngLat);
  const d = Math.hypot(x, y);
  if (d < 4) return "At the centre of the corner";
  const dir = DIRS[Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360 / 45) % 8];
  return `About ${Math.max(5, Math.round(d / 5) * 5)} m ${dir} of the corner`;
}

export const KIND_LABEL = { crossing: "Crossing", control: "Traffic control", bike: "Bike route", transit: "Bus stop" };

// ——— Distance from a point to any GeoJSON geometry, in metres ———
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
function inside(p, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}
export function distanceTo(lngLat, feature) {
  const g = feature.geometry;
  if (g.type === "Point") return distanceMeters(lngLat, g.coordinates);
  const p = F.toLocal(lngLat);
  const pts = (g.type === "Polygon" ? g.coordinates[0] : g.coordinates).map(F.toLocal);
  if (g.type === "Polygon" && inside(p, pts)) return 0;
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) best = Math.min(best, segDist(p, pts[i - 1], pts[i]));
  return best;
}

// Labelled proposal elements within r metres of a point, grouped by label.
export function changesNear(option, lngLat, r = 15) {
  const groups = new Map();
  for (const f of option.geojson.features) {
    const label = f.properties?.label;
    if (!label) continue;
    if (distanceTo(lngLat, f) > r) continue;
    const g = groups.get(label) || { label, kind: f.properties.kind, ids: [], count: 0 };
    g.count += 1;
    if (f.properties.id) g.ids.push(f.properties.id);
    groups.set(label, g);
  }
  return [...groups.values()];
}

export const commentsNear = (lngLat, r = 15) =>
  SAMPLE_COMMENTS.map((c) => ({ ...c, dist: distanceMeters(lngLat, c.lngLat) })).filter((c) => c.dist <= r).sort((a, b) => a.dist - b.dist);

// ——— Today vs proposed, for each change an option makes ———
// "today" lines come from OSM facts in data/alder.js; anything OSM doesn't record says so.
const TODAY_RULES = [
  [/curb extension/i, "No curb extensions. Crossings are about 10 m curb to curb (estimate)."],
  [/raised crossing/i, "Unmarked crossings at road level (OSM)."],
  [/curb ramp/i, "Ramp type is not recorded in OSM."],
  [/tree/i, "Street trees as they are; none added."],
  [/bench/i, "Benches at the corner are not recorded in OSM."],
  [/bike crossing/i, "No bike markings through the corner (OSM)."],
  [/bike lane/i, "No bike facility mapped on Alder (OSM)."],
  [/traffic circle/i, "Two-way stop: Alder stops, 8th Ave does not (OSM)."],
  [/shelter/i, "Bus stop with a bench and no shelter (OSM)."],
  [/loading/i, "Deliveries load at the curb on 8th Ave."],
];
const FID_RULES = [
  [/curb extension|raised crossing/i, "X-01"],
  [/curb ramp/i, "X-02"],
  [/bike/i, "B-01"],
  [/traffic circle/i, "S-01"],
  [/shelter|bus/i, "T-01"],
];
export function wordsFor(option) {
  return option.changes.map((change) => ({
    change,
    today: TODAY_RULES.find(([re]) => re.test(change))?.[1] ?? "Not recorded in OSM.",
    fid: FID_RULES.find(([re]) => re.test(change))?.[1] ?? null,
  }));
}

// ——— "Three things you'd notice first", per option ———
// Each points at an existing feature to inspect and a spot on the map (local metres).
export const NOTICE = {
  A: [
    { title: "Every crossing gets shorter", body: "Curb extensions on all four corners take each crossing from about 10 m to about 6 m (estimate).", fid: "X-01", xy: [0, 8.5] },
    { title: "Crossings raised to sidewalk height", body: "All four crossings become speed tables, so drivers slow at every leg, not just on Alder.", fid: "X-03", xy: [0, -8] },
    { title: "Eight new street trees", body: "More shade on the north sidewalk, plus two benches on the northeast corner.", fid: null, xy: [16, 7] },
  ],
  B: [
    { title: "Protected bike lanes on Alder", body: "A separated lane each way, connecting to the painted bike lanes on 7th Ave one block west.", fid: "B-01", xy: [-26, -4] },
    { title: "A mini traffic circle", body: "Turns slow from every direction. Large vehicles have to drive around it.", fid: "S-01", xy: [0, 0] },
    { title: "Alder crossings stay long", body: "8th Ave gets raised crossings, but crossing Alder stays about 10 m (estimate).", fid: "X-02", xy: [-8, 0] },
  ],
  C: [
    { title: "Shorter, raised crossings of 8th", body: "Curb extensions on two corners, and both crossings of 8th raised to sidewalk height.", fid: "X-01", xy: [0, 8.5] },
    { title: "An eastbound protected bike lane", body: "On the south side of Alder. Westbound riders still share the lane with cars.", fid: "B-01", xy: [22, -4] },
    { title: "A shelter at the Morrison stop", body: "The SE Morrison & 9th stop has a bench and no shelter today (OSM). Option C adds one.", fid: "T-01", lngLat: [-122.6565854, 45.5173274] },
  ],
};
export const noticeLngLat = (n) => n.lngLat || F.toLngLat(n.xy);

// ——— Comparison matrix (relative, illustrative) ———
const countTrees = (o) => o.geojson.features.filter((f) => f.properties.kind === "tree-new").length;
export const MATRIX = [
  { id: "crossing", label: "Crossing length", truth: "estimate", cells: {
    A: { score: 3, text: "About 6 m on every leg" },
    B: { score: 1, text: "About 10 m; 8th raised" },
    C: { score: 2, text: "About 8 m, one side extended" } } },
  { id: "bike", label: "Bike connection", cells: {
    A: { score: 1, text: "None; bikes share the lane" },
    B: { score: 3, text: "Both ways, links to 7th Ave" },
    C: { score: 2, text: "Eastbound only" } } },
  { id: "curb", label: "Parking & loading", cells: {
    A: { score: 2, text: "About 6 spaces removed" },
    B: { score: 1, text: "Most Alder parking removed" },
    C: { score: 3, text: "Some removed; loading kept" } } },
  { id: "trees", label: "New trees", cells: Object.fromEntries(OPTIONS.map((o) => {
    const n = countTrees(o);
    return [o.id, { score: n >= 8 ? 3 : n >= 4 ? 2 : 1, text: `${n} new trees` }];
  })) },
  { id: "transit", label: "Transit", cells: {
    A: { score: 1, text: "No change at the stop" },
    B: { score: 1, text: "No change at the stop" },
    C: { score: 3, text: "Shelter at Morrison & 9th" } } },
];

export const featureById = (id) => EXISTING_FEATURES.find((f) => f.id === id);
