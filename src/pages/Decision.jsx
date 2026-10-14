import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { Legend, LEGEND_PROPOSAL, Notice, StatusBadge, Truth, fmtDate } from "../components/ui.jsx";
import { CAMERA, COPY, DECISION, LEGEND, OPTION_BY_ID, PLACE, PROJECT, REVISION_CHANGES, SOURCES, SURVEY, THEMES, THEME_BY_ID, TIMELINE, VERSIONS, cap, optName } from "../data/featured.js";
import { useMapMode } from "../lib/useMapMode.js";
import { CHANGE_STATUS, THEME_STATUS, TOTAL_COMMENTS } from "./outcomes-shared.js";
import "./outcomes.css";

// The reasons for the decision live with each project's data (DECISION.why), each tied to the theme it answers.
const derive = () => ({
  OPTION: OPTION_BY_ID[DECISION.chosen],
  VERSION: VERSIONS.find((v) => v.id === DECISION.version),
  MADE: REVISION_CHANGES.filter((c) => c.status === "changed"),
  // Documents to list as records: every cited source except the map data.
  RECORDS: Object.entries(SOURCES).filter(([k]) => k !== "osm").map(([, s]) => s),
});

const decisionLink = (label = SOURCES.decision.title) => (
  <a className="link" href={SOURCES.decision.url} target="_blank" rel="noreferrer">{label}<Icon name="external" /><span className="sr-only">(opens in a new tab)</span></a>
);

const SECTIONS = [
  { id: "dcs-summary", label: "Summary" },
  { id: "dcs-why", label: "Why" },
  { id: "dcs-survey", label: "Who rated it" },
  { id: "dcs-plan", label: "The chosen plan" },
  { id: "dcs-not", label: "Not adopted" },
  { id: "dcs-themes", label: "Every theme, answered" },
  { id: "dcs-open", label: "Left open" },
  { id: "dcs-timeline", label: "Timeline" },
];

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  el.focus({ preventScroll: true });
};

// R17 · Decision report — a plain-language summary of the agency's decision.
export default function Decision() {
  const { OPTION, VERSION, MADE, RECORDS } = useMemo(derive, []);
  const [mode, setMode] = useMapMode();
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(hit.target.id);
    }, { rootMargin: "-20% 0px -65% 0px" });
    SECTIONS.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  const markers = useMemo(() => REVISION_CHANGES.map((c, i) => ({
    id: c.id, kind: "change", index: i + 1, lngLat: c.lngLat, label: c.title,
    dim: c.status !== "changed", ariaLabel: `Change ${i + 1}: ${c.title} (${CHANGE_STATUS[c.status].label.toLowerCase()})`,
  })), []);

  return (
    <main id="main" tabIndex={-1} className="dcs">
      <div className="dcs__banner" role="note">
        <div className="wrap"><Icon name="info" /><span><strong>Unofficial concept · summarising {PROJECT.agency}'s {COPY.decisionDoc} ({fmtDate(DECISION.date, { month: "short", year: "numeric" })}).</strong> {decisionLink("Read the original")}</span></div>
      </div>

      <div className="wrap dcs__layout">
        <aside className="dcs__aside">
          <nav className="dcs__toc" aria-label="On this page">
            <p className="t-eyebrow">On this page</p>
            <ul>
              {SECTIONS.map((s) => (
                <li key={s.id}><button type="button" aria-current={active === s.id ? "location" : undefined} onClick={() => scrollTo(s.id)}>{s.label}</button></li>
              ))}
            </ul>
          </nav>
          <div className="dcs__actions">
            <button type="button" className="btn btn--secondary btn--block" onClick={() => window.print()}><Icon name="doc" />Print or save as PDF</button>
            <Link className="btn btn--ghost btn--block" to="../text"><Icon name="text" />Text-only version</Link>
          </div>
        </aside>

        <article className="dcs__doc">
          <header id="dcs-summary" tabIndex={-1} className="dcs__head">
            <div className="row dcs__meta">
              <StatusBadge tone="ink">{DECISION.status}</StatusBadge>
              <span className="t-caption t-muted">{fmtDate(DECISION.date, { month: "long", year: "numeric" })}</span>
              <span className="t-caption t-muted">·</span>
              <span className="t-caption t-muted">{PROJECT.title}</span>
            </div>
            <h1 className="t-h1 dcs__title">{DECISION.headline}</h1>
            <p className="dcs__lede">{DECISION.body}</p>
            <Truth kind="source">Source: {PROJECT.team}, {SOURCES.decision.title}</Truth>
          </header>

          <dl className="dcs__stats">
            <div className="dcs__stat"><dt>Chosen</dt><dd>{optName(OPTION.id)} · {OPTION.name}</dd></div>
            <div className="dcs__stat"><dt>Rated in {COPY.round}</dt><dd><span className="t-num">{SURVEY.total.toLocaleString("en-US")}</span> <span className="dcs__of">people</span></dd></div>
            <div className="dcs__stat"><dt>Requests acted on after {COPY.round}</dt><dd><span className="t-num">{MADE.length}</span> <span className="dcs__of">of {REVISION_CHANGES.length}</span></dd></div>
            <div className="dcs__stat"><dt>Budget</dt><dd>{PROJECT.budget}</dd></div>
          </dl>

          <section id="dcs-why" tabIndex={-1} className="dcs__section" aria-labelledby="dcs-why-h">
            <h2 id="dcs-why-h" className="t-h2">Why</h2>
            <p className="t-body t-muted measure">{DECISION.whyLead}</p>
            <ol className="dcs__why">
              {DECISION.why.map((w, i) => {
                const t = w.theme && THEME_BY_ID[w.theme];
                return (
                  <li key={w.title}>
                    <span className="dcs__why-n" aria-hidden="true">{i + 1}</span>
                    <div>
                      <h3 className="t-h3">{w.title}</h3>
                      {w.detail && <p className="t-compact"><strong>{w.detail}</strong></p>}
                      <p className="t-compact t-muted">{w.body} {t && <Link className="link" to={`../themes?t=${t.id}`}>{t.short} · {t.count} sample comments</Link>}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="dcs__tradeoffs">
              <div>
                <p className="t-eyebrow">What it gives</p>
                <ul>{OPTION.benefits.map((b) => <li key={b}>{b}</li>)}</ul>
              </div>
              <div>
                <p className="t-eyebrow">What it costs</p>
                <ul>{OPTION.tradeoffs.map((b) => <li key={b}>{b}</li>)}</ul>
              </div>
            </div>
          </section>

          <section id="dcs-survey" tabIndex={-1} className="dcs__section" aria-labelledby="dcs-survey-h">
            <div className="dcs__section-head">
              <h2 id="dcs-survey-h" className="t-h2">Who rated the {COPY.alts}</h2>
              <Truth kind="source" />
            </div>
            <p className="t-body t-muted measure">{SURVEY.lead}</p>
            <div className="table-wrap">
              <table className="table dcs__table">
                <caption className="sr-only">{SURVEY.caption}</caption>
                <thead>
                  <tr>{SURVEY.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {SURVEY.groups.map((g) => (
                    <tr key={g.label}>
                      <th scope="row">{g.label}</th>
                      <td className="t-num">{g.respondents.toLocaleString("en-US")}</td>
                      <td>{g.result ?? `${optName(g.preferred)} · ${OPTION_BY_ID[g.preferred]?.short}`}</td>
                    </tr>
                  ))}
                  {SURVEY.totalRow !== false && (
                    <tr>
                      <th scope="row">Total</th>
                      <td className="t-num"><strong>{SURVEY.total.toLocaleString("en-US")}</strong></td>
                      <td>{SURVEY.totalResult ?? `${optName(DECISION.chosen)} overall`}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="t-compact t-muted measure">{SURVEY.note}</p>
          </section>

          <section id="dcs-plan" tabIndex={-1} className="dcs__section" aria-labelledby="dcs-plan-h">
            <div className="dcs__section-head">
              <h2 id="dcs-plan-h" className="t-h2">The chosen plan</h2>
              <Link className="link" to="../revision">Compare with the {COPY.round} version<Icon name="arrowRight" /></Link>
            </div>
            <figure className="dcs__map">
              <div className="dcs__map-frame">
                <MapView
                  mode={mode}
                  onModeChange={setMode}
                  initialCamera={CAMERA.home}
                  proposal={VERSION.geojson}
                  markers={markers}
                  hud={false}
                  legend={<Legend items={(LEGEND || LEGEND_PROPOSAL).filter((l) => l.swatch !== "comment" && l.swatch !== "feature")} />}
                  ariaLabel={`Map of ${optName(OPTION.id)}, ${VERSION.label.toLowerCase()}, on ${PLACE.name}`}
                />
              </div>
              <figcaption className="dcs__map-cap">
                <span>{optName(OPTION.id)} · {OPTION.name}, {VERSION.label.toLowerCase()} ({fmtDate(VERSION.date, { month: "long", year: "numeric" })}). Numbered rings are the requests {PROJECT.agency} weighed after {COPY.round}; dimmed rings were not adopted.</span>
                <Truth kind="illustrative" />
              </figcaption>
              <ul className="dcs__map-print">
                {OPTION.changes.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </figure>
          </section>

          <section id="dcs-not" tabIndex={-1} className="dcs__section" aria-labelledby="dcs-not-h">
            <h2 id="dcs-not-h" className="t-h2">What was not adopted, and why</h2>
            <div className="dcs__cards">
              {DECISION.notAdopted.map((n) => (
                <div key={n.title} className="card card--pad dcs__card">
                  <span className="badge badge--outline">Not adopted</span>
                  <h3 className="t-h3">{n.title}</h3>
                  <p className="t-compact t-muted">{n.reason}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="dcs-themes" tabIndex={-1} className="dcs__section" aria-labelledby="dcs-themes-h">
            <div className="dcs__section-head">
              <h2 id="dcs-themes-h" className="t-h2">Every theme, answered</h2>
              <Truth kind="sample">Sample counts · n = {TOTAL_COMMENTS}</Truth>
            </div>
            <div className="table-wrap">
              <table className="table dcs__table">
                <caption className="sr-only">Themes {PROJECT.agency} reported hearing, and which refinements to {optName(OPTION.id)} they shaped</caption>
                <thead>
                  <tr><th scope="col">Theme</th><th scope="col">Sample comments</th><th scope="col">Outcome</th><th scope="col">What it shaped</th></tr>
                </thead>
                <tbody>
                  {THEMES.map((t) => {
                    const changes = REVISION_CHANGES.filter((c) => c.themes.includes(t.id));
                    return (
                      <tr key={t.id}>
                        <th scope="row"><Link to={`../themes?t=${t.id}`}>{t.name}</Link></th>
                        <td className="t-num">{t.count}</td>
                        <td><StatusBadge tone={THEME_STATUS[t.status].tone}>{THEME_STATUS[t.status].label}</StatusBadge></td>
                        <td>
                          {changes.length ? (
                            <ul className="dcs__shaped">
                              {changes.map((c) => (
                                <li key={c.id}>
                                  <span className="dcs__ring" data-status={c.status} aria-hidden="true">{REVISION_CHANGES.indexOf(c) + 1}</span>
                                  <span><Link to={`../revision?change=${c.id}`}>{c.title}</Link>{c.status !== "changed" && <span className="t-muted"> — not changed</span>}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <span className="t-muted">{t.response}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section id="dcs-open" tabIndex={-1} className="dcs__section dcs__split" aria-labelledby="dcs-open-h">
            <div className="card card--pad">
              <h2 id="dcs-open-h" className="t-h3">Left open in the decision</h2>
              <ul className="dcs__open">
                {DECISION.unresolved.map((u) => <li key={u}><Icon name="clock" />{u}</li>)}
                {REVISION_CHANGES.filter((c) => c.status !== "changed").map((c) => <li key={c.id}><Icon name="clock" />{c.title}: {c.after}</li>)}
              </ul>
            </div>
            <div className="card card--pad">
              <h2 className="t-h3">Records</h2>
              <ul className="dcs__docs">
                {RECORDS.map((s) => (
                  <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer"><Icon name="doc" /><span>{s.title} ({s.date})<span className="sr-only"> (opens in a new tab)</span></span><Icon name="external" /></a></li>
                ))}
                <li><Link to="../themes"><Icon name="comment" /><span>What we heard: {THEMES.length} themes and responses</span><Icon name="arrowRight" /></Link></li>
                <li><Link to="../revision"><Icon name="swap" /><span>{cap(COPY.round)} and refined {optName(OPTION.id)}, compared</span><Icon name="arrowRight" /></Link></li>
                <li><Link to="../text"><Icon name="text" /><span>Text-only version of the proposal</span><Icon name="arrowRight" /></Link></li>
                <li><button type="button" onClick={() => window.print()}><Icon name="doc" /><span>Print this record</span><Icon name="arrowRight" /></button></li>
              </ul>
            </div>
          </section>

          <section id="dcs-timeline" tabIndex={-1} className="dcs__section" aria-labelledby="dcs-timeline-h">
            <div className="dcs__section-head">
              <h2 id="dcs-timeline-h" className="t-h2">Timeline</h2>
              <Link className="link" to="../updates">All updates<Icon name="arrowRight" /></Link>
            </div>
            <ol className="timeline dcs__timeline">
              {TIMELINE.map((t) => (
                <li key={t.title} className="timeline__item" data-status={t.status}>
                  <span className="timeline__dot" aria-hidden="true" />
                  <div className="dcs__tl">
                    <p className="t-caption t-muted t-num">{fmtDate(t.date, { month: "short", year: "numeric" })}{t.status === "current" && " · next"}{t.status === "upcoming" && " · planned"}</p>
                    <p className="dcs__tl-title">{t.title}</p>
                    <p className="t-compact t-muted">{t.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <Notice icon="info">Forma is an unofficial concept, not affiliated with {PROJECT.agency}. This page summarises the {decisionLink(COPY.decisionDoc)}; read the original for {PROJECT.agency}'s full reasoning.</Notice>
        </article>
      </div>
    </main>
  );
}
