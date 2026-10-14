// Forma's geographic layers, kept in separate sources so existing conditions,
// proposals and community feedback never mix:
//   f-mask      spatial focus: dims everything outside the project area
//   f-boundary  the project area
//   f-osm       real existing conditions from OpenStreetMap (sidewalks, crossings, trees)
//   f-proposal  the selected option's illustrative geometry
//   f-focus     a single highlighted feature (inspector, story steps, themes)
// Comments and inspectable features render as accessible DOM markers (see MapView).

const ACCENT = "#2b50f0";
const INK = "#0e1116";

const world = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];

export function maskFrom(boundary) {
  const holes = boundary.features.map((f) => f.geometry.coordinates[0]);
  return { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [world, ...holes] } }] };
}

const EMPTY = { type: "FeatureCollection", features: [] };

// Paint palettes per base style: on satellite imagery lines need to be brighter and heavier.
function palette(mode) {
  const sat = mode === "satellite";
  return {
    maskOpacity: sat ? 0.38 : 0.55,
    maskColor: sat ? "#0b0d12" : "#ffffff",
    boundary: sat ? "#ffffff" : INK,
    osmLine: sat ? "rgba(255,255,255,0.75)" : "#9aa3af",
    osmCrossing: sat ? "#ffffff" : "#5b6472",
    tree: sat ? "#9be3c4" : "#7bb89f",
    fill: sat ? "rgba(90,125,255,0.5)" : "rgba(43,80,240,0.16)",
    line: sat ? "#8fa6ff" : ACCENT,
  };
}

export function addOverlays(map, { mode, engine, boundary, osm, is3d }) {
  const p = palette(mode);
  const slot = engine === "mapbox" ? { slot: "middle" } : {};
  const top = engine === "mapbox" ? { slot: "top" } : {};
  const add = (layer) => { if (!map.getLayer(layer.id)) map.addLayer(layer); };
  const src = (id, data, extra = {}) => { if (!map.getSource(id)) map.addSource(id, { type: "geojson", data, ...extra }); };

  src("f-mask", maskFrom(boundary));
  src("f-boundary", boundary);
  src("f-osm", osm);
  src("f-proposal", EMPTY, { promoteId: "id" });
  src("f-focus", EMPTY);

  add({ id: "f-mask", type: "fill", source: "f-mask", ...slot, paint: { "fill-color": p.maskColor, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 16, p.maskOpacity] } });
  add({ id: "f-boundary", type: "line", source: "f-boundary", ...slot, paint: { "line-color": p.boundary, "line-width": 1.25, "line-dasharray": [2, 2], "line-opacity": 0.6 } });

  // Existing conditions (OSM)
  add({ id: "f-osm-sidewalk", type: "line", source: "f-osm", ...slot, filter: ["all", ["==", ["get", "highway"], "footway"], ["==", ["get", "footway"], "sidewalk"]], paint: { "line-color": p.osmLine, "line-width": ["interpolate", ["linear"], ["zoom"], 16, 0.5, 20, 2] } });
  add({ id: "f-osm-crossing", type: "line", source: "f-osm", ...slot, filter: ["all", ["==", ["get", "highway"], "footway"], ["==", ["get", "footway"], "crossing"]], paint: { "line-color": p.osmCrossing, "line-width": ["interpolate", ["linear"], ["zoom"], 16, 1, 20, 3], "line-dasharray": [1, 1.2] } });
  add({ id: "f-osm-tree", type: "circle", source: "f-osm", ...slot, filter: ["==", ["get", "natural"], "tree"], paint: { "circle-color": p.tree, "circle-opacity": 0.7, "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 16, 2, 21, 22], "circle-stroke-color": "#ffffff", "circle-stroke-width": 0.5, "circle-pitch-alignment": "map" } });

  // Proposal — 2D
  const kind = (k) => ["==", ["get", "kind"], k];
  const kinds = (...ks) => ["in", ["get", "kind"], ["literal", ks]];
  add({ id: "f-prop-fill", type: "fill", source: "f-proposal", ...slot, filter: kinds("curb-extension", "raised-crossing", "bike-lane", "bus-shelter", "loading"), paint: {
    "fill-color": ["case", kind("bike-lane"), sat(mode, "rgba(43,80,240,0.32)", "rgba(110,140,255,0.55)"), kind("loading"), "rgba(217,144,53,0.28)", p.fill],
    "fill-opacity": ["case", ["boolean", ["feature-state", "dim"], false], 0.25, 1],
  } });
  add({ id: "f-prop-crossing-stripes", type: "line", source: "f-proposal", ...slot, filter: kind("raised-crossing"), paint: { "line-color": sat(mode, ACCENT, "#ffffff"), "line-width": 1.2, "line-opacity": 0.9 } });
  add({ id: "f-prop-outline", type: "line", source: "f-proposal", ...slot, filter: kinds("curb-extension", "raised-crossing", "bus-shelter", "traffic-circle", "seating"), paint: { "line-color": ["case", ["boolean", ["feature-state", "selected"], false], INK, p.line], "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 2.6, 1.6] } });
  add({ id: "f-prop-crossbike", type: "line", source: "f-proposal", ...slot, filter: kind("crossbike"), paint: { "line-color": p.line, "line-width": 2, "line-dasharray": [1.5, 1.5] } });
  add({ id: "f-prop-separator", type: "line", source: "f-proposal", ...slot, filter: kind("separator"), paint: { "line-color": sat(mode, INK, "#ffffff"), "line-width": ["interpolate", ["linear"], ["zoom"], 17, 1, 20, 3], "line-dasharray": [0.5, 2.5] } });
  add({ id: "f-prop-circle", type: "fill", source: "f-proposal", ...slot, filter: kind("traffic-circle"), paint: { "fill-color": "rgba(123,184,159,0.6)" } });
  add({ id: "f-prop-seating", type: "fill", source: "f-proposal", ...slot, filter: kind("seating"), paint: { "fill-color": INK } });
  add({ id: "f-prop-canopy", type: "fill", source: "f-proposal", ...slot, filter: kind("tree-canopy"), paint: { "fill-color": "rgba(123,184,159,0.55)" } });
  add({ id: "f-prop-tree", type: "circle", source: "f-proposal", ...slot, filter: kind("tree-new"), paint: { "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 16, 2, 21, 9], "circle-color": "#ffffff", "circle-stroke-color": ACCENT, "circle-stroke-width": 2, "circle-pitch-alignment": "map" } });
  add({ id: "f-prop-ramp", type: "circle", source: "f-proposal", ...slot, filter: kind("curb-ramp"), paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 17, 2, 21, 6], "circle-color": "#d99035", "circle-stroke-color": "#ffffff", "circle-stroke-width": 1.2 } });

  // Proposal — 3D: low extrusions for curbs and crossings, simple massing for shelter and trees.
  add({ id: "f-prop-3d", type: "fill-extrusion", source: "f-proposal", ...slot, filter: kinds("curb-extension", "raised-crossing", "bus-shelter", "seating"), layout: { visibility: is3d ? "visible" : "none" }, paint: {
    "fill-extrusion-color": ["case", kind("tree-canopy"), "#86c3a8", kind("bus-shelter"), "#dfe5ff", kind("seating"), "#2a2f38", "#c9d3ff"],
    "fill-extrusion-base": ["case", kind("tree-canopy"), 2.6, 0],
    "fill-extrusion-height": ["case", kind("tree-canopy"), 7.5, kind("bus-shelter"), 2.7, kind("seating"), 0.5, kind("raised-crossing"), 0.12, 0.16],
    "fill-extrusion-opacity": 0.92,
  } });

  // Focus highlight
  add({ id: "f-focus-fill", type: "fill", source: "f-focus", ...top, filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": "rgba(43,80,240,0.18)" } });
  add({ id: "f-focus-line", type: "line", source: "f-focus", ...top, paint: { "line-color": ACCENT, "line-width": 3, "line-blur": 0.5 } });
  add({ id: "f-focus-glow", type: "circle", source: "f-focus", ...top, filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 26, "circle-color": "rgba(43,80,240,0.16)", "circle-stroke-color": ACCENT, "circle-stroke-width": 1.5, "circle-pitch-alignment": "map" } });

  // MapLibre fallback has no 3D buildings in the base style; add them from OpenMapTiles.
  if (engine === "maplibre" && map.getSource("openmaptiles") && !map.getLayer("f-buildings-3d")) {
    map.addLayer({ id: "f-buildings-3d", type: "fill-extrusion", source: "openmaptiles", "source-layer": "building", minzoom: 14, layout: { visibility: is3d ? "visible" : "none" }, paint: {
      "fill-extrusion-color": "#eef0f4", "fill-extrusion-height": ["coalesce", ["get", "render_height"], 6], "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0], "fill-extrusion-opacity": 0.92,
    } }, "f-mask");
  }
}

function sat(mode, light, dark) { return mode === "satellite" ? dark : light; }

export function setData(map, id, data) {
  const s = map.getSource(id);
  if (s) s.setData(data || EMPTY);
}

export function setVisible(map, ids, on) {
  ids.forEach((id) => { if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none"); });
}

export const LAYER_GROUPS = {
  existing: ["f-osm-sidewalk", "f-osm-crossing", "f-osm-tree"],
  proposal: ["f-prop-fill", "f-prop-crossing-stripes", "f-prop-outline", "f-prop-crossbike", "f-prop-separator", "f-prop-circle", "f-prop-seating", "f-prop-canopy", "f-prop-tree", "f-prop-ramp"],
  proposal3d: ["f-prop-3d"],
  focus: ["f-mask"],
  buildings3d: ["f-buildings-3d"],
};
