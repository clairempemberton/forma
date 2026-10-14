import test from "node:test";
import assert from "node:assert/strict";
import { makeFrame, distanceMeters, rect, bboxOf, centroid } from "./geo.js";

const frame = makeFrame([-122.65771, 45.51793]);

test("local metres round-trip through lng/lat", () => {
  const [x, y] = frame.toLocal(frame.toLngLat([12.5, -7.25]));
  assert.ok(Math.abs(x - 12.5) < 0.02);
  assert.ok(Math.abs(y + 7.25) < 0.02);
});

test("a 100 m offset measures 100 m on the ground", () => {
  const d = distanceMeters(frame.toLngLat([0, 0]), frame.toLngLat([100, 0]));
  assert.ok(Math.abs(d - 100) < 0.5, `got ${d}`);
});

test("rect produces a closed ring and a matching bbox", () => {
  const f = rect(frame, -1, -2, 3, 4);
  const ring = f.geometry.coordinates[0];
  assert.deepEqual(ring[0], ring[ring.length - 1]);
  const [w, s, e, n] = bboxOf({ features: [f] });
  assert.ok(w < e && s < n);
  const [cx, cy] = frame.toLocal(centroid(f));
  assert.ok(Math.abs(cx - 1) < 0.02 && Math.abs(cy - 1) < 0.02);
});
