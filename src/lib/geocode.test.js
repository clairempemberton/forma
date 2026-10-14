import test from "node:test";
import assert from "node:assert/strict";
import { parsePlace } from "./geocode.js";

test("reads a Mapbox v6 result", () => {
  const body = { features: [{ geometry: { coordinates: [-122.6657, 45.513] }, properties: { name: "Hawthorne Bridge", place_formatted: "Portland, Oregon 97214, United States" } }] };
  assert.deepEqual(parsePlace(body, "mapbox"), { label: "Hawthorne Bridge", lngLat: [-122.6657, 45.513] });
});

test("reads a Photon result", () => {
  const body = { features: [{ geometry: { coordinates: [-122.62, 45.512] }, properties: { name: "Hawthorne", city: "Portland" } }] };
  assert.deepEqual(parsePlace(body, "photon"), { label: "Hawthorne", lngLat: [-122.62, 45.512] });
});

test("a Photon street number result is labelled as an address", () => {
  const body = { features: [{ geometry: { coordinates: [-122.65, 45.51] }, properties: { housenumber: "1200", street: "SE Morrison St" } }] };
  assert.equal(parsePlace(body, "photon").label, "1200 SE Morrison St");
});

test("no features, or bad coordinates, means no place", () => {
  assert.equal(parsePlace({ features: [] }, "mapbox"), null);
  assert.equal(parsePlace({}, "photon"), null);
  assert.equal(parsePlace({ features: [{ geometry: { coordinates: ["x", 1] }, properties: {} }] }, "photon"), null);
});
