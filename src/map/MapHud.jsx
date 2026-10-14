import { formatCoord } from "../lib/geo.js";

// A quiet live readout of where the camera is. Purely informational.
export default function MapHud({ cam, engine, mode }) {
  const bearing = ((Math.round(cam.bearing) % 360) + 360) % 360;
  return (
    <div className="mv__hud" aria-hidden="true">
      <span>{formatCoord(cam.center)}</span>
      <span>Z {cam.zoom.toFixed(1)}</span>
      <span>{String(bearing).padStart(3, "0")}°</span>
      {mode === "3d" && <span>Tilt {Math.round(cam.pitch)}°</span>}
      <span className="mv__hud-src">{engine === "mapbox" ? "Mapbox" : "OpenFreeMap · OSM"}</span>
    </div>
  );
}
