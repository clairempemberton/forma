import test from "node:test";
import assert from "node:assert/strict";
import { matchesQuery, queryWords } from "./search.js";
import { PROJECTS } from "../data/projects.js";

const titles = (q) => PROJECTS.filter((p) => matchesQuery(p, q)).map((p) => p.title);
const finds = (q, fragment) => assert.ok(titles(q).some((t) => t.includes(fragment)), `"${q}" should find ${fragment}, got ${JSON.stringify(titles(q))}`);

test("street directionals and suffixes don't block a match", () => {
  finds("SE Hawthorne Blvd", "Hawthorne");
  finds("NE Broadway", "Broadway");
  finds("SE 59th Ave", "59th");
  finds("82nd Avenue", "82nd");
});

test("plurals and partial words match", () => {
  finds("crossings", "Hawthorne");
  finds("skate", "Creston");
  finds("pickleball courts", "Westmoreland");
});

test("common synonyms match", () => {
  finds("crosswalk", "Hawthorne");
});

test("a query of only filler words matches every project", () => {
  assert.equal(titles("Portland").length, PROJECTS.length);
  assert.equal(titles("  ").length, PROJECTS.length);
});

test("unrelated words still filter out", () => {
  assert.deepEqual(titles("Alberta"), []);
  assert.deepEqual(titles("Hawthorne skatepark"), []);
});

test("queryWords drops filler and normalises", () => {
  assert.deepEqual(queryWords("SE Hawthorne Blvd & 37th Ave, Portland OR"), ["hawthorne", "37th"]);
});
