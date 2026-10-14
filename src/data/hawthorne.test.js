import test from "node:test";
import assert from "node:assert/strict";
import { bboxOf } from "../lib/geo.js";
import { BOUNDARY, DECISION, EXISTING_FEATURES, OPTIONS, OPTION_BY_ID, SAMPLE_COMMENTS, THEME_BY_ID, THEMES, VERSIONS, REVISION_CHANGES, SOURCES, NOTICE, MATRIX_ROWS } from "./hawthorne.js";

const [bw, bs, be, bn] = bboxOf(BOUNDARY);
const inBounds = (fc) => { const [w, s, e, n] = bboxOf(fc); return w >= bw && s >= bs && e <= be && n <= bn; };

test("every option and version sits inside the project area", () => {
  for (const o of OPTIONS) assert.ok(inBounds(o.geojson), `option ${o.id} leaves the boundary`);
  for (const v of VERSIONS) assert.ok(inBounds(v.geojson), `version ${v.id} leaves the boundary`);
});

test("option ids are unique and the decision points at a real option", () => {
  assert.equal(new Set(OPTIONS.map((o) => o.id)).size, OPTIONS.length);
  assert.ok(OPTION_BY_ID[DECISION.chosen]);
});

test("every option has words and drawn features", () => {
  for (const o of OPTIONS) {
    assert.ok(o.changes.length && o.benefits.length && o.tradeoffs.length, o.id);
    assert.ok(o.geojson.features.length > 5, o.id);
    assert.ok(NOTICE[o.id]?.length === 3, `notice for ${o.id}`);
    for (const row of MATRIX_ROWS) assert.ok(row.cells[o.id], `matrix ${row.id} for ${o.id}`);
  }
});

test("features, comments and changes are placed and linked", () => {
  for (const f of EXISTING_FEATURES) assert.ok(Array.isArray(f.lngLat) && f.facts.length, f.id);
  for (const c of SAMPLE_COMMENTS) {
    assert.ok(THEME_BY_ID[c.theme], `${c.id} theme`);
    assert.ok(c.option == null || OPTION_BY_ID[c.option], `${c.id} option`);
  }
  for (const r of REVISION_CHANGES) for (const t of r.themes) assert.ok(THEME_BY_ID[t], `${r.id} theme ${t}`);
});

test("theme counts match the sample comments", () => {
  for (const t of THEMES) assert.equal(t.count, SAMPLE_COMMENTS.filter((c) => c.theme === t.id).length, t.id);
});

test("every cited source has a url", () => {
  for (const [id, s] of Object.entries(SOURCES)) assert.match(s.url, /^https:\/\//, id);
});
