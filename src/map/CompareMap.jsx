import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import MapView from "./MapView.jsx";
import ModeSwitch from "./ModeSwitch.jsx";
import MapControls from "./MapControls.jsx";
import Icon from "../components/Icon.jsx";
import { CAMERA } from "../data/alder.js";

const SceneCompare = lazy(() => import("../components/SceneCompare.jsx"));

/**
 * Before/after with two synchronised maps. Both share one camera (centre, zoom, bearing,
 * pitch), one base style and one environment; only the proposal layer differs.
 * The divider is a slider: drag it, click the track, or use arrow keys (Shift = 10%).
 */
export default function CompareMap({
  left, right, mode = "map", onModeChange, initialCamera = CAMERA.home, position, onPosition, markers = [], onMarkerClick,
  camera, scene, children, label = "Compare today and the proposal",
}) {
  const [internalPos, setInternalPos] = useState(50);
  const pos = position ?? internalPos;
  const setPos = useCallback((v) => { const c = Math.max(0, Math.min(100, Math.round(v * 10) / 10)); onPosition ? onPosition(c) : setInternalPos(c); }, [onPosition]);
  const rootRef = useRef(null);
  const maps = useRef({ a: null, b: null });
  const [topMap, setTopMap] = useState(null);
  const syncing = useRef(false);

  const link = useCallback(() => {
    const { a, b } = maps.current;
    if (!a || !b) return;
    const follow = (from, to) => () => {
      if (syncing.current) return;
      syncing.current = true;
      to.jumpTo({ center: from.getCenter(), zoom: from.getZoom(), bearing: from.getBearing(), pitch: from.getPitch() });
      syncing.current = false;
    };
    a.on("move", follow(a, b));
    b.on("move", follow(b, a));
    // The top map is the one that receives camera targets; align the bottom map to it.
    follow(b, a)();
  }, []);

  const ready = (key) => (map) => { maps.current[key] = map; if (key === "b") setTopMap(map); link(); };

  // Pointer drag on the divider
  const startDrag = (e) => {
    e.preventDefault();
    const rect = rootRef.current.getBoundingClientRect();
    const move = (ev) => setPos(((ev.clientX - rect.left) / rect.width) * 100);
    move(e);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const onKey = (e) => {
    const step = e.shiftKey ? 10 : 5;
    const map = { ArrowLeft: pos - step, ArrowRight: pos + step, ArrowDown: pos - step, ArrowUp: pos + step, Home: 0, End: 100, PageDown: pos - 25, PageUp: pos + 25 };
    if (e.key in map) { e.preventDefault(); setPos(map[e.key]); }
  };

  useEffect(() => () => { maps.current = { a: null, b: null }; }, []);

  const isStreet = mode === "street";

  return (
    <div className="cmp" ref={rootRef} data-mode={mode}>
      {isStreet ? (
        <Suspense fallback={null}>
          <SceneCompare scene={scene} position={pos} />
        </Suspense>
      ) : (
        <>
          <div className="cmp__layer">
            <MapView mode={mode} initialCamera={initialCamera} proposal={left.proposal} showProposal={!!left.proposal} controls={false} modeSwitch={false} hud={false}
              markers={left.markers || []} onMarkerClick={onMarkerClick} onReady={ready("a")} ariaLabel={`${left.label} map`} />
          </div>
          <div className="cmp__layer cmp__layer--top" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
            <MapView mode={mode} initialCamera={initialCamera} camera={camera} proposal={right.proposal} showProposal={!!right.proposal} controls={false} modeSwitch={false} hud={false}
              markers={markers} onMarkerClick={onMarkerClick} onReady={ready("b")} ariaLabel={`${right.label} map`} />
          </div>
        </>
      )}

      <div className="cmp__tag cmp__tag--left" style={{ opacity: pos < 12 ? 0 : 1 }}><span className="cmp__dot" />{left.label}</div>
      <div className="cmp__tag cmp__tag--right" style={{ opacity: pos > 88 ? 0 : 1 }}><span className="cmp__dot cmp__dot--accent" />{right.label}</div>

      <div className="cmp__divider" style={{ left: `${pos}%` }} onPointerDown={startDrag}>
        <div
          className="cmp__handle"
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-valuetext={`${Math.round(pos)}% ${left.label}, ${Math.round(100 - pos)}% ${right.label}`}
          onKeyDown={onKey}
        >
          <Icon name="chevronRight" style={{ transform: "scaleX(-1)" }} />
          <Icon name="chevronRight" />
        </div>
      </div>

      {onModeChange && <div className="mv__top"><ModeSwitch value={mode} onChange={onModeChange} /></div>}
      {!isStreet && topMap && (
        <div className="cmp__controls">
          <MapControls map={topMap} mode={mode} initialCamera={initialCamera} layers={{ existing: true, proposal: true, comments: true }} onLayers={() => {}} hideLayers />
        </div>
      )}
      {children}
    </div>
  );
}
