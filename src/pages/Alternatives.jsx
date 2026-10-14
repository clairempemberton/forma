import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MapView from "../map/MapView.jsx";
import CompareMap from "../map/CompareMap.jsx";
import Icon from "../components/Icon.jsx";
import { Legend, LEGEND_PROPOSAL, Notice, Truth, fmtDate } from "../components/ui.jsx";
import { OPTIONS, OPTION_BY_ID, SAMPLE_COMMENTS, THEME_BY_ID, CAMERA, DECISION } from "../data/alder.js";
import { useMapMode, useParam } from "../lib/useMapMode.js";
import { MATRIX, PROJECT_BASE, useMedia } from "./proposal-lib.js";
import "./proposal.css";

// R06 · Alternatives — A, B and C on one map with one camera. Switching only swaps the proposal layer.
export default function Alternatives() {
  const [mode, setMode] = useMapMode();
  const [optParam, setOptParam] = useParam("option", "A");
  const [layout, setLayout] = useParam("layout", "one");
  const [leftId, setLeftId] = useParam("left", "A");
  const [rightId, setRightId] = useParam("right", "B");
  const [selComment, setSelComment] = useState(null);
  const wide = useMedia("(min-width: 1280px)");
  const option = OPTION_BY_ID[optParam] || OPTION_BY_ID.A;
  const side = layout === "side";
  const L = OPTION_BY_ID[leftId] || OPTION_BY_ID.A;
  const R = OPTION_BY_ID[rightId] || OPTION_BY_ID.B;

  const comments = useMemo(() => SAMPLE_COMMENTS.filter((c) => c.option === option.id), [option.id]);
  const markers = useMemo(() => comments.map((c) => ({
    id: c.id, kind: "comment", lngLat: c.lngLat, label: c.text, selected: selComment === c.id, ariaLabel: `Comment on Option ${c.option}: ${c.text}`,
  })), [comments, selComment]);

  const choose = (id) => { setOptParam(id); setSelComment(null); };
  const onMarker = (m) => {
    if (m.kind === "cluster") setSelComment(m.members[0].id);
    else if (m.kind === "comment") setSelComment(selComment === m.id ? null : m.id);
  };

  const matrix = <Matrix current={option.id} />;

  return (
    <main id="main" tabIndex={-1} className={`map-page alt-pg ${wide ? "alt-pg--three" : ""}`}>
      <section className="map-page__panel" aria-labelledby="alt-title">
        <div className="map-page__scroll stack" style={{ "--stack": "20px" }}>
          <div className="stack" style={{ "--stack": "10px" }}>
            <p className="t-eyebrow">Three options · equal weight</p>
            <h1 id="alt-title" className="t-h2">What each one trades</h1>
            <p className="t-compact t-muted">Same corner, same camera. Switching options only changes what's drawn on the map.</p>
          </div>

          <fieldset className="alt-pg__options">
            <legend className="sr-only">Option shown on the map</legend>
            {OPTIONS.map((o) => {
              const on = o.id === option.id;
              return (
                <div key={o.id} className="alt-pg__opt" data-on={on}>
                  <label className="alt-pg__opt-head">
                    <input type="radio" name="alt-option" value={o.id} checked={on} onChange={() => choose(o.id)} />
                    <span className="alt-pg__opt-name"><span className="alt-pg__letter">{o.id}</span>{o.name}</span>
                    {on && <span className="badge badge--accent badge--plain">On map</span>}
                  </label>
                  {on ? (
                    <div className="alt-pg__opt-body stack" style={{ "--stack": "14px" }}>
                      <p className="t-compact">{o.summary}</p>
                      <div>
                        <h2 className="alt-pg__h">Key changes</h2>
                        <ul className="alt-pg__list">{o.changes.map((t) => <li key={t}>{t}</li>)}</ul>
                      </div>
                      <div className="alt-pg__trade">
                        <div>
                          <h2 className="alt-pg__h alt-pg__h--gain">Gains</h2>
                          <ul className="alt-pg__list alt-pg__list--gain">{o.benefits.map((t) => <li key={t}>{t}</li>)}</ul>
                        </div>
                        <div>
                          <h2 className="alt-pg__h alt-pg__h--cost">Costs</h2>
                          <ul className="alt-pg__list alt-pg__list--cost">{o.tradeoffs.map((t) => <li key={t}>{t}</li>)}</ul>
                        </div>
                      </div>
                      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                        <Truth kind="illustrative" />
                        <Link className="link" to={`${PROJECT_BASE}/evidence`}>Evidence and assumptions<Icon name="arrowRight" /></Link>
                      </div>
                    </div>
                  ) : (
                    <p className="alt-pg__opt-sub t-compact t-muted">{o.short}</p>
                  )}
                </div>
              );
            })}
          </fieldset>

          <section className="stack" style={{ "--stack": "10px" }} aria-labelledby="alt-voices">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 id="alt-voices" className="t-h3 alt-pg__h3">What people said about Option {option.id}</h2>
              <span className="badge badge--voice t-num">{comments.length}</span>
            </div>
            {comments.length ? (
              <ul className="alt-pg__comments">
                {comments.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="alt-pg__comment" aria-pressed={selComment === c.id} onClick={() => setSelComment(selComment === c.id ? null : c.id)}>
                      <span className="alt-pg__quote">“{c.text}”</span>
                      <span className="t-caption t-muted">{c.author} · {THEME_BY_ID[c.theme]?.name} · {fmtDate(c.date, { month: "short", day: "numeric" })}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="t-compact t-muted">No sample comments mention this option directly.</p>}
            <Truth kind="sample" />
          </section>

          {!wide && matrix}

          <Notice icon="info">All three options are shown in the same format and at the same size. Round 1 took Option {DECISION.chosen} forward; A and B stay here so you can see what was traded.</Notice>
        </div>
        <div className="map-page__foot">
          <Link to={`${PROJECT_BASE}/compare?option=${option.id}`} className="btn btn--secondary"><Icon name="arrowLeft" />Compare with today</Link>
          <span className="spacer" />
          <Link to={`${PROJECT_BASE}/feedback`} className="btn btn--accent"><Icon name="comment" />Comment</Link>
        </div>
      </section>

      <div className="map-page__map">
        {side ? (
          <CompareMap
            key="side"
            left={{ label: `Option ${L.id} · ${L.short}`, proposal: L.geojson }}
            right={{ label: `Option ${R.id} · ${R.short}`, proposal: R.geojson }}
            mode={mode}
            onModeChange={setMode}
            initialCamera={CAMERA.home}
            scene="alder-8th-ne-corner"
            label={`Compare Option ${L.id} and Option ${R.id}`}
          >
            <Toolbar side={side} setLayout={setLayout} option={option} choose={choose} L={L} R={R} setLeftId={setLeftId} setRightId={setRightId} />
          </CompareMap>
        ) : (
          <MapView
            key="one"
            mode={mode}
            onModeChange={setMode}
            initialCamera={CAMERA.home}
            proposal={option.geojson}
            showProposal
            markers={markers}
            onMarkerClick={onMarker}
            legend={<Legend items={LEGEND_PROPOSAL} />}
            hud={false}
            streetContext="Today, as photographed. Proposed street-level renders are in production."
          >
            <p className="sr-only" aria-live="polite">Showing Option {option.id} on the map.</p>
            <Toolbar side={side} setLayout={setLayout} option={option} choose={choose} L={L} R={R} setLeftId={setLeftId} setRightId={setRightId} />
          </MapView>
        )}
      </div>

      {wide && <aside className="alt-pg__side" aria-label="Comparison of the three options">{matrix}</aside>}
    </main>
  );
}

function Toolbar({ side, setLayout, option, choose, L, R, setLeftId, setRightId }) {
  return (
    <div className="map-toolbar glass alt-pg__toolbar" role="toolbar" aria-label="Alternatives controls">
      <div className="seg alt-pg__seg" role="radiogroup" aria-label="Layout">
        <button type="button" role="radio" aria-checked={!side} className="seg__btn" onClick={() => setLayout("one")}><Icon name="map" />One map</button>
        <button type="button" role="radio" aria-checked={side} className="seg__btn" onClick={() => setLayout("side")}><Icon name="swap" />Side by side</button>
      </div>
      <span className="sep" aria-hidden="true" />
      {side ? (
        <div className="row alt-pg__pair">
          <label className="alt-pg__pick"><span>Left</span>
            <select className="alt-pg__select" value={L.id} onChange={(e) => setLeftId(e.target.value)}>
              {OPTIONS.map((o) => <option key={o.id} value={o.id} disabled={o.id === R.id}>Option {o.id}</option>)}
            </select>
          </label>
          <label className="alt-pg__pick"><span>Right</span>
            <select className="alt-pg__select" value={R.id} onChange={(e) => setRightId(e.target.value)}>
              {OPTIONS.map((o) => <option key={o.id} value={o.id} disabled={o.id === L.id}>Option {o.id}</option>)}
            </select>
          </label>
        </div>
      ) : (
        <div className="seg alt-pg__seg" role="radiogroup" aria-label="Option on the map">
          {OPTIONS.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={o.id === option.id} className="seg__btn" onClick={() => choose(o.id)}>
              <span className="alt-pg__long">Option </span>{o.id}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Dots({ score }) {
  return (
    <span className="alt-pg__dots" aria-hidden="true">
      {[1, 2, 3].map((i) => <span key={i} data-on={i <= score} />)}
    </span>
  );
}

function Matrix({ current }) {
  return (
    <section className="alt-pg__matrix stack" style={{ "--stack": "12px" }} aria-labelledby="alt-matrix">
      <div className="stack" style={{ "--stack": "6px" }}>
        <h2 id="alt-matrix" className="t-h3">At a glance</h2>
        <Truth kind="illustrative">Illustrative · relative, not modelled</Truth>
      </div>
      <table className="alt-pg__table">
        <caption className="sr-only">Options A, B and C compared on five criteria. Dots rank the options against each other, from one to three.</caption>
        <thead>
          <tr>
            <td />
            {OPTIONS.map((o) => <th key={o.id} scope="col" data-on={o.id === current}>{o.id}</th>)}
          </tr>
        </thead>
        <tbody>
          {MATRIX.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.label}{row.truth === "estimate" && <span className="alt-pg__est">estimate</span>}</th>
              {OPTIONS.map((o) => {
                const c = row.cells[o.id];
                return (
                  <td key={o.id} data-on={o.id === current}>
                    <Dots score={c.score} />
                    <span className="alt-pg__cell">{c.text}</span>
                    <span className="sr-only">, {c.score} of 3</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="t-caption t-muted">Dots compare the three options with each other, not with a standard. Distances are estimated from OpenStreetMap geometry; traffic and travel-time studies come at detailed design.</p>
    </section>
  );
}
