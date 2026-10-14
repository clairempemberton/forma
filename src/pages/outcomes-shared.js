// Small helpers shared by the outcome screens (themes, revision, decision, updates).
import { THEMES } from "../data/alder.js";

export const TOTAL_COMMENTS = THEMES.reduce((n, t) => n + t.count, 0);

export const THEME_STATUS = {
  addressed: { label: "Addressed", tone: "positive" },
  partly: { label: "Partly addressed", tone: "warning" },
  open: { label: "Still open", tone: "neutral" },
};

export const CHANGE_STATUS = {
  changed: { label: "Changed", tone: "accent" },
  "not-changed": { label: "Not changed", tone: "warning" },
};

// A camera that frames a set of points: centre on their bounds, zoom so the larger
// side fits in about `px` screen pixels (Web Mercator, 512 px tiles).
export function fitCamera(points, { px = 460, min = 16.8, max = 19.6, fallback } = {}) {
  if (!points.length) return fallback;
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const [w, e, s, n] = [Math.min(...lngs), Math.max(...lngs), Math.min(...lats), Math.max(...lats)];
  const lat = (s + n) / 2;
  const mx = (e - w) * 111320 * Math.cos((lat * Math.PI) / 180);
  const my = (n - s) * 110540;
  const span = Math.max(mx, my, 12);
  const zoom = Math.log2((78271.52 * Math.cos((lat * Math.PI) / 180) * px) / span);
  return { center: [(w + e) / 2, lat], zoom: Math.max(min, Math.min(max, zoom)), bearing: 0, pitch: 0 };
}
