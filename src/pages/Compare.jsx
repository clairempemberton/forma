import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CompareMap from "../map/CompareMap.jsx";
import ModeSwitch from "../map/ModeSwitch.jsx";
import { MODES } from "../map/engine.js";
import Icon from "../components/Icon.jsx";
import { Notice, Steps, Truth } from "../components/ui.jsx";
import { OPTIONS, OPTION_BY_ID, DECISION, CAMERA, COPY, PROJECT, countWord, optName, optTag } from "../data/featured.js";
import { useMapMode, useParam } from "../lib/useMapMode.js";
import { useReducedMotion, useIsMobile } from "../lib/motion.js";
import { NOTICE, PROJECT_BASE, noticeLngLat, wordsFor } from "./proposal-lib.js";
import "./proposal.css";

// CAMERA.compare frames the whole project area, so every numbered change is in view.
// No matched street-level renders exist for these projects, so the compare offers map views only.
const COMPARE_MODES = MODES.filter((m) => m.id !== "street");

// R05 · Before–after slider — step 2 of the guided walkthrough.
// Same street, same camera, same base map: only the proposal layer differs between the sides.
export default function Compare() {
  const [viewMode, setMode] = useMapMode();
  const mode = viewMode === "street" ? "map" : viewMode;
  const [optParam, setOptParam] = useParam("option", DECISION.chosen);
  const option = OPTION_BY_ID[optParam] || OPTION_BY_ID[DECISION.chosen];
  const [pos, setPos] = useState(50);
  const [swapped, setSwapped] = useState(false);
  const [words, setWords] = useState(false);
  const [active, setActive] = useState(null);
  const [camera, setCamera] = useState(null);
  const touched = useRef(false);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const wordsId = useId();
  const cardRefs = useRef([]);

  const notices = NOTICE[option.id];
  const rows = useMemo(() => wordsFor(option), [option]);

  // A single, gentle sweep the first time someone lands here, so the slider explains itself.
  useEffect(() => {
    if (reduced) return;
    try { if (sessionStorage.getItem("forma-compare-peek")) return; } catch { /* storage off */ }
    let raf = 0;
    const keys = [50, 36, 64, 50];
    const dur = 2200;
    const timer = setTimeout(() => {
      try { sessionStorage.setItem("forma-compare-peek", "1"); } catch { /* storage off */ }
      const t0 = performance.now();
      const tick = (now) => {
        if (touched.current) return;
        const t = Math.min(1, (now - t0) / dur);
        const seg = Math.min(keys.length - 2, Math.floor(t * (keys.length - 1)));
        const local = t * (keys.length - 1) - seg;
        const e = local < 0.5 ? 4 * local ** 3 : 1 - (-2 * local + 2) ** 3 / 2;
        setPos(keys[seg] + (keys[seg + 1] - keys[seg]) * e);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, 1600);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [reduced]);

  const userPos = (v) => { touched.current = true; setPos(v); };

  const today = { label: "Today", proposal: null };
  const proposed = { label: `${optTag(option.id)} · ${option.short}`, proposal: option.geojson };
  const markers = notices.map((n, i) => ({
    id: `n${i}`, kind: "change", index: i + 1, lngLat: noticeLngLat(n), label: n.title, selected: active === i,
    ariaLabel: `${i + 1}. ${n.title}`,
  }));
  const left = swapped ? { ...proposed, markers } : today;
  const right = swapped ? today : proposed;

  const home = mobile ? CAMERA.home : CAMERA.compare;
  // Fly both sides to a change and slide the divider so the proposed side shows it.
  const focusNotice = (i) => {
    if (i == null || i === active) { setActive(null); setCamera({ ...home }); return; }
    setActive(i);
    setCamera({ center: noticeLngLat(notices[i]), zoom: 19.2, bearing: 0, pitch: 0 });
    userPos(swapped ? 72 : 28);
  };
  const pick = (i) => {
    focusNotice(i);
    cardRefs.current[i]?.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  };

  const wordsTable = (
    <div className="table-wrap cmp-pg__table">
      <table className="table">
        <caption className="cmp-pg__caption">
          Today compared with {optName(option.id)}, one row per change. <Truth kind="illustrative" />
        </caption>
        <thead><tr><th scope="col">Change</th><th scope="col">Today</th><th scope="col">{optName(option.id)}</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.change}>
              <th scope="row" className="cmp-pg__rowhead">{r.fid ? <Link className="link" to={`${PROJECT_BASE}/inspect/${r.fid}`}>{r.fid}</Link> : <span className="t-muted">—</span>}</th>
              <td>{r.today}</td>
              <td><strong>{r.change}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <main id="main" tabIndex={-1} className="map-page cmp-pg">
      <section className="map-page__panel" aria-labelledby="cmp-title">
        <div className="map-page__scroll stack" style={{ "--stack": "20px" }}>
          <div className="stack" style={{ "--stack": "10px" }}>
            <p className="t-eyebrow">Step 2 of 3 · Today vs {optName(option.id)}</p>
            <h1 id="cmp-title" className="t-h2">Three things you'd notice first</h1>
            <p className="t-compact t-muted">{COPY.compareLead}</p>
          </div>

          <ol className="cmp-pg__cards" aria-label={`What ${optName(option.id)} changes`}>
            {notices.map((n, i) => (
              <li key={`${option.id}-${i}`} ref={(el) => (cardRefs.current[i] = el)} className="cmp-pg__card" data-active={active === i}>
                <span className="cmp-pg__num" aria-hidden="true">{i + 1}</span>
                <div className="stack" style={{ "--stack": "6px" }}>
                  <h2 className="cmp-pg__card-title">{n.title}</h2>
                  <p className="t-compact t-muted">{n.body}</p>
                  <div className="row cmp-pg__card-actions">
                    {n.fid && <Link className="link" to={`${PROJECT_BASE}/inspect/${n.fid}`}>Inspect {n.fid}<Icon name="arrowRight" /></Link>}
                    <button type="button" className="cmp-pg__locate" aria-pressed={active === i} onClick={() => focusNotice(i)}>
                      <Icon name="locate" />{active === i ? "Shown on map" : "Show on map"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {mobile && (
            <div className="stack" style={{ "--stack": "10px" }}>
              <button type="button" className="btn btn--secondary btn--block" aria-expanded={words} aria-controls={wordsId} onClick={() => setWords((v) => !v)}>
                <Icon name="text" />{words ? "Hide the comparison in words" : "Compare in words"}
              </button>
              {words && <div id={wordsId}>{wordsTable}</div>}
            </div>
          )}

          <Link to={`${PROJECT_BASE}/alternatives?option=${option.id}`} className="cmp-pg__alt">
            <span className="cmp-pg__alt-icon" aria-hidden="true"><Icon name="layers" /></span>
            <span className="rowbtn__main">
              <span className="rowbtn__title">See all {countWord(OPTIONS.length)} {COPY.alts} side by side</span>
              <span className="rowbtn__sub">What {OPTIONS.map((o) => o.id).join(", ").replace(/, ([^,]*)$/, " and $1")} each trade, on the same camera</span>
            </span>
            <Icon name="chevronRight" />
          </Link>

          <Notice icon="info">{COPY.compareNote(optName(option.id))}</Notice>
        </div>
        <div className="map-page__foot">
          <Link to={`${PROJECT_BASE}/explore`} className="btn btn--secondary btn--icon" aria-label="Back to today's street"><Icon name="arrowLeft" /></Link>
          <Steps total={3} current={1} />
          <Link to={`${PROJECT_BASE}/feedback`} className="btn btn--accent"><Icon name="comment" />Comment on what you see</Link>
        </div>
      </section>

      <div className="map-page__map">
        <CompareMap
          left={left}
          right={right}
          markers={swapped ? [] : markers}
          onMarkerClick={(m) => m.kind === "change" && pick(m.index - 1)}
          mode={mode}
          initialCamera={home}
          camera={camera}
          position={pos}
          onPosition={userPos}
          label={`Compare ${left.label} and ${right.label}`}
        >
          <div className="mv__top"><ModeSwitch value={mode} onChange={setMode} modes={COMPARE_MODES} /></div>
          {words && !mobile && (
            <section id={wordsId} className="cmp-pg__words panel-float" aria-labelledby={`${wordsId}-h`}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div className="stack" style={{ "--stack": "4px" }}>
                  <p className="t-eyebrow">In words</p>
                  <h2 id={`${wordsId}-h`} className="t-h3" tabIndex={-1}>Today and {optName(option.id)}</h2>
                </div>
                <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Close the comparison in words" onClick={() => setWords(false)}><Icon name="close" /></button>
              </div>
              {wordsTable}
            </section>
          )}

          <div className="map-toolbar glass cmp-pg__toolbar" role="toolbar" aria-label="Compare controls">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSwapped((s) => !s)} aria-pressed={swapped}>
              <Icon name="swap" /><span>Swap sides</span>
            </button>
            <span className="sep" aria-hidden="true" />
            <div className="seg cmp-pg__opts" role="radiogroup" aria-label={`${COPY.alt} to compare with today`}>
              {OPTIONS.map((o) => (
                <button key={o.id} type="button" role="radio" aria-checked={o.id === option.id} className="seg__btn"
                  onClick={() => { setOptParam(o.id); if (active != null) { setActive(null); setCamera({ ...home }); } }}>
                  <span className="cmp-pg__opt-long">{COPY.altShort} </span>{o.id}
                </button>
              ))}
            </div>
            <span className="sep" aria-hidden="true" />
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => userPos(50)} disabled={Math.round(pos) === 50}>
              <Icon name="reset" /><span className="cmp-pg__hide-sm">Reset to 50%</span><span className="cmp-pg__show-sm">50%</span>
            </button>
            {!mobile && (
              <>
                <span className="sep" aria-hidden="true" />
                <button type="button" className="btn btn--ghost btn--sm" aria-pressed={words} aria-expanded={words} aria-controls={wordsId}
                  onClick={() => { setWords((v) => !v); requestAnimationFrame(() => document.getElementById(`${wordsId}-h`)?.focus()); }}>
                  <Icon name="text" />Compare in words
                </button>
                <span className="sep cmp-pg__kbd-sep" aria-hidden="true" />
                <span className="cmp-pg__kbd" aria-hidden="true">
                  <kbd>←</kbd><kbd>→</kbd><span>5%</span><kbd>⇧</kbd><span>10%</span>
                </span>
              </>
            )}
          </div>
          <p className="sr-only">Focus the slider handle and use the left and right arrow keys to move it 5 percent, or 10 percent with Shift. Home and End jump to either side.</p>
        </CompareMap>
        <p className="sr-only" aria-live="polite">{`${left.label} on the left, ${right.label} on the right.`}</p>
      </div>
    </main>
  );
}
