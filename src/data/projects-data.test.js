import test from "node:test";
import assert from "node:assert/strict";
import { bboxOf } from "../lib/geo.js";
import * as hawthorne from "./hawthorne.js";
import * as creston from "./creston-skatepark.js";
import * as fx82 from "./82nd-ave-fx.js";

// Every fully built project must satisfy the same contract the shared screens rely on.
for (const m of [hawthorne, creston, fx82]) {
  const { BOUNDARY, DECISION, EXISTING_FEATURES, OPTIONS, OPTION_BY_ID, SAMPLE_COMMENTS, THEME_BY_ID, THEMES, VERSIONS, REVISION_CHANGES, SOURCES, NOTICE, MATRIX_ROWS, STORY, TIMELINE, SURVEY, COPY, PROJECT, inProjectArea } = m;
  const id = PROJECT.id;
  const [bw, bs, be, bn] = bboxOf(BOUNDARY);
  const inBounds = (fc) => { const [w, s, e, n] = bboxOf(fc); return w >= bw && s >= bs && e <= be && n <= bn; };

  test(`${id}: every option and version sits inside the project area`, () => {
    for (const o of OPTIONS) assert.ok(inBounds(o.geojson), `option ${o.id} leaves the boundary`);
    for (const v of VERSIONS) assert.ok(inBounds(v.geojson), `version ${v.id} leaves the boundary`);
  });

  test(`${id}: option ids are unique and the decision points at a real option and version`, () => {
    assert.equal(new Set(OPTIONS.map((o) => o.id)).size, OPTIONS.length);
    assert.ok(OPTION_BY_ID[DECISION.chosen]);
    assert.ok(VERSIONS.find((v) => v.id === DECISION.version));
    assert.ok(DECISION.why.length && DECISION.headline && DECISION.whyLead);
  });

  test(`${id}: every option has words and drawn features`, () => {
    for (const o of OPTIONS) {
      assert.ok(o.changes.length && o.benefits.length && o.tradeoffs.length, o.id);
      assert.ok(o.geojson.features.length > 5, o.id);
      assert.ok(NOTICE[o.id]?.length === 3, `notice for ${o.id}`);
      for (const row of MATRIX_ROWS) assert.ok(row.cells[o.id], `matrix ${row.id} for ${o.id}`);
    }
  });

  test(`${id}: features, comments and changes are placed and linked`, () => {
    for (const f of EXISTING_FEATURES) assert.ok(Array.isArray(f.lngLat) && f.facts.length, f.id);
    for (const c of SAMPLE_COMMENTS) {
      assert.ok(THEME_BY_ID[c.theme], `${c.id} theme`);
      assert.ok(c.option == null || OPTION_BY_ID[c.option], `${c.id} option`);
      assert.ok(inProjectArea(c.lngLat), `${c.id} inside the project area`);
    }
    for (const r of REVISION_CHANGES) for (const t of r.themes) assert.ok(THEME_BY_ID[t], `${r.id} theme ${t}`);
    for (const s of STORY) assert.ok(!s.focus || EXISTING_FEATURES.some((f) => f.id === s.focus), `story ${s.id} focus`);
    for (const w of DECISION.why) assert.ok(!w.theme || THEME_BY_ID[w.theme], `why ${w.title}`);
  });

  test(`${id}: theme counts match the sample comments`, () => {
    for (const t of THEMES) assert.equal(t.count, SAMPLE_COMMENTS.filter((c) => c.theme === t.id).length, t.id);
  });

  test(`${id}: every cited source has a url, and sections cite real sources`, () => {
    for (const [k, s] of Object.entries(SOURCES)) assert.match(s.url, /^https:\/\//, k);
    assert.ok(SOURCES.decision, "a decision source");
    for (const s of COPY.evidence.sources) assert.ok(!s.src || SOURCES[s.src], `evidence source ${s.k}`);
    for (const s of COPY.evidence.sections) assert.ok(!s.link || SOURCES[s.link.src], `evidence link ${s.id}`);
  });

  test(`${id}: the replay step, stages and survey table line up`, () => {
    assert.ok(TIMELINE.some((t) => t.title === COPY.replayStep), "replay step in timeline");
    assert.ok(COPY.stages.includes(COPY.replayStage), "replay stage in stages");
    assert.equal(SURVEY.columns.length, 3);
    for (const k of Object.keys(COPY.timelineLinks)) assert.ok(TIMELINE.some((t) => t.title === k), `timeline link ${k}`);
  });
}
