import { useMemo, useRef, useState } from "react";
import { prefersReducedMotion, useIsMobile } from "../lib/motion.js";
import { Link } from "react-router-dom";
import CompareMap from "../map/CompareMap.jsx";
import ModeSwitch from "../map/ModeSwitch.jsx";
import Icon from "../components/Icon.jsx";
import { Notice, StatusBadge, Truth, fmtDate } from "../components/ui.jsx";
import { CAMERA, COPY, DECISION, PROJECT, REVISION_CHANGES, SOURCES, THEME_BY_ID, VERSIONS, optName } from "../data/featured.js";
import { useMapMode, useParam } from "../lib/useMapMode.js";
import { CHANGE_STATUS, TOTAL_COMMENTS, fitCamera } from "./outcomes-shared.js";
import "./outcomes.css";

const derive = () => ({
  V1: VERSIONS[0], V2: VERSIONS[1],
  MADE: REVISION_CHANGES.filter((c) => c.status === "changed").length,
  START: fitCamera(REVISION_CHANGES.map((c) => c.lngLat), { px: 300, fallback: CAMERA.home }),
});
const MONTH = { month: "short", year: "numeric" };

// R16 · Revision reveal — how the chosen option was refined between the feedback round and the decision.
export default function Revision() {
  const { V1, V2, MADE, START } = useMemo(derive, []);
  const [mode, setMode] = useMapMode();
  const [sel, setSel] = useParam("change");
  const [pos, setPos] = useState(50);
  const change = REVISION_CHANGES.find((c) => c.id === sel) || null;

  const isMobile = useIsMobile();
  const mapRef = useRef(null);
  const pick = (id, fromList) => {
    setSel(id === sel ? null : id);
    // On phones the map sits above the list; bring it back into view to show the change.
    if (fromList && isMobile && id !== sel) mapRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  const markers = useMemo(() => REVISION_CHANGES.map((c, i) => ({
    id: c.id, kind: "change", index: i + 1, lngLat: c.lngLat, label: c.title,
    selected: c.id === sel, dim: !!sel && c.id !== sel,
    ariaLabel: `Change ${i + 1}: ${c.title} (${CHANGE_STATUS[c.status].label.toLowerCase()})`,
  })), [sel]);

  const camera = useMemo(() => (change ? { center: change.lngLat, zoom: 18.6, bearing: 0, pitch: 0 } : null), [change]);

  return (
    <main id="main" tabIndex={-1} className="map-page rev">
      <section className="map-page__panel" aria-labelledby="rev-title">
        <div className="map-page__scroll stack" style={{ "--stack": "20px" }}>
          <div className="stack" style={{ "--stack": "10px" }}>
            <p className="t-eyebrow">{optName(DECISION.chosen)} · {V1.label} → {V2.label}</p>
            <h1 id="rev-title" className="t-h2">How {optName(DECISION.chosen)} was refined</h1>
            <p className="t-compact t-muted">{V2.note} {MADE} of {REVISION_CHANGES.length} requests {PROJECT.agency} weighed after {COPY.round} changed the design; the others were not adopted, and this page says why. From the <a className="link" href={SOURCES.decision.url} target="_blank" rel="noreferrer">{COPY.decisionDoc}<Icon name="external" /><span className="sr-only">(opens in a new tab)</span></a>.</p>
          </div>

          <div className="rev__versions" aria-label="Versions compared">
            <div><span className="cmp__dot" aria-hidden="true" /><span><strong>{V1.label}</strong><span className="t-muted"> · {fmtDate(V1.date, MONTH)} · left</span></span></div>
            <div><span className="cmp__dot cmp__dot--accent" aria-hidden="true" /><span><strong>{V2.label}</strong><span className="t-muted"> · {fmtDate(V2.date, MONTH)} · right</span></span></div>
          </div>

          <ol className="rev__list" aria-label={`Changes between the ${V1.label.toLowerCase()} and ${V2.label.toLowerCase()} versions`}>
            {REVISION_CHANGES.map((c, i) => {
              const st = CHANGE_STATUS[c.status];
              const on = sel === c.id;
              return (
                <li key={c.id} className="rev__item" data-on={on} data-status={c.status}>
                  <button type="button" className="rev__btn" aria-pressed={on} aria-controls={`rev-${c.id}`} onClick={() => pick(c.id, true)}>
                    <span className="rev__num" aria-hidden="true">{i + 1}</span>
                    <span className="rev__btn-title">{c.title}</span>
                    <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                  </button>
                  <div id={`rev-${c.id}`} className="rev__body">
                    <dl className="rev__ba">
                      <div><dt>{V1.label}</dt><dd>{c.before}</dd></div>
                      <div><dt>{V2.label}</dt><dd>{c.after}</dd></div>
                    </dl>
                    <div className="rev__themes">
                      <span className="t-caption t-muted">Raised in</span>
                      {c.themes.map((tid) => (
                        <Link key={tid} className="rev__theme" to={`../themes?t=${tid}`}>
                          {THEME_BY_ID[tid].name}<span className="t-num"> · {THEME_BY_ID[tid].count} sample</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <Notice icon="info">{COPY.revisionNote} Drag the divider, or focus it and use the arrow keys, to compare the same place from the same camera. Based on {TOTAL_COMMENTS} sample comments and {PROJECT.agency}'s reported themes.</Notice>
        </div>
        <div className="map-page__foot">
          <Truth kind="illustrative" />
          <span className="spacer" />
          <Link className="btn btn--accent" to="../decision">Read the decision<Icon name="arrowRight" /></Link>
        </div>
      </section>

      <div className="map-page__map" ref={mapRef}>
        <CompareMap
          left={{ label: `${V1.label} · ${fmtDate(V1.date, MONTH)}`, proposal: V1.geojson, markers }}
          right={{ label: `${V2.label} · ${fmtDate(V2.date, MONTH)}`, proposal: V2.geojson }}
          markers={markers}
          onMarkerClick={(m) => m.kind === "change" && pick(m.id)}
          mode={mode}
          initialCamera={START}
          camera={camera}
          position={pos}
          onPosition={setPos}
          label={`Compare the ${V1.label.toLowerCase()} and ${V2.label.toLowerCase()} versions`}
        >
          <div className="mv__top"><ModeSwitch value={mode} onChange={setMode} /></div>
          {change && (
            <div className="rev__pop panel-float" aria-live="polite">
              <div className="row">
                <span className="rev__num rev__num--sm" aria-hidden="true">{REVISION_CHANGES.indexOf(change) + 1}</span>
                <strong className="t-compact">{change.title}</strong>
                <span className="spacer" />
                <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Close" onClick={() => setSel(null)}><Icon name="close" /></button>
              </div>
              <p className="t-caption t-muted">{change.after}</p>
            </div>
          )}
        </CompareMap>
      </div>
    </main>
  );
}
