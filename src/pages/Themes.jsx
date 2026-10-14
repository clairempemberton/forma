import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { Notice, StatusBadge, Truth, fmtDate } from "../components/ui.jsx";
import { CAMERA, COPY, DECISION, PROJECT, SAMPLE_COMMENTS, SOURCES, SURVEY, THEMES, THEME_BY_ID, cap, optName, surveyCount } from "../data/featured.js";
import { useMapMode } from "../lib/useMapMode.js";
import { prefersReducedMotion } from "../lib/motion.js";
import { THEME_STATUS, TOTAL_COMMENTS, fitCamera } from "./outcomes-shared.js";
import "./outcomes.css";

// R15 · Feedback themes — what the agency reported hearing, its answers, and sample comments placed on the map.
export default function Themes() {
  const MAX = useMemo(() => Math.max(...THEMES.map((t) => t.count)), []);
  const ALL_POINTS = useMemo(() => SAMPLE_COMMENTS.map((c) => c.lngLat), []);
  const [mode, setMode] = useMapMode();
  const [params, setParams] = useSearchParams();
  const sel = params.get("t");
  const cid = params.get("c");
  const [zoomTo, setZoomTo] = useState(null);
  // Theme and comment live in the URL together, so update both in one step.
  const select = (t, c = null) => {
    setZoomTo(null);
    const p = new URLSearchParams(params);
    if (t) p.set("t", t); else p.delete("t");
    if (c) p.set("c", c); else p.delete("c");
    setParams(p, { replace: true });
  };
  const theme = THEME_BY_ID[sel] || null;
  const comment = SAMPLE_COMMENTS.find((c) => c.id === cid) || null;

  const pick = (id) => select(id === sel ? null : id);

  const markers = useMemo(() => SAMPLE_COMMENTS.map((c) => {
    const t = THEME_BY_ID[c.theme];
    return {
      id: c.id, kind: "comment", lngLat: c.lngLat, label: c.text, theme: c.theme,
      selected: c.id === cid, dim: !!sel && c.theme !== sel,
      ariaLabel: `Sample comment, ${t.name}: ${c.text}`,
    };
  }), [sel, cid]);

  const camera = useMemo(() => {
    if (zoomTo) return zoomTo;
    if (comment) return { center: comment.lngLat, zoom: 19.4, bearing: 0, pitch: 0 };
    if (theme) return fitCamera(SAMPLE_COMMENTS.filter((c) => c.theme === theme.id).map((c) => c.lngLat), { px: 380 });
    return fitCamera(ALL_POINTS, { px: 440, fallback: CAMERA.overview });
  }, [theme, comment, zoomTo]);

  const onMarker = (m) => {
    if (m.kind === "cluster") {
      const themes = new Set(m.members.map((x) => x.theme));
      if (themes.size === 1) select([...themes][0]);
      else setZoomTo(fitCamera(m.members.map((x) => x.lngLat), { px: 160, max: 21 }));
      return;
    }
    const c = SAMPLE_COMMENTS.find((x) => x.id === m.id);
    if (!c) return;
    select(c.theme, c.id === cid ? null : c.id);
  };

  const quotes = theme
    ? SAMPLE_COMMENTS.filter((c) => c.theme === theme.id).sort((a, b) => (b.id === cid) - (a.id === cid)).slice(0, 3)
    : [...THEMES].sort((a, b) => b.count - a.count).slice(0, 3).map((t) => SAMPLE_COMMENTS.find((c) => c.theme === t.id));

  return (
    <main id="main" tabIndex={-1} className="thm">
      <div className="wrap page page--tight">
        <header className="thm__head">
          <div className="stack" style={{ "--stack": "12px" }}>
            <p className="t-eyebrow">What we heard · {cap(COPY.round)} · {SURVEY.window}</p>
            <h1 className="t-h1 thm__title">{THEMES.length} themes, each with {PROJECT.agency}'s answer</h1>
            <p className="t-body t-muted measure">{COPY.themesSource} The comments on the map are samples written for this demo. Select a theme to see where they were placed and what {PROJECT.agency} did about it.</p>
          </div>
          <Notice tone="warning" icon="alert">
            <strong>These counts aren't a poll.</strong> They count {TOTAL_COMMENTS} sample comments, not real ones. For what the {surveyCount()} real {COPY.round} respondents preferred, see <Link className="link" to="../decision">the decision summary</Link>.
          </Notice>
        </header>

        <div className="thm__grid">
          <section className="card thm__list" aria-labelledby="thm-list-title">
            <div className="thm__list-head">
              <h2 id="thm-list-title" className="t-h3">Themes</h2>
              <Truth kind="sample">Sample counts · n = {TOTAL_COMMENTS}</Truth>
            </div>
            <ul className="thm__rows" aria-label="Themes, by number of comments">
              {[...THEMES].sort((a, b) => b.count - a.count).map((t) => {
                const st = THEME_STATUS[t.status];
                const on = sel === t.id;
                return (
                  <li key={t.id}>
                    <button type="button" className="thm__row" aria-pressed={on} data-dim={!!sel && !on}
                      aria-label={`${t.name}: ${t.count} sample comments, ${st.label.toLowerCase()}`} onClick={() => pick(t.id)}>
                      <span className="thm__row-name">
                        <span className="thm__row-title">{t.name}</span>
                        <span className={`thm__status thm__status--${t.status}`}>{st.label}</span>
                      </span>
                      <span className="thm__bar" aria-hidden="true"><span style={{ width: `${(t.count / MAX) * 100}%` }} /></span>
                      <span className="thm__count t-num" aria-hidden="true">{t.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="thm__list-foot">
              <p className="t-caption t-muted">Bars show sample comments, not people. Each comment is counted under one theme.</p>
              {sel && <button type="button" className="btn btn--ghost btn--sm" onClick={() => pick(sel)}><Icon name="close" />Show all themes</button>}
            </div>
          </section>

          <section id="thm-map" className="thm__map card" aria-label="Where comments were placed">
            <MapView
              mode={mode}
              onModeChange={setMode}
              initialCamera={fitCamera(ALL_POINTS, { px: 440, fallback: CAMERA.overview })}
              camera={camera}
              showProposal={false}
              markers={markers}
              clusterKinds={sel ? [] : ["comment"]}
              onMarkerClick={onMarker}
              hud={false}
            >
              {comment && (
                <div className="float-panel panel-float thm__pop" role="dialog" aria-label="Selected comment">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="badge badge--voice">{THEME_BY_ID[comment.theme].name}</span>
                    <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Close comment" onClick={() => select(sel)}><Icon name="close" /></button>
                  </div>
                  <p className="t-body thm__pop-text">“{comment.text}”</p>
                  <p className="t-caption t-muted">{comment.author} · {fmtDate(comment.date)} · <Truth kind="sample" /></p>
                </div>
              )}
              <div className="thm__mapkey glass" aria-live="polite">
                <span className="legend__sw legend__sw--comment" aria-hidden="true" />
                {theme ? <span><strong>{theme.name}</strong> · others dimmed</span> : <span>All sample comments · numbers are clusters</span>}
              </div>
            </MapView>
          </section>
        </div>

        <section className="thm__detail" aria-live="polite" aria-labelledby="thm-detail-title">
          <div className="thm__detail-head">
            <div className="stack" style={{ "--stack": "8px" }}>
              <p className="t-eyebrow">{theme ? `Theme · ${theme.count} sample comments` : "In sample words"}</p>
              <h2 id="thm-detail-title" className="t-h2">{theme ? theme.name : "Representative comments"}</h2>
            </div>
            {theme && <StatusBadge tone={THEME_STATUS[theme.status].tone}>{THEME_STATUS[theme.status].label}</StatusBadge>}
          </div>

          {theme && (
            <div className="thm__response">
              <p className="t-eyebrow">{PROJECT.agency}'s response</p>
              <p className="t-h3 thm__response-text">{theme.response}</p>
              <div className="row" style={{ flexWrap: "wrap", gap: "8px 20px" }}>
                <Link className="link" to="../revision">How {optName(DECISION.chosen)} was refined<Icon name="arrowRight" /></Link>
                <Link className="link" to="../decision">Read the decision<Icon name="arrowRight" /></Link>
              </div>
            </div>
          )}

          <ul className="thm__quotes" aria-label="Sample comments">
            {quotes.map((c) => (
              <li key={c.id}>
                <figure className="card card--pad thm__quote" data-on={c.id === cid}>
                  <span className="badge badge--voice badge--plain">{THEME_BY_ID[c.theme].name}</span>
                  <blockquote className="thm__quote-text">“{c.text}”</blockquote>
                  <figcaption className="t-caption t-muted">{c.author} · {fmtDate(c.date)} · sample comment, not a real resident</figcaption>
                  <button type="button" className="link thm__quote-loc" onClick={() => { select(c.theme, c.id); document.getElementById("thm-map")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" }); }}>
                    <Icon name="pin" />Show on map
                  </button>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        <section className="thm__answers" aria-labelledby="thm-answers-title">
          <div className="section-head">
            <div className="stack" style={{ "--stack": "8px" }}>
              <p className="t-eyebrow">Every theme, answered</p>
              <h2 id="thm-answers-title" className="t-h2">{PROJECT.agency}'s response to each theme</h2>
            </div>
            <Truth kind="source">Source: <a className="link" href={SOURCES.decision.url} target="_blank" rel="noreferrer">{PROJECT.agency} {COPY.decisionDoc}<span className="sr-only"> (opens in a new tab)</span></a></Truth>
          </div>
          <div className="table-wrap">
            <table className="table thm__table">
              <caption className="sr-only">Each theme, its number of sample comments, status and {PROJECT.agency}'s response</caption>
              <thead><tr><th scope="col">Theme</th><th scope="col" className="t-num">Sample comments</th><th scope="col">Status</th><th scope="col">Response</th></tr></thead>
              <tbody>
                {THEMES.map((t) => (
                  <tr key={t.id} aria-selected={sel === t.id}>
                    <th scope="row"><button type="button" className="thm__tlink" onClick={() => { pick(t.id); document.getElementById("thm-list-title")?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" }); }}>{t.name}</button></th>
                    <td className="t-num">{t.count}</td>
                    <td><StatusBadge tone={THEME_STATUS[t.status].tone}>{THEME_STATUS[t.status].label}</StatusBadge></td>
                    <td>{t.response}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card thm__method" aria-labelledby="thm-method-title">
          <div className="stack" style={{ "--stack": "10px" }}>
            <p className="t-eyebrow">Method</p>
            <h2 id="thm-method-title" className="t-h3">How this page is put together</h2>
            <Truth kind="sample">Sample comments · themes and responses from {PROJECT.agency}</Truth>
          </div>
          <dl className="thm__method-cols">
            <div><dt>From {PROJECT.agency}</dt><dd>Theme names and responses summarise what {PROJECT.agency} reported hearing, and what it decided, in the {COPY.decisionDoc}.</dd></div>
            <div><dt>Counted once</dt><dd>Each sample comment sits under one theme, so the {THEMES.length} counts add up to {TOTAL_COMMENTS}. A count is how often something came up, not a vote.</dd></div>
            <div><dt>Place kept</dt><dd>Every comment keeps the spot it was pinned to. Select a theme to see where people were standing when they wrote.</dd></div>
          </dl>
        </section>
      </div>
    </main>
  );
}
