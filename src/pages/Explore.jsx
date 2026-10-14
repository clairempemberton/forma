import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { FeatureId, Legend, LEGEND_PROPOSAL, Notice, Steps, Truth } from "../components/ui.jsx";
import { EXISTING_FEATURES, OPTIONS, OPTION_BY_ID, CAMERA, COPY, F, LEGEND, optName, optTag } from "../data/featured.js";
import { point } from "../lib/geo.js";
import { useMapMode, useParam } from "../lib/useMapMode.js";

// R04 · Existing conditions — step 1 of the guided proposal walkthrough.
export default function Explore() {
  const [mode, setMode] = useMapMode();
  const [show, setShow] = useParam("show", "today");
  const [sel, setSel] = useParam("f");
  const navigate = useNavigate();
  const option = OPTION_BY_ID[show];
  const selected = EXISTING_FEATURES.find((f) => f.id === sel);

  const markers = useMemo(() => EXISTING_FEATURES.map((f) => ({
    id: f.id, kind: "feature", fid: f.id, label: f.name, lngLat: f.lngLat, featureKind: f.kind,
    selected: f.id === sel, dim: !!sel && f.id !== sel, showLabel: f.id === sel,
  })), [sel]);

  const camera = useMemo(() => (selected ? { center: selected.lngLat, zoom: 19.3, bearing: 0, pitch: 0 } : null), [selected]);
  const focus = selected ? point(F, F.toLocal(selected.lngLat), {}) : null;

  return (
    <main id="main" tabIndex={-1} className="map-page">
      <section className="map-page__panel" aria-labelledby="explore-title">
        <div className="map-page__scroll stack" style={{ "--stack": "20px" }}>
          <div className="stack" style={{ "--stack": "10px" }}>
            <p className="t-eyebrow">Step 1 of 3 · Today</p>
            <h1 id="explore-title" className="t-h2">{COPY.exploreTitle}</h1>
            <p className="t-compact t-muted">{COPY.exploreLead} Select anything on the map, or use the list below with a keyboard.</p>
          </div>

          <div className="seg" role="radiogroup" aria-label="Show on the map" style={{ width: "100%" }}>
            {[{ id: "today", label: "Today" }, ...OPTIONS.map((o) => ({ id: o.id, label: optTag(o.id) }))].map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={show === o.id} className="seg__btn" onClick={() => setShow(o.id)}
                style={show === o.id ? { background: "var(--surface)", boxShadow: "0 1px 2px rgba(14,17,22,.08), 0 0 0 1px var(--hairline)" } : undefined}>
                {o.label}
              </button>
            ))}
          </div>
          {option && <Notice tone="accent" icon="layers"><strong>{optName(option.id)} · {option.name}.</strong> {option.summary}</Notice>}

          <ul className="rows" aria-label={COPY.featuresLabel}>
            {EXISTING_FEATURES.map((f) => (
              <li key={f.id}>
                <button type="button" className="rowbtn" aria-pressed={sel === f.id} onClick={() => setSel(sel === f.id ? null : f.id)}>
                  <FeatureId id={f.id} />
                  <span className="rowbtn__main"><span className="rowbtn__title">{f.name}</span><span className="rowbtn__sub">{f.summary}</span></span>
                  <Icon name="chevronRight" />
                </button>
                {sel === f.id && (
                  <div className="explore__facts">
                    <ul className="stack" style={{ "--stack": "6px" }}>
                      {f.facts.map((t) => <li key={t} className="t-compact">{t}</li>)}
                    </ul>
                    <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}>
                      <Truth kind="osm">OpenStreetMap · {COPY.agencyShort} where noted</Truth>
                      <Link className="link" to={`../inspect/${f.id}`}>Inspect {f.id}<Icon name="arrowRight" /></Link>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <Notice icon="info">Existing conditions come from OpenStreetMap and may be incomplete. {COPY.drawingNote}</Notice>
        </div>
        <div className="map-page__foot">
          <Steps total={3} current={0} />
          <span className="t-caption t-muted t-num" style={{ flex: "none" }}>1 of 3</span>
          <button type="button" className="btn btn--accent" onClick={() => navigate("../compare")}>See what could change<Icon name="arrowRight" /></button>
        </div>
      </section>

      <div className="map-page__map">
        <MapView
          mode={mode}
          onModeChange={setMode}
          initialCamera={CAMERA.home}
          camera={camera}
          proposal={option?.geojson || null}
          showProposal={!!option}
          focus={focus}
          markers={markers}
          onMarkerClick={(m) => setSel(sel === m.id ? null : m.id)}
          legend={<Legend items={LEGEND || LEGEND_PROPOSAL} />}
          streetTarget={selected?.lngLat}
          streetContext={COPY.streetContext}
        />
        <div className="map-chip glass" aria-live="polite"><Icon name="eye" />Showing: <strong>{option ? optName(option.id) : "Today"}</strong></div>
      </div>
    </main>
  );
}
