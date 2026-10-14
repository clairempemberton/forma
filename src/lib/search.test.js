import test from "node:test";
import assert from "node:assert/strict";
import { matchesQuery, queryWords } from "./search.js";
import { PROJECTS } from "../data/projects.js";

const titles = (q) => PROJECTS.filter((p) => matchesQuery(p, q)).map((p) => p.title);
const finds = (q, fragment) => assert.ok(titles(q).some((t) => t.includes(fragment)), `"${q}" should find ${fragment}, got ${JSON.stringify(titles(q))}`);

test("street directionals and suffixes don't block a match", () => {
  finds("SE Alder St", "Alder");
  finds("SE 8th Ave", "Alder");
  finds("8th Avenue", "Alder");
  finds("SE Division", "Division");
});

test("plurals and partial words match", () => {
  finds("bus stops", "Belmont");
  finds("crossings", "Division");
  finds("laurel", "Laurelhurst");
});

test("common synonyms match", () => {
  finds("crosswalk", "Crossing");
});

test("a query of only filler words matches every project", () => {
  assert.equal(titles("Portland").length, PROJECTS.length);
  assert.equal(titles("  ").length, PROJECTS.length);
});

test("unrelated words still filter out", () => {
  assert.deepEqual(titles("Hawthorne"), []);
  assert.deepEqual(titles("Alder Laurelhurst"), []);
});

test("queryWords drops filler and normalises", () => {
  assert.deepEqual(queryWords("SE Alder St & 8th Ave, Portland OR"), ["alder", "8th"]);
});
