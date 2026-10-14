// Loads the rendering engine on demand so maps never block first paint.
// Mapbox GL JS when a public token is configured; otherwise MapLibre GL JS with
// OpenFreeMap vector tiles (OpenStreetMap data, no key) for Map and 3D.
import { ENGINE, MAPBOX_TOKEN } from "../lib/env.js";

let libPromise;

export function loadEngine() {
  if (!libPromise) {
    libPromise = ENGINE === "mapbox"
      ? Promise.all([import("mapbox-gl"), import("mapbox-gl/dist/mapbox-gl.css")]).then(([m]) => {
          const lib = m.default ?? m;
          lib.accessToken = MAPBOX_TOKEN;
          return lib;
        })
      : Promise.all([
          import("maplibre-gl"),
          import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"),
          import("maplibre-gl/dist/maplibre-gl.css"),
        ]).then(([m, worker]) => {
          const lib = m.default ?? m;
          // Bundle the worker ourselves; its default relative lookup doesn't survive bundling.
          lib.setWorkerUrl?.(worker.default);
          return lib;
        });
  }
  return libPromise;
}

export const FALLBACK_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export const MODES = [
  { id: "map", label: "Map", icon: "map" },
  { id: "satellite", label: "Satellite", icon: "satellite" },
  { id: "3d", label: "3D", icon: "cube" },
];

export function styleFor(mode) {
  if (ENGINE === "mapbox") return mode === "satellite" ? "mapbox://styles/mapbox/standard-satellite" : "mapbox://styles/mapbox/standard";
  return FALLBACK_STYLE;
}

// Which base style a mode needs. Map and 3D share one style and differ only by
// configuration, so switching between them never reloads the map.
export const styleKey = (mode) => (ENGINE === "mapbox" && mode === "satellite" ? "satellite" : "standard");

export function basemapConfig(mode) {
  if (mode === "satellite") {
    return { lightPreset: "day", showPointOfInterestLabels: false, showTransitLabels: false, showRoadsAndTransit: true, showPedestrianRoads: true };
  }
  return {
    lightPreset: "day",
    theme: "default",
    show3dObjects: mode === "3d",
    showPointOfInterestLabels: false,
    showTransitLabels: true,
    showPedestrianRoads: true,
  };
}

export function applyBasemapConfig(map, mode) {
  if (ENGINE !== "mapbox" || typeof map.setConfigProperty !== "function") return;
  for (const [k, v] of Object.entries(basemapConfig(mode))) {
    try { map.setConfigProperty("basemap", k, v); } catch { /* property not offered by this style */ }
  }
}

export function setTerrain(map, on) {
  if (ENGINE !== "mapbox") return;
  try {
    if (on) {
      if (!map.getSource("mapbox-dem")) map.addSource("mapbox-dem", { type: "raster-dem", url: "mapbox://mapbox.mapbox-terrain-dem-v1", tileSize: 512, maxzoom: 14 });
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1 });
    } else if (map.getTerrain?.()) {
      map.setTerrain(null);
    }
  } catch { /* terrain is an enhancement */ }
}

export const PITCH = { "3d": 62, map: 0, satellite: 0 };
