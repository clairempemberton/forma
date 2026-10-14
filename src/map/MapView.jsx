import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadEngine, styleFor, styleKey, applyBasemapConfig, setTerrain, PITCH } from "./engine.js";
import { addOverlays, setData, setVisible, LAYER_GROUPS } from "./overlays.js";
import { ENGINE, HAS_MAPBOX } from "../lib/env.js";
import { flyDuration, prefersReducedMotion } from "../lib/motion.js";
import { clusterPoints } from "../lib/cluster.js";
import { BOUNDARY, CAMERA } from "../data/alder.js";
import ModeSwitch from "./ModeSwitch.jsx";
import MapControls from "./MapControls.jsx";
import MapHud from "./MapHud.jsx";
import Marker from "./Marker.jsx";
import Icon from "../components/Icon.jsx";
import "./map.css";

const StreetView = lazy(() => import("./StreetView.jsx"));

let osmPromise;
const loadOsm = () => (osmPromise ??= import("../data/osm-existing.json").then((m) => m.default ?? m));

/**
 * The single map surface used across Forma. One map instance per MapView; switching
 * Map ↔ 3D only changes configuration and camera, Satellite swaps the base style and
 * re-adds Forma's layers, and Street overlays imagery while the map stays alive underneath.
 */
export default function MapView({
  mode = "map",
  onModeChange,
  modes,
  initialCamera = CAMERA.home,
  camera,
  proposal = null,
  showExisting = true,
  showProposal = true,
  focus = null,
  focusMask = true,
  markers = [],
  clusterKinds = ["comment"],
  onMarkerClick,
  onSelectProposal,
  picking = null,
  controls = true,
  modeSwitch = true,
  hud = true,
  legend = null,
  streetTarget,
  streetContext,
  onReady,
  onCameraChange,
  ariaLabel = "Map of SE Alder St and SE 8th Ave, Portland",
  className = "",
  children,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const libRef = useRef(null);
  const styleRef = useRef(null);
  const modeRef = useRef(mode);
  const propsRef = useRef({});

  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);
  const [frame, setFrame] = useState(0);
  const [legendOpen, setLegendOpen] = useState(false);
  const [layers, setLayers] = useState({ existing: true, proposal: true, comments: true });
  propsRef.current = { proposal, showExisting, showProposal, focus, focusMask, onSelectProposal, onCameraChange, picking, layers };
  const satUnavailable = mode === "satellite" && !HAS_MAPBOX;

  // ——— Sync Forma layers to props ———
  const syncLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.getSource("f-proposal")) return;
    const p = propsRef.current;
    const layers = p.layers;
    setData(map, "f-proposal", p.showProposal ? p.proposal : null);
    setData(map, "f-focus", p.focus ? { type: "FeatureCollection", features: [].concat(p.focus) } : null);
    setVisible(map, LAYER_GROUPS.existing, p.showExisting && layers.existing);
    setVisible(map, LAYER_GROUPS.proposal, p.showProposal && layers.proposal);
    setVisible(map, LAYER_GROUPS.proposal3d, modeRef.current === "3d" && p.showProposal && layers.proposal);
    setVisible(map, LAYER_GROUPS.focus, p.focusMask);
    setVisible(map, LAYER_GROUPS.buildings3d, modeRef.current === "3d");
  }, []);

  const installOverlays = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const osm = await loadOsm();
    if (!map.isStyleLoaded?.() && !map.getStyle?.()) return;
    try {
      addOverlays(map, { mode: modeRef.current, engine: ENGINE, boundary: BOUNDARY, osm, is3d: modeRef.current === "3d" });
    } catch (e) {
      console.warn("Forma overlays", e);
    }
    syncLayers();
    setFrame((f) => f + 1);
  }, [syncLayers]);

  // ——— Create the map once ———
  useEffect(() => {
    let cancelled = false;
    let map;
    loadEngine()
      .then((lib) => {
        if (cancelled || !containerRef.current) return;
        libRef.current = lib;
        const startMode = modeRef.current;
        styleRef.current = styleKey(startMode);
        const options = {
          container: containerRef.current,
          style: styleFor(startMode),
          center: initialCamera.center,
          zoom: initialCamera.zoom,
          bearing: initialCamera.bearing ?? 0,
          pitch: startMode === "3d" ? PITCH["3d"] : initialCamera.pitch ?? 0,
          maxPitch: 75,
          minZoom: 12,
          attributionControl: false,
          antialias: true,
          // Keep the rendered frame readable so screens can be captured or exported.
          preserveDrawingBuffer: true,
          canvasContextAttributes: { antialias: true, preserveDrawingBuffer: true },
          fadeDuration: prefersReducedMotion() ? 0 : 200,
        };
        if (ENGINE === "mapbox") options.config = { basemap: { lightPreset: "day", theme: "default", show3dObjects: startMode === "3d", showPointOfInterestLabels: false } };
        try {
          map = new lib.Map(options);
        } catch (e) {
          setStatus("error");
          setError({ kind: "webgl", message: e?.message });
          return;
        }
        mapRef.current = map;
        map.addControl(new lib.AttributionControl({ compact: true }), "bottom-right");
        map.getCanvas().setAttribute("aria-label", ariaLabel);
        map.getCanvas().setAttribute("role", "application");

        map.on("style.load", () => {
          applyBasemapConfig(map, modeRef.current);
          setTerrain(map, modeRef.current === "3d");
          installOverlays();
        });
        map.on("load", () => { setStatus("ready"); onReady?.(map, lib); });
        map.on("error", (ev) => {
          const s = ev?.error?.status;
          if (s === 401 || s === 403) { setStatus("error"); setError({ kind: "token", message: ev.error.message }); }
        });
        let raf = 0;
        map.on("move", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setFrame((f) => f + 1)); });
        map.on("moveend", () => {
          const c = map.getCenter();
          propsRef.current.onCameraChange?.({ center: [c.lng, c.lat], zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() });
        });
        map.on("click", (ev) => {
          const p = propsRef.current;
          if (p.picking) { p.picking.onChange([ev.lngLat.lng, ev.lngLat.lat]); return; }
          if (!p.onSelectProposal) return;
          const hits = map.queryRenderedFeatures(ev.point, { layers: ["f-prop-fill", "f-prop-outline", "f-prop-3d", "f-prop-tree", "f-prop-circle"].filter((id) => map.getLayer(id)) });
          const id = hits.find((h) => h.properties?.id)?.properties.id;
          if (id) p.onSelectProposal(id);
        });
        map.on("mousemove", (ev) => {
          if (propsRef.current.picking) { map.getCanvas().style.cursor = "crosshair"; return; }
          const ids = ["f-prop-fill", "f-prop-outline", "f-prop-tree"].filter((id) => map.getLayer(id));
          const hit = ids.length && map.queryRenderedFeatures(ev.point, { layers: ids }).some((h) => h.properties?.id);
          map.getCanvas().style.cursor = hit ? "pointer" : "";
        });
      })
      .catch((e) => { if (!cancelled) { setStatus("error"); setError({ kind: "load", message: e?.message }); } });

    const ro = new ResizeObserver(() => mapRef.current?.resize());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      cancelled = true;
      ro.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The map is created once; later prop changes are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ——— Mode changes: config, style, camera ———
  useEffect(() => {
    const prev = modeRef.current;
    modeRef.current = mode;
    const map = mapRef.current;
    if (!map || mode === "street") return;
    const key = styleKey(mode);
    if (key !== styleRef.current) {
      styleRef.current = key;
      map.setStyle(styleFor(mode)); // style.load re-adds Forma's layers
    } else {
      applyBasemapConfig(map, mode);
      setTerrain(map, mode === "3d");
      if (map.getSource("f-proposal")) {
        // Re-create layers whose paint depends on the mode.
        installOverlays();
      }
    }
    if (prev !== mode && !(prev === "street")) {
      const target = { pitch: PITCH[mode] ?? 0, duration: flyDuration(1100), essential: false };
      if (mode === "3d") target.bearing = map.getBearing() === 0 ? -28 : map.getBearing();
      if (prev === "3d") target.bearing = 0;
      map.easeTo(target);
    }
    map.touchPitch?.[mode === "3d" ? "enable" : "disable"]?.();
  }, [mode, installOverlays]);

  // ——— Data / visibility ———
  useEffect(() => { syncLayers(); }, [proposal, showExisting, showProposal, focus, focusMask, layers, syncLayers]);

  // ——— Camera targets ———
  const lastCamera = useRef(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !camera || camera === lastCamera.current) return;
    lastCamera.current = camera;
    const { center, zoom, bearing, pitch } = camera;
    map.flyTo({ center, zoom, bearing: bearing ?? map.getBearing(), pitch: modeRef.current === "3d" ? Math.max(pitch ?? 0, 45) : pitch ?? 0, duration: flyDuration(1600), curve: 1.3, essential: false });
  }, [camera, status]);

  // ——— Markers: project to screen, cluster comments ———
  const projected = useMemo(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return [];
    const project = (ll) => { const p = map.project(ll); return [p.x, p.y]; };
    const shown = markers.filter((m) => Array.isArray(m.lngLat) && (m.kind === "comment" ? layers.comments : true));
    const clusterable = shown.filter((m) => clusterKinds.includes(m.kind) && !m.selected);
    const rest = shown.filter((m) => !clusterable.includes(m));
    const clusters = clusterPoints(clusterable, project, 36).map((c) => (c.count === 1 ? c.members[0] : { id: c.id, kind: "cluster", lngLat: c.lngLat, count: c.count, members: c.members }));
    const { clientWidth: w, clientHeight: h } = map.getContainer();
    return [...clusters, ...rest]
      .map((m) => { const [x, y] = project(m.lngLat); return { ...m, x, y }; })
      .filter((m) => m.x > -40 && m.y > -40 && m.x < w + 40 && m.y < h + 40);
    // frame forces re-projection on every camera move
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, frame, status, layers.comments, clusterKinds]);

  const zoomToCluster = (c) => {
    const map = mapRef.current;
    const lng = c.members.map((m) => m.lngLat[0]);
    const lat = c.members.map((m) => m.lngLat[1]);
    map.fitBounds([[Math.min(...lng), Math.min(...lat)], [Math.max(...lng), Math.max(...lat)]], { padding: 120, maxZoom: 21, duration: flyDuration(900) });
  };

  // ——— Picking pin (drag + keyboard) ———
  const pin = picking?.lngLat && status === "ready" && mapRef.current ? mapRef.current.project(picking.lngLat) : null;
  const dragPin = (ev) => {
    const map = mapRef.current;
    if (!map) return;
    ev.preventDefault();
    const rect = map.getContainer().getBoundingClientRect();
    const move = (e) => { const ll = map.unproject([e.clientX - rect.left, e.clientY - rect.top]); propsRef.current.picking?.onChange([ll.lng, ll.lat]); };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const nudgePin = (ev) => {
    const step = ev.shiftKey ? 24 : 6;
    const d = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] }[ev.key];
    if (!d || !pin) return;
    ev.preventDefault();
    const ll = mapRef.current.unproject([pin.x + d[0], pin.y + d[1]]);
    picking.onChange([ll.lng, ll.lat]);
  };

  const center = mapRef.current?.getCenter?.();
  const camState = mapRef.current ? { center: center ? [center.lng, center.lat] : initialCamera.center, zoom: mapRef.current.getZoom(), bearing: mapRef.current.getBearing(), pitch: mapRef.current.getPitch() } : null;

  return (
    <div className={`mv ${className}`} data-mode={mode} data-status={status}>
      <div ref={containerRef} className="mv__canvas" />

      {status === "loading" && (
        <div className="mv__loading" role="status" aria-live="polite">
          <div className="mv__loading-grid" aria-hidden="true" />
          <span className="mv__loading-label"><span className="mv__spinner" aria-hidden="true" />Loading the map</span>
        </div>
      )}

      {status === "error" && <MapError error={error} />}

      {status === "ready" && mode !== "street" && (
        <div className="mv__markers" aria-label="Map markers">
          {projected.map((m) =>
            m.kind === "cluster" ? (
              <button key={m.id} type="button" className="mk mk--cluster" style={{ transform: `translate(${m.x}px, ${m.y}px)` }} onClick={() => (onMarkerClick ? onMarkerClick(m) : zoomToCluster(m))} aria-label={`${m.count} comments here. Zoom in to see them.`}>
                <span>{m.count}</span>
              </button>
            ) : (
              <Marker key={m.id} m={m} onClick={() => onMarkerClick?.(m)} />
            ),
          )}
          {pin && (
            <button
              type="button"
              className="mk mk--pick"
              style={{ transform: `translate(${pin.x}px, ${pin.y}px)` }}
              onPointerDown={dragPin}
              onKeyDown={nudgePin}
              aria-label="Your comment location. Use arrow keys to move it; hold Shift for bigger steps."
            >
              <Icon name="pin" />
            </button>
          )}
        </div>
      )}

      {mode === "street" && (
        <div className="mv__street">
          <Suspense fallback={<div className="mv__loading"><span className="mv__loading-label"><span className="mv__spinner" />Loading street view</span></div>}>
            <StreetView lngLat={streetTarget || camState?.center || initialCamera.center} onBack={() => onModeChange?.("map")} context={streetContext} />
          </Suspense>
        </div>
      )}

      {satUnavailable && status === "ready" && <SatelliteSetup onBack={() => onModeChange?.("map")} />}

      {modeSwitch && onModeChange && (
        <div className="mv__top">
          <ModeSwitch value={mode} onChange={onModeChange} modes={modes} />
        </div>
      )}

      {controls && status === "ready" && mode !== "street" && (
        <MapControls
          map={mapRef.current}
          mode={mode}
          initialCamera={initialCamera}
          layers={layers}
          onLayers={setLayers}
          hasLegend={!!legend}
          legendOpen={legendOpen}
          onLegend={() => setLegendOpen((v) => !v)}
        />
      )}

      {legend && legendOpen && mode !== "street" && <div className="mv__legend panel-float">{legend}</div>}

      {hud && status === "ready" && mode !== "street" && camState && <MapHud cam={camState} engine={ENGINE} mode={mode} />}

      {children}
    </div>
  );
}

function MapError({ error }) {
  const token = error?.kind === "token";
  return (
    <div className="mv__state" role="alert">
      <div className="empty">
        <div className="empty__icon"><Icon name={token ? "key" : "alert"} /></div>
        <h3 className="t-h3">{token ? "The map token was refused" : error?.kind === "webgl" ? "This browser can't draw the map" : "The map didn't load"}</h3>
        <p className="t-compact t-muted measure">
          {token
            ? "Check VITE_MAPBOX_ACCESS_TOKEN in .env.local and that its URL restrictions allow this site."
            : "Everything on the map is also described in words."}
        </p>
        <a className="btn btn--secondary btn--sm" href="#/projects/alder-8th/text">Open the text-only version</a>
      </div>
    </div>
  );
}

function SatelliteSetup({ onBack }) {
  return (
    <div className="mv__state mv__state--glass" role="status">
      <div className="mv__setup panel-float">
        <span className="badge badge--warning">Setup needed</span>
        <h3 className="t-h3">Satellite imagery needs a Mapbox token</h3>
        <p className="t-compact t-muted">Forma only shows licensed aerial imagery. Add a public token and rebuild:</p>
        <pre className="mv__code">VITE_MAPBOX_ACCESS_TOKEN=pk.…</pre>
        <p className="t-caption t-muted">in <span className="t-mono">.env.local</span> at the project root. Map and 3D keep working with OpenStreetMap tiles.</p>
        <button type="button" className="btn btn--secondary btn--sm" onClick={onBack}><Icon name="map" />Back to Map</button>
      </div>
    </div>
  );
}
