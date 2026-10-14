// Small geometry helpers. Proposal shapes are authored in local metres around a
// geographic origin (x east, y north) and converted to [lng, lat] for the map.

const M_PER_DEG_LAT = 111320;

export function makeFrame(origin) {
  const [lng0, lat0] = origin;
  const mPerDegLng = M_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180);
  const toLngLat = ([x, y]) => [round(lng0 + x / mPerDegLng), round(lat0 + y / M_PER_DEG_LAT)];
  const toLocal = ([lng, lat]) => [(lng - lng0) * mPerDegLng, (lat - lat0) * M_PER_DEG_LAT];
  return { origin, toLngLat, toLocal };
}

const round = (n) => Math.round(n * 1e7) / 1e7;

export function polygon(frame, points, properties = {}) {
  const ring = points.map(frame.toLngLat);
  ring.push(ring[0]);
  return { type: "Feature", properties, geometry: { type: "Polygon", coordinates: [ring] } };
}

export function rect(frame, x0, y0, x1, y1, properties) {
  return polygon(frame, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], properties);
}

export function circle(frame, cx, cy, r, properties, steps = 24) {
  const pts = Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  return polygon(frame, pts, properties);
}

export function line(frame, points, properties = {}) {
  return { type: "Feature", properties, geometry: { type: "LineString", coordinates: points.map(frame.toLngLat) } };
}

export function point(frame, xy, properties = {}) {
  return { type: "Feature", properties, geometry: { type: "Point", coordinates: frame.toLngLat(xy) } };
}

export const collection = (features) => ({ type: "FeatureCollection", features: features.flat(Infinity).filter(Boolean) });

// Mirror an L-shaped corner polygon into each quadrant: sx, sy are ±1.
export function mirror(points, sx, sy) {
  return points.map(([x, y]) => [x * sx, y * sy]);
}

export function distanceMeters(a, b) {
  if (!a || !b) return Infinity; // e.g. a location described in words
  const R = 6371008.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bboxOf(fc) {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const visit = (c) => {
    if (typeof c[0] === "number") {
      w = Math.min(w, c[0]); e = Math.max(e, c[0]); s = Math.min(s, c[1]); n = Math.max(n, c[1]);
    } else c.forEach(visit);
  };
  (fc.features || [fc]).forEach((f) => visit(f.geometry.coordinates));
  return [w, s, e, n];
}

export function centroid(feature) {
  const g = feature.geometry;
  if (g.type === "Point") return g.coordinates;
  const ring = g.type === "Polygon" ? g.coordinates[0].slice(0, -1) : g.coordinates;
  const sum = ring.reduce((a, c) => [a[0] + c[0], a[1] + c[1]], [0, 0]);
  return [sum[0] / ring.length, sum[1] / ring.length];
}

export function formatCoord([lng, lat]) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(5)}° ${ns}, ${Math.abs(lng).toFixed(5)}° ${ew}`;
}
