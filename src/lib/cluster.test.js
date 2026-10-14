import test from "node:test";
import assert from "node:assert/strict";
import { clusterPoints } from "./cluster.js";

const project = ([x, y]) => [x, y]; // identity: treat lngLat as pixels

test("nearby points merge, distant points stay separate", () => {
  const pts = [
    { id: "a", lngLat: [0, 0] },
    { id: "b", lngLat: [10, 10] },
    { id: "c", lngLat: [200, 0] },
  ];
  const out = clusterPoints(pts, project, 40);
  assert.equal(out.length, 2);
  assert.equal(out[0].count, 2);
  assert.equal(out[0].id, "cluster:a,b");
  assert.deepEqual(out[0].lngLat, [5, 5]);
  assert.equal(out[1].id, "c");
});

test("cluster id does not depend on input order", () => {
  const a = { id: "a", lngLat: [0, 0] };
  const b = { id: "b", lngLat: [5, 0] };
  assert.equal(clusterPoints([a, b], project)[0].id, clusterPoints([b, a], project)[0].id);
});
