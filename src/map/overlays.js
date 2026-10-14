// Forma's geographic layers, kept in separate sources so existing conditions,
// proposals and community feedback never mix:
//   f-mask      spatial focus: dims everything outside the project area
//   f-boundary  the project area
//   f-osm       real existing conditions from OpenStreetMap (sidewalks, crossings, trees)
//   f-proposal  the selected option's illustrative geometry
//   f-focus     a single highlighted feature (inspector, story steps, themes)
// Comments and inspectable features render as accessible DOM markers (see MapView).

const ACCENT = "#15803d";
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
    tree: sat ? "#a7f3c0" : "#4ade80",
    fill: sat ? "rgba(34, 197, 94,0.5)" : "rgba(21, 128, 61,0.16)",
    line: sat ? "#86efac" : ACCENT,
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
  // Parks: courts, pools and playgrounds, and paths that aren't sidewalks.
  add({ id: "f-osm-leisure", type: "fill", source: "f-osm", ...slot, filter: ["all", ["==", ["geometry-type"], "Polygon"], ["in", ["get", "leisure"], ["literal", ["pitch", "swimming_pool", "playground", "sports_centre"]]]], paint: { "fill-color": sat(mode, "rgba(100, 116, 139,0.10)", "rgba(255,255,255,0.12)") } });
  add({ id: "f-osm-leisure-edge", type: "line", source: "f-osm", ...slot, filter: ["in", ["get", "leisure"], ["literal", ["pitch", "swimming_pool", "playground", "sports_centre"]]], paint: { "line-color": p.osmLine, "line-width": 1, "line-dasharray": [2, 1.5] } });
  add({ id: "f-osm-path", type: "line", source: "f-osm", ...slot, filter: ["all", ["in", ["get", "highway"], ["literal", ["footway", "path", "steps"]]], ["!=", ["get", "footway"], "sidewalk"], ["!=", ["get", "footway"], "crossing"]], paint: { "line-color": p.osmLine, "line-width": ["interpolate", ["linear"], ["zoom"], 16, 0.5, 20, 1.6], "line-dasharray": [2, 1] } });
  add({ id: "f-osm-tree", type: "circle", source: "f-osm", ...slot, filter: ["==", ["get", "natural"], "tree"], paint: { "circle-color": p.tree, "circle-opacity": 0.7, "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 16, 2, 21, 22], "circle-stroke-color": "#ffffff", "circle-stroke-width": 0.5, "circle-pitch-alignment": "map" } });

  // Proposal — 2D
  const kind = (k) => ["==", ["get", "kind"], k];
  const kinds = (...ks) => ["in", ["get", "kind"], ["literal", ks]];
  add({ id: "f-prop-fill", type: "fill", source: "f-proposal", ...slot, filter: kinds("curb-extension", "raised-crossing", "bike-lane", "bus-shelter", "loading"), paint: {
    "fill-color": ["case", kind("bike-lane"), sat(mode, "rgba(21, 128, 61,0.32)", "rgba(34, 197, 94,0.55)"), kind("loading"), "rgba(107, 114, 128,0.28)", p.fill],
    "fill-opacity": ["case", ["boolean", ["feature-state", "dim"], false], 0.25, 1],
  } });
  // Street reconfiguration (lanes, islands, bus priority, curb zone)
  add({ id: "f-prop-street", type: "fill", source: "f-proposal", ...slot, filter: kinds("parking", "parking-removed", "visibility-zone", "turn-lane", "bus-lane", "mixing-zone", "refuge-island", "crosswalk"), paint: {
    "fill-color": ["case",
      kind("parking"), sat(mode, "rgba(100, 116, 139,0.22)", "rgba(226, 232, 240,0.35)"),
      kind("parking-removed"), "rgba(234, 179, 8,0.55)",
      kind("visibility-zone"), sat(mode, "rgba(255,255,255,0.9)", "rgba(255,255,255,0.55)"),
      kind("turn-lane"), "rgba(250, 204, 21,0.18)",
      kind("bus-lane"), "rgba(220, 38, 38,0.62)",
      kind("mixing-zone"), "rgba(220, 38, 38,0.28)",
      kind("refuge-island"), sat(mode, "rgba(21, 128, 61,0.55)", "rgba(74, 222, 128,0.75)"),
      kind("crosswalk"), "rgba(255,255,255,0.92)",
      "rgba(0,0,0,0)"],
    "fill-opacity": ["case", ["boolean", ["feature-state", "dim"], false], 0.25, 1],
  } });
  add({ id: "f-prop-street-edge", type: "line", source: "f-proposal", ...slot, filter: kinds("refuge-island", "visibility-zone", "mixing-zone", "crosswalk"), paint: {
    "line-color": ["case", kind("refuge-island"), ACCENT, kind("mixing-zone"), "#dc2626", "#64748b"],
    "line-width": ["case", kind("refuge-island"), 1.6, 1],
    "line-dasharray": ["literal", [2, 1.5]],
  } });
  add({ id: "f-prop-lane-line", type: "line", source: "f-proposal", ...slot, filter: kinds("lane-line", "center-line"), paint: {
    "line-color": ["case", kind("center-line"), "#eab308", sat(mode, "#94a3b8", "#ffffff")],
    "line-width": ["interpolate", ["linear"], ["zoom"], 16, 0.8, 20, 2.5],
    "line-dasharray": ["literal", [3, 3]],
  } });
  add({ id: "f-prop-bike-route", type: "line", source: "f-proposal", ...slot, filter: kind("bike-route"), paint: { "line-color": ACCENT, "line-width": 3, "line-dasharray": [1, 1.4] } });
  add({ id: "f-prop-bus-stop", type: "circle", source: "f-proposal", ...slot, filter: kind("bus-stop"), paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 16, 3, 20, 8], "circle-color": "#dc2626", "circle-stroke-color": "#ffffff", "circle-stroke-width": 1.5, "circle-pitch-alignment": "map" } });
  add({ id: "f-prop-crossing-stripes", type: "line", source: "f-proposal", ...slot, filter: kind("raised-crossing"), paint: { "line-color": sat(mode, ACCENT, "#ffffff"), "line-width": 1.2, "line-opacity": 0.9 } });
  add({ id: "f-prop-outline", type: "line", source: "f-proposal", ...slot, filter: kinds("curb-extension", "raised-crossing", "bus-shelter", "traffic-circle", "seating"), paint: { "line-color": ["case", ["boolean", ["feature-state", "selected"], false], INK, p.line], "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 2.6, 1.6] } });
  add({ id: "f-prop-crossbike", type: "line", source: "f-proposal", ...slot, filter: kind("crossbike"), paint: { "line-color": p.line, "line-width": 2, "line-dasharray": [1.5, 1.5] } });
  add({ id: "f-prop-separator", type: "line", source: "f-proposal", ...slot, filter: kind("separator"), paint: { "line-color": sat(mode, INK, "#ffffff"), "line-width": ["interpolate", ["linear"], ["zoom"], 17, 1, 20, 3], "line-dasharray": [0.5, 2.5] } });
  add({ id: "f-prop-circle", type: "fill", source: "f-proposal", ...slot, filter: kind("traffic-circle"), paint: { "fill-color": "rgba(74, 222, 128,0.6)" } });
  add({ id: "f-prop-seating", type: "fill", source: "f-proposal", ...slot, filter: kind("seating"), paint: { "fill-color": INK } });
  add({ id: "f-prop-canopy", type: "fill", source: "f-proposal", ...slot, filter: kind("tree-canopy"), paint: { "fill-color": "rgba(74, 222, 128,0.55)" } });
  add({ id: "f-prop-tree", type: "circle", source: "f-proposal", ...slot, filter: kind("tree-new"), paint: { "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 16, 2, 21, 9], "circle-color": "#ffffff", "circle-stroke-color": ACCENT, "circle-stroke-width": 2, "circle-pitch-alignment": "map" } });
  // Parks: a skate area with bowls and a plaza, a roof over part of it, and labelled elements.
  add({ id: "f-prop-park", type: "fill", source: "f-proposal", ...slot, filter: kinds("skate-area", "plaza", "bowl"), paint: {
    "fill-color": ["case", kind("bowl"), sat(mode, "rgba(71, 85, 105,0.45)", "rgba(203, 213, 225,0.55)"), kind("plaza"), sat(mode, "rgba(234, 179, 8,0.22)", "rgba(250, 204, 21,0.35)"), sat(mode, "rgba(148, 163, 184,0.32)", "rgba(241, 245, 249,0.45)")],
  } });
  add({ id: "f-prop-park-edge", type: "line", source: "f-proposal", ...slot, filter: kinds("skate-area", "bowl"), paint: { "line-color": sat(mode, "#475569", "#ffffff"), "line-width": 1.4 } });
  add({ id: "f-prop-cover", type: "fill", source: "f-proposal", ...slot, filter: kind("cover"), paint: { "fill-color": sat(mode, "rgba(21, 128, 61,0.14)", "rgba(74, 222, 128,0.25)") } });
  add({ id: "f-prop-cover-edge", type: "line", source: "f-proposal", ...slot, filter: kind("cover"), paint: { "line-color": ACCENT, "line-width": 2, "line-dasharray": [2, 1.2] } });
  add({ id: "f-prop-path", type: "line", source: "f-proposal", ...slot, filter: kind("path"), paint: { "line-color": ACCENT, "line-width": 3, "line-dasharray": [1, 1.4] } });
  add({ id: "f-prop-element", type: "circle", source: "f-proposal", ...slot, filter: kind("skate-element"), paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 17, 2.5, 21, 8], "circle-color": "#ffffff", "circle-stroke-color": INK, "circle-stroke-width": 1.5, "circle-pitch-alignment": "map" } });
  add({ id: "f-prop-ramp", type: "circle", source: "f-proposal", ...slot, filter: kind("curb-ramp"), paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 17, 2, 21, 6], "circle-color": "#6b7280", "circle-stroke-color": "#ffffff", "circle-stroke-width": 1.2 } });

  // Proposal — 3D: low extrusions for curbs and crossings, simple massing for shelter and trees.
  add({ id: "f-prop-3d", type: "fill-extrusion", source: "f-proposal", ...slot, filter: kinds("curb-extension", "raised-crossing", "bus-shelter", "seating", "refuge-island"), layout: { visibility: is3d ? "visible" : "none" }, paint: {
    "fill-extrusion-color": ["case", kind("tree-canopy"), "#6ee7a0", kind("bus-shelter"), "#dcfce7", kind("seating"), "#2a2f38", "#bbf7d0"],
    "fill-extrusion-base": ["case", kind("tree-canopy"), 2.6, 0],
    "fill-extrusion-height": ["case", kind("tree-canopy"), 7.5, kind("bus-shelter"), 2.7, kind("seating"), 0.5, kind("raised-crossing"), 0.12, kind("refuge-island"), 0.2, 0.16],
    "fill-extrusion-opacity": 0.92,
  } });

  // The skatepark roof, about 12 ft up (PP&R concept sections show 9–12 ft clearance).
  add({ id: "f-prop-roof-3d", type: "fill-extrusion", source: "f-proposal", ...slot, filter: kind("cover"), layout: { visibility: is3d ? "visible" : "none" }, paint: {
    "fill-extrusion-color": "#e5e7eb", "fill-extrusion-base": 3.4, "fill-extrusion-height": 3.8, "fill-extrusion-opacity": 0.85,
  } });

  // Focus highlight
  add({ id: "f-focus-fill", type: "fill", source: "f-focus", ...top, filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": "rgba(21, 128, 61,0.18)" } });
  add({ id: "f-focus-line", type: "line", source: "f-focus", ...top, paint: { "line-color": ACCENT, "line-width": 3, "line-blur": 0.5 } });
  add({ id: "f-focus-glow", type: "circle", source: "f-focus", ...top, filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 26, "circle-color": "rgba(21, 128, 61,0.16)", "circle-stroke-color": ACCENT, "circle-stroke-width": 1.5, "circle-pitch-alignment": "map" } });

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
  existing: ["f-osm-sidewalk", "f-osm-crossing", "f-osm-tree", "f-osm-leisure", "f-osm-leisure-edge", "f-osm-path"],
  proposal: ["f-prop-street", "f-prop-street-edge", "f-prop-lane-line", "f-prop-bike-route", "f-prop-bus-stop", "f-prop-fill", "f-prop-crossing-stripes", "f-prop-outline", "f-prop-crossbike", "f-prop-separator", "f-prop-circle", "f-prop-seating", "f-prop-canopy", "f-prop-tree", "f-prop-ramp", "f-prop-park", "f-prop-park-edge", "f-prop-cover", "f-prop-cover-edge", "f-prop-path", "f-prop-element"],
  proposal3d: ["f-prop-3d", "f-prop-roof-3d"],
  focus: ["f-mask"],
  buildings3d: ["f-buildings-3d"],
};
