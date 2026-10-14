// Shared helpers for the proposal screens (compare, alternatives, inspector, evidence, text).
// Everything is derived from the featured project's data so the map and the words never drift apart.

import { useSyncExternalStore } from "react";
import { COPY, EXISTING_FEATURES, F, SAMPLE_COMMENTS, WHERE, TODAY_RULES, FID_RULES, NOTICE, MATRIX_ROWS, describePlace } from "../data/featured.js";
import { distanceMeters } from "../lib/geo.js";

export { PROJECT_BASE } from "../data/featured.js";

export function useMedia(query) {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(query); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

// ——— Where things are, in words ———
export function describeWhere(f) {
  return WHERE[f.id] || describePlace(f.lngLat);
}

const BASE_KINDS = { crossing: "Crossing", control: "Traffic control", bike: "Bike route", transit: "Bus stop" };
// Projects can name their own feature kinds (a park has courts and paths, not lanes).
export const KIND_LABEL = new Proxy(BASE_KINDS, { get: (t, k) => COPY.kindLabels?.[k] ?? t[k] });

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
// "today" lines come from the featured project data; anything not recorded says so.
export function wordsFor(option) {
  return option.changes.map((change) => ({
    change,
    today: TODAY_RULES.find(([re]) => re.test(change))?.[1] ?? "Not recorded.",
    fid: FID_RULES.find(([re]) => re.test(change))?.[1] ?? null,
  }));
}

// ——— "Three things you'd notice first", per option ———
// Each points at an existing feature to inspect and a spot on the map (local metres).
export { NOTICE };
export const noticeLngLat = (n) => n.lngLat || F.toLngLat(n.xy);

// ——— Comparison matrix (relative scores, cited) ———
export { MATRIX_ROWS as MATRIX };

export const featureById = (id) => EXISTING_FEATURES.find((f) => f.id === id);
