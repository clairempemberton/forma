import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon.jsx";
import { flyDuration } from "../lib/motion.js";
import { PITCH } from "./engine.js";

// Floating controls that adapt to the view: 3D adds rotate and tilt.
export default function MapControls({ map, mode, initialCamera, layers, onLayers, hasLegend, legendOpen, onLegend, hideLayers = false }) {
  const [bearing, setBearing] = useState(map?.getBearing() ?? 0);
  const [layersOpen, setLayersOpen] = useState(false);
  const popRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    const on = () => setBearing(map.getBearing());
    map.on("rotate", on);
    return () => map.off("rotate", on);
  }, [map]);

  useEffect(() => {
    if (!layersOpen) return;
    const close = (e) => { if (!popRef.current?.contains(e.target)) setLayersOpen(false); };
    const esc = (e) => e.key === "Escape" && setLayersOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [layersOpen]);

  if (!map) return null;
  const d = flyDuration(500);
  const is3d = mode === "3d";

  return (
    <div className="mv__controls" role="toolbar" aria-label="Map controls" aria-orientation="vertical">
      <div className="ctl-group glass">
        <button type="button" className="ctl" onClick={() => map.zoomIn({ duration: d })} aria-label="Zoom in"><Icon name="plus" /></button>
        <button type="button" className="ctl" onClick={() => map.zoomOut({ duration: d })} aria-label="Zoom out"><Icon name="minus" /></button>
      </div>

      <div className="ctl-group glass">
        <button type="button" className="ctl" onClick={() => map.easeTo({ bearing: 0, pitch: is3d ? map.getPitch() : 0, duration: d })} aria-label={`Reset to north. Bearing ${Math.round(bearing)} degrees.`}>
          <Icon name="north" style={{ transform: `rotate(${-bearing}deg)`, transition: "none" }} />
        </button>
        {is3d && (
          <>
            <button type="button" className="ctl" onClick={() => map.easeTo({ bearing: map.getBearing() - 45, duration: flyDuration(700) })} aria-label="Rotate left 45 degrees"><Icon name="rotate" style={{ transform: "scaleX(-1)" }} /></button>
            <button type="button" className="ctl" onClick={() => map.easeTo({ bearing: map.getBearing() + 45, duration: flyDuration(700) })} aria-label="Rotate right 45 degrees"><Icon name="rotate" /></button>
            <button type="button" className="ctl" onClick={() => map.easeTo({ pitch: map.getPitch() > 50 ? 35 : 70, duration: flyDuration(700) })} aria-label="Change tilt"><Icon name="tilt" /></button>
          </>
        )}
      </div>

      <div className="ctl-group glass" ref={popRef}>
        {!hideLayers && <button type="button" className="ctl" aria-expanded={layersOpen} aria-haspopup="true" onClick={() => setLayersOpen((v) => !v)} aria-label="Layers"><Icon name="layers" /></button>}
        {hasLegend && <button type="button" className="ctl" aria-pressed={legendOpen} onClick={onLegend} aria-label="Map key"><Icon name="list" /></button>}
        <button
          type="button" className="ctl"
          onClick={() => map.flyTo({ center: initialCamera.center, zoom: initialCamera.zoom, bearing: is3d ? -28 : 0, pitch: PITCH[mode] ?? 0, duration: flyDuration(1200) })}
          aria-label="Reset view"
        >
          <Icon name="locate" />
        </button>
        {layersOpen && (
          <div className="ctl-pop panel-float" role="group" aria-label="Show on map">
            <p className="t-eyebrow">Show on map</p>
            {[
              ["existing", "Existing conditions", "OpenStreetMap"],
              ["proposal", "Proposed changes", "Illustrative"],
              ["comments", "Community comments", "Sample + yours"],
            ].map(([k, label, sub]) => (
              <label key={k} className="ctl-pop__row">
                <input type="checkbox" checked={layers[k]} onChange={(e) => onLayers({ ...layers, [k]: e.target.checked })} />
                <span><span className="t-compact">{label}</span><span className="t-caption t-muted">{sub}</span></span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
