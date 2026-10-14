import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MapView from "../map/MapView.jsx";
import { MODES } from "../map/engine.js";
import Icon from "../components/Icon.jsx";
import { FeatureId, Notice } from "../components/ui.jsx";
import { CAMERA, EXISTING_FEATURES, ORIGIN, SURVEY, PROJECT_BASE, COPY } from "../data/featured.js";
import { formatCoord } from "../lib/geo.js";
import { useMapMode } from "../lib/useMapMode.js";
import { updateDraft, useStore } from "../lib/store.js";
import { FlowSteps, describePlace, fmtMeters, nearestFeature } from "./participate-shared.jsx";
import { inProjectArea } from "../data/featured.js";
import "./participate.css";

const PICK_MODES = MODES.filter((m) => m.id === "map" || m.id === "3d");

function parseAt(v) {
  if (!v) return null;
  const [lng, lat] = v.split(",").map(Number);
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lng, lat];
}

const METHODS = [
  { id: "map", title: "A spot on the map", icon: "locate", sub: "Click the map, then drag the pin or use the arrow keys." },
  { id: "feature", title: "A feature from the list", icon: "list", sub: "Crossings, signals, bus stops and lanes." },
  { id: "describe", title: "Describe the location instead", icon: "text", sub: "If the map is hard to use, tell us in words." },
];

// R10 · Place feedback — choose a location (step 1 of 3).
export default function FeedbackPlace() {
  const [mode, setMode] = useMapMode();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const draft = useStore((s) => s.draft);
  const [method, setMethod] = useState(draft?.locMode || "map");
  const [error, setError] = useState(null);
  const [camera, setCamera] = useState(null);
  const describeRef = useRef(null);

  // ?at=lng,lat from "Add yours" on a comment or a feature drops the pin there.
  useEffect(() => {
    const at = parseAt(params.get("at"));
    if (at) { updateDraft({ lngLat: at, placeLabel: describePlace(at), featureId: null, locMode: "map" }); setMethod("map"); setCamera({ center: at, zoom: 19.3, bearing: 0, pitch: 0 }); }
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lngLat = method === "describe" ? null : draft?.lngLat || null;
  const near = lngLat ? nearestFeature(lngLat) : null;
  const outside = !!lngLat && !inProjectArea(lngLat);
  const chosenFeature = draft?.featureId ? EXISTING_FEATURES.find((f) => f.id === draft.featureId) : null;
  const label = chosenFeature && method === "feature" ? chosenFeature.name : describePlace(lngLat);

  const setPin = (ll) => {
    setError(null);
    if (method !== "map") setMethod("map");
    updateDraft({ lngLat: ll, placeLabel: describePlace(ll), featureId: null, locMode: "map" });
  };
  const pickFeature = (f) => {
    setError(null);
    setMethod("feature");
    updateDraft({ lngLat: f.lngLat, placeLabel: `${f.name} (${f.id})`, featureId: f.id, locMode: "feature" });
    setCamera({ center: f.lngLat, zoom: 19.2, bearing: 0, pitch: 0 });
  };
  const chooseMethod = (id) => {
    setMethod(id);
    setError(null);
    if (id === "describe") { updateDraft({ locMode: "describe" }); setTimeout(() => describeRef.current?.focus(), 0); }
    else updateDraft({ locMode: id });
  };

  const markers = useMemo(() => EXISTING_FEATURES.map((f) => ({
    id: f.id, kind: "feature", fid: f.id, label: f.name, lngLat: f.lngLat, featureKind: f.kind,
    selected: draft?.featureId === f.id && method === "feature", showLabel: draft?.featureId === f.id && method === "feature",
    dim: method === "describe", ariaLabel: `Choose ${f.id}, ${f.name}`,
  })), [draft?.featureId, method]);

  const next = () => {
    if (method === "describe") {
      const text = (draft?.describe || "").trim();
      if (text.length < 5) { setError("Describe where your comment is about, for example “the crossing at 36th, south side”."); describeRef.current?.focus(); return; }
      updateDraft({ lngLat: ORIGIN, placeLabel: "Described in words", featureId: null, locMode: "describe" });
      navigate(`${PROJECT_BASE}/feedback/compose?describe=1`);
      return;
    }
    if (!lngLat) { setError("Choose a spot first: click the map, pick a feature, or describe the location."); return; }
    navigate(`${PROJECT_BASE}/feedback/compose`);
  };

  return (
    <main id="main" tabIndex={-1} className="map-page pt-place">
      <section className="map-page__panel" aria-labelledby="place-title">
        <div className="map-page__scroll stack" style={{ "--stack": "20px" }}>
          <div className="stack" style={{ "--stack": "12px" }}>
            <FlowSteps step={1} label="Where" />
            <h1 id="place-title" className="t-h2">Where is your comment about?</h1>
            <p className="t-compact t-muted">Point to the exact spot. We keep only the pin, never your address, and you don't need an account.</p>
          </div>

          <Notice icon="history"><strong>A replay of {COPY.round}.</strong> Comment as if it were {SURVEY.window}, {COPY.replayContext}</Notice>

          <fieldset className="pt-methods">
            <legend className="sr-only">How do you want to choose the location?</legend>
            {METHODS.map((m) => (
              <label key={m.id} className="choice pt-method">
                <input type="radio" name="loc-method" value={m.id} checked={method === m.id} onChange={() => chooseMethod(m.id)} />
                <span className="pt-method__main">
                  <span className="pt-method__title">{m.title}</span>
                  <span className="t-caption t-muted">
                    {m.id === "map" && method === "map" && lngLat ? `Pinned: ${describePlace(lngLat)}` : m.id === "feature" && chosenFeature && method === "feature" ? `Chosen: ${chosenFeature.id} · ${chosenFeature.name}` : m.sub}
                  </span>
                </span>
                <Icon name={m.icon} className="pt-method__icon" />
              </label>
            ))}
          </fieldset>

          {method === "feature" && (
            <ul className="rows" aria-label={COPY.featuresLabel}>
              {EXISTING_FEATURES.map((f) => (
                <li key={f.id}>
                  <button type="button" className="rowbtn" aria-pressed={draft?.featureId === f.id} onClick={() => pickFeature(f)}>
                    <FeatureId id={f.id} />
                    <span className="rowbtn__main"><span className="rowbtn__title">{f.name}</span><span className="rowbtn__sub">{f.summary}</span></span>
                    {draft?.featureId === f.id ? <Icon name="check" className="pt-ok" /> : <Icon name="chevronRight" />}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {method === "describe" && (
            <div className="field">
              <label className="field__label" htmlFor="describe">Where is it?</label>
              <textarea
                id="describe" ref={describeRef} className="textarea" rows={4} maxLength={300}
                value={draft?.describe || ""} onChange={(e) => { setError(null); updateDraft({ describe: e.target.value, locMode: "describe" }); }}
                aria-invalid={!!error} aria-describedby={`describe-hint${error ? " place-error" : ""}`}
                placeholder={COPY.describePlaceholder}
              />
              <p id="describe-hint" className="field__hint">The team will place it on the map for you. Your words are only used to find the spot.</p>
            </div>
          )}

          {method !== "describe" && (
            <div className={`pt-picked ${lngLat ? "" : "pt-picked--empty"}`} aria-live="polite">
              {lngLat ? (
                <>
                  <span className="pt-picked__icon" aria-hidden="true"><Icon name="pin" /></span>
                  <div className="stack" style={{ "--stack": "4px", minWidth: 0 }}>
                    <p className="pt-picked__title">{label}</p>
                    <p className="t-caption t-muted">Nearest feature: <strong className="pt-strong">{near.feature.id} · {near.feature.name}</strong>, {fmtMeters(near.distance)} away</p>
                    <p className="t-caption t-muted t-mono">{formatCoord(lngLat)}</p>
                  </div>
                </>
              ) : (
                <p className="t-compact t-muted"><Icon name="locate" className="pt-inline-icon" />No spot chosen yet. Click anywhere on the map to drop a pin.</p>
              )}
            </div>
          )}

          {outside && method !== "describe" && (
            <Notice tone="warning" icon="alert">This spot is outside the project area. The team can read it, but may not be able to change anything there.</Notice>
          )}
          {error && <p id="place-error" className="field__error" role="alert"><Icon name="alert" />{error}</p>}
        </div>
        <div className="map-page__foot">
          <button type="button" className="btn btn--ghost" onClick={() => navigate(`${PROJECT_BASE}/perspectives`)}>Cancel</button>
          <span className="spacer" />
          <button type="button" className="btn btn--accent" onClick={next}>Continue<Icon name="arrowRight" /></button>
        </div>
      </section>

      <div className="map-page__map">
        <MapView
          mode={mode}
          onModeChange={setMode}
          modes={PICK_MODES}
          initialCamera={CAMERA.home}
          camera={camera}
          markers={markers}
          onMarkerClick={(m) => { const f = EXISTING_FEATURES.find((x) => x.id === m.id); if (f) pickFeature(f); }}
          picking={method === "describe" ? null : { lngLat, onChange: setPin }}
          ariaLabel={`${COPY.pickMapLabel} Click to place your comment pin.`}
        >
          {method !== "describe" && (
            <div className="pt-maphint glass" aria-hidden="true">
              <Icon name={lngLat ? "pin" : "locate"} />
              {lngLat ? "Drag the pin to fine-tune" : "Click the map to drop a pin"}
            </div>
          )}
          {method === "describe" && (
            <div className="pt-mapveil" aria-hidden="true"><span className="glass">Describing in words — the map is for reference only</span></div>
          )}
        </MapView>
      </div>
    </main>
  );
}
