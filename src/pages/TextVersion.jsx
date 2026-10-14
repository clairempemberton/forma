import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { FeatureId, Truth, fmtDate } from "../components/ui.jsx";
import {
  COPY, DECISION, EXISTING_FEATURES, OPTIONS, OPTION_BY_ID, PLACE, PROJECT, RESULTS, REVISION_CHANGES, SOURCES, SURVEY, THEMES, THEME_BY_ID, TIMELINE, VERSIONS,
  cap, optName, optTag,
} from "../data/featured.js";
import { formatCoord } from "../lib/geo.js";
import { KIND_LABEL, MATRIX, PROJECT_BASE, describeWhere, wordsFor } from "./proposal-lib.js";
import "./proposal.css";

const sections = () => [
  { id: "project", label: "The project" },
  { id: "today", label: "Today" },
  ...OPTIONS.map((o) => ({ id: `option-${o.id.toLowerCase()}`, label: `${optName(o.id)}, change by change` })),
  { id: "compare", label: "Comparison table" },
  { id: "decision", label: "The decision" },
  { id: "revision", label: `How ${optName(DECISION.chosen)} was refined` },
  ...(COPY.results ? [{ id: "results", label: "What happened after" }] : []),
  { id: "themes", label: "What people said" },
  { id: "timeline", label: "Timeline" },
  { id: "sources", label: "Sources" },
  { id: "comment", label: "Comment without a map" },
];

const STATUS = { addressed: "Addressed", partly: "Partly addressed", open: "Still open", changed: "Changed", "not-changed": "Not changed" };
const MONTH = { month: "long", year: "numeric" };

const ext = (href, label) => <a className="link" href={href} target="_blank" rel="noreferrer">{label}<span className="sr-only"> (opens in a new tab)</span></a>;

// R19 · Accessibility — everything on the map, in words. No map required.
export default function TextVersion() {
  const SECTIONS = sections();
  const CHOSEN = OPTION_BY_ID[DECISION.chosen];
  // Today, for the comparison table: each project says what its place is like now (COPY.todayRow).
  const TODAY_ROW = COPY.todayRow();
  // The text page renders from the same data as the map, so these counts always agree.
  const MAP_COUNTS = { features: EXISTING_FEATURES.length, options: OPTIONS.length, changes: REVISION_CHANGES.length, themes: THEMES.length };
  const [large, setLarge] = useState(false);
  const [current, setCurrent] = useState(SECTIONS[0].id);
  const latest = VERSIONS.find((v) => v.id === DECISION.version) || VERSIONS[VERSIONS.length - 1];
  const n = (id) => SECTIONS.findIndex((s) => s.id === id) + 1;

  // Highlight the section being read in the contents list.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(`txt-${s.id}`)).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setCurrent(vis.target.id.replace("txt-", ""));
    }, { rootMargin: "-10% 0px -70% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const jump = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(`txt-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    el?.querySelector("h2")?.focus({ preventScroll: true });
  };

  return (
    <main id="main" tabIndex={-1} className={`txt-pg ${large ? "txt-pg--large" : ""}`}>
      <div className="txt-pg__bar">
        <div className="wrap txt-pg__bar-inner">
          <p className="txt-pg__bar-title"><strong>Text-only version</strong><span className="t-muted">Everything on the map, in words.</span></p>
          <div className="txt-pg__tools" role="group" aria-label="Reading options">
            <span className="txt-pg__lang"><Icon name="globe" />English<span className="sr-only">. Other languages are not available in this demo.</span></span>
            <button type="button" className="btn btn--secondary btn--sm" aria-pressed={large} onClick={() => setLarge((v) => !v)}>
              <Icon name="text" />{large ? "Standard text" : "Larger text"}
            </button>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => window.print()}><Icon name="doc" />Print</button>
          </div>
        </div>
      </div>

      <div className="wrap txt-pg__grid">
        <nav className="txt-pg__toc" aria-label="Contents">
          <p className="t-eyebrow">Contents</p>
          <ol>
            {SECTIONS.map((s, i) => (
              <li key={s.id}>
                <a href={`#txt-${s.id}`} onClick={(e) => jump(e, s.id)} aria-current={current === s.id ? "location" : undefined}>
                  <span className="t-num">{i + 1}.</span> {s.label}
                </a>
              </li>
            ))}
          </ol>
          <Link to={`${PROJECT_BASE}/explore`} className="link txt-pg__maplink"><Icon name="map" />Open the map version</Link>
        </nav>

        <article className="txt-pg__body" aria-labelledby="txt-title">
          <header className="txt-pg__head">
            <h1 id="txt-title" className="t-h1">{PROJECT.title}</h1>
            <p className="txt-pg__lede">
              {PROJECT.status}. {PROJECT.summary} This page covers {PLACE.name}, in {PLACE.neighborhood.replace(" · ", " and ")}, {PLACE.city},
              and describes everything the map shows, in the same order.
            </p>
            <div className="txt-pg__match" role="status">
              <Icon name="check" />
              <div>
                <strong>Map and text versions match.</strong> Both are built from the same project data: {MAP_COUNTS.features} existing features,
                {" "}{MAP_COUNTS.options} {COPY.alts}, {MAP_COUNTS.changes} refinements {PROJECT.agency} weighed and {MAP_COUNTS.themes} comment themes.
                Chosen: {optName(DECISION.chosen)}, {latest.label.toLowerCase()}, {fmtDate(DECISION.date, MONTH)}.
              </div>
            </div>
          </header>

          <Section id="project" n={n("project")} title="The project">
            <dl className="txt-pg__dl">
              <div><dt>Place</dt><dd>{PLACE.name}, {PLACE.neighborhood}, {PLACE.city}. Centre of the map, {PLACE.short}: {formatCoord(PLACE.coordinates)}.</dd></div>
              <div><dt>Status</dt><dd>{PROJECT.status}. This page is a {PROJECT.round.toLowerCase()}: you can try commenting as if it were {SURVEY.window}.</dd></div>
              <div><dt>Agency</dt><dd>{PROJECT.team} ({PROJECT.agency}) · {ext(PROJECT.url, "Official project page")}</dd></div>
              <div><dt>Budget</dt><dd>{PROJECT.budget}</dd></div>
              <div><dt>Decision</dt><dd>{DECISION.body}</dd></div>
            </dl>
            <p className="txt-pg__note">
              {COPY.textSources} Comments are samples written for this demo, not real residents.
              Forma is an unofficial concept, not affiliated with the City of Portland or {PROJECT.agency}.
            </p>
          </Section>

          <Section id="today" n={n("today")} title="Today">
            <p>
              {COPY.textToday} These are the features you can select on the map.
            </p>
            <div className="table-wrap">
              <table className="table txt-pg__table">
                <caption>Existing features on {COPY.placeShort}, from OpenStreetMap, with {PROJECT.agency} facts where noted.</caption>
                <thead><tr><th scope="col">ID</th><th scope="col">Feature</th><th scope="col">Where</th><th scope="col">Facts</th></tr></thead>
                <tbody>
                  {EXISTING_FEATURES.map((f) => (
                    <tr key={f.id}>
                      <td><FeatureId id={f.id} /></td>
                      <th scope="row"><span className="txt-pg__th">{f.name}</span><span className="txt-pg__sub">{KIND_LABEL[f.kind]}</span></th>
                      <td data-label="Where">{describeWhere(f)}</td>
                      <td data-label="Facts">
                        <ul className="txt-pg__ul">{f.facts.map((t) => <li key={t}>{t}</li>)}</ul>
                        {f.osm && <a className="txt-pg__osm" href={`https://www.openstreetmap.org/${f.osm}`} target="_blank" rel="noreferrer">OSM {f.osm}<span className="sr-only"> (opens in a new tab)</span></a>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {OPTIONS.map((o) => (
            <Section key={o.id} id={`option-${o.id.toLowerCase()}`} n={n(`option-${o.id.toLowerCase()}`)} title={`${optName(o.id)}, change by change`}>
              <p><strong>{o.name}.</strong> {o.summary}{o.id === DECISION.chosen && ` ${PROJECT.agency} chose a refined version of this ${COPY.alt.toLowerCase()}.`}</p>
              <div className="table-wrap">
                <table className="table txt-pg__table">
                  <caption>Each change in {optName(o.id)}, and {COPY.wholeThing} before or today. {COPY.illustrativeLabel}.</caption>
                  <thead><tr><th scope="col">Change</th><th scope="col">Before or today</th><th scope="col">Near</th></tr></thead>
                  <tbody>
                    {wordsFor(o).map((r) => (
                      <tr key={r.change}>
                        <th scope="row"><span className="txt-pg__th">{r.change}</span></th>
                        <td data-label="Before or today">{r.today}</td>
                        <td data-label="Near">{r.fid ? <Link className="link" to={`${PROJECT_BASE}/inspect/${r.fid}?option=${o.id}`}>{r.fid}<span className="sr-only">, inspect on the map</span></Link> : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="txt-pg__two">
                <div><h3>Benefits</h3><ul className="txt-pg__ul">{o.benefits.map((t) => <li key={t}>{t}</li>)}</ul></div>
                <div><h3>Trade-offs</h3><ul className="txt-pg__ul">{o.tradeoffs.map((t) => <li key={t}>{t}</li>)}</ul></div>
              </div>
              <p className="txt-pg__links">
                <Link to={`${PROJECT_BASE}/feedback/compose?describe=1&option=${o.id}`} className="link">Comment on {optName(o.id)} ({COPY.round} replay)</Link>
                <Link to={`${PROJECT_BASE}/alternatives?option=${o.id}`} className="link">Show on map</Link>
              </p>
            </Section>
          ))}

          <Section id="compare" n={n("compare")} title="Comparison table">
            <div className="table-wrap">
              <table className="table txt-pg__table">
                <caption>The {OPTIONS.length} {COPY.alts} compared in words, paraphrasing {PROJECT.agency}'s {COPY.decisionDoc}. Scores rank the {COPY.alts} against each other, from 1 to 3.</caption>
                <thead><tr><th scope="col">Topic</th><th scope="col">Today, as built</th>{OPTIONS.map((o) => <th key={o.id} scope="col">{optTag(o.id)}</th>)}</tr></thead>
                <tbody>
                  {MATRIX.map((row) => (
                    <tr key={row.id}>
                      <th scope="row"><span className="txt-pg__th">{row.label}</span>{row.truth === "estimate" && <span className="txt-pg__sub">Estimate</span>}</th>
                      <td data-label="Today, as built">{TODAY_ROW[row.id] || "—"}</td>
                      {OPTIONS.map((o) => <td key={o.id} data-label={optName(o.id)}>{row.cells[o.id].text} <span className="txt-pg__sub">({row.cells[o.id].score} of 3)</span></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="decision" n={n("decision")} title="The decision">
            <p><strong>{DECISION.status}, {fmtDate(DECISION.date, MONTH)}.</strong> {DECISION.body}</p>
            <p>
              {SURVEY.lead} {SURVEY.note}
            </p>
            <div className="table-wrap">
              <table className="table txt-pg__table">
                <caption>{SURVEY.caption}. Source: {PROJECT.agency} {COPY.decisionDoc}.</caption>
                <thead><tr>{SURVEY.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
                <tbody>
                  {SURVEY.groups.map((g) => (
                    <tr key={g.label}>
                      <th scope="row"><span className="txt-pg__th">{g.label}</span></th>
                      <td className="t-num" data-label={SURVEY.columns[1]}>{g.respondents.toLocaleString("en-US")}</td>
                      <td data-label={SURVEY.columns[2]}>{g.result ?? optName(g.preferred)}</td>
                    </tr>
                  ))}
                  {SURVEY.totalRow !== false && (
                    <tr>
                      <th scope="row"><span className="txt-pg__th">Total</span></th>
                      <td className="t-num" data-label={SURVEY.columns[1]}>{SURVEY.total.toLocaleString("en-US")}</td>
                      <td data-label={SURVEY.columns[2]}>{SURVEY.totalResult ?? `${optName(DECISION.chosen)} overall`}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <h3>Not adopted</h3>
            <ul className="txt-pg__ul">{DECISION.notAdopted.map((x) => <li key={x.title}><strong>{x.title}.</strong> {x.reason}</li>)}</ul>
            <h3>Left open in the decision</h3>
            <ul className="txt-pg__ul">{DECISION.unresolved.map((u) => <li key={u}>{u}</li>)}</ul>
            <p className="txt-pg__links">
              <Link to={`${PROJECT_BASE}/decision`} className="link">Decision summary</Link>
              {ext(SOURCES.decision.url, `${PROJECT.agency}'s ${COPY.decisionDoc}`)}
            </p>
          </Section>

          <Section id="revision" n={n("revision")} title={`How ${optName(DECISION.chosen)} was refined`}>
            <p>
              {optName(DECISION.chosen)} was shown in {COPY.round} in {fmtDate(VERSIONS[0].date, MONTH)}. {latest.note} {CHOSEN && `The refined version is what ${PROJECT.agency} chose: ${CHOSEN.name.toLowerCase()}.`}
            </p>
            <div className="table-wrap">
              <table className="table txt-pg__table">
                <caption>Requests {PROJECT.agency} weighed between {COPY.round} and the decision, and what it did.</caption>
                <thead><tr><th scope="col">Change</th><th scope="col">{VERSIONS[0].label}</th><th scope="col">{latest.label}</th><th scope="col">Status</th></tr></thead>
                <tbody>
                  {REVISION_CHANGES.map((c) => (
                    <tr key={c.id}>
                      <th scope="row"><span className="txt-pg__th">{c.title}</span><span className="txt-pg__sub">{c.themes.map((t) => THEME_BY_ID[t]?.name).join(", ")}</span></th>
                      <td data-label={VERSIONS[0].label}>{c.before}</td>
                      <td data-label={latest.label}>{c.after}</td>
                      <td data-label="Status">{STATUS[c.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {COPY.results && (
            <Section id="results" n={n("results")} title="What happened after">
              <p>{COPY.results.body}</p>
              <ul className="txt-pg__ul">{RESULTS.map((r) => <li key={r.label}><strong>{r.label}:</strong> {r.value}</li>)}</ul>
              <p className="txt-pg__note">Source: {COPY.results.source} {ext(COPY.results.url, COPY.results.linkLabel)}</p>
            </Section>
          )}

          <Section id="themes" n={n("themes")} title="What people said">
            <p>Themes {PROJECT.agency} reported hearing, with its response from the {COPY.decisionDoc}. The counts are of the sample comments in this demo, not real ones. <Truth kind="sample" /></p>
            <div className="table-wrap">
              <table className="table txt-pg__table">
                <caption>Comment themes, sample counts, and {PROJECT.agency}'s response.</caption>
                <thead><tr><th scope="col">Theme</th><th scope="col">Sample comments</th><th scope="col">{PROJECT.agency}'s response</th><th scope="col">Status</th></tr></thead>
                <tbody>
                  {THEMES.map((t) => (
                    <tr key={t.id}>
                      <th scope="row"><span className="txt-pg__th">{t.name}</span></th>
                      <td className="t-num" data-label="Sample comments">{t.count}</td>
                      <td data-label={`${PROJECT.agency}'s response`}>{t.response}</td>
                      <td data-label="Status">{STATUS[t.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="timeline" n={n("timeline")} title="Timeline">
            <p className="txt-pg__note">Dates are shown by month; {PROJECT.agency} gives most of them as a month or a range.</p>
            <ol className="txt-pg__timeline">
              {TIMELINE.map((t) => (
                <li key={t.date} data-status={t.status}>
                  <time dateTime={t.date.slice(0, 7)}>{fmtDate(t.date, MONTH)}</time>
                  <div><strong>{t.title}</strong>{t.status === "current" && <span className="txt-pg__now"> (next)</span>}{t.status === "upcoming" && <span className="txt-pg__sub"> Upcoming</span>}<p>{t.body}</p></div>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="sources" n={n("sources")} title="Sources">
            <ul className="txt-pg__ul">
              {Object.values(SOURCES).map((src) => (
                <li key={src.url}>{ext(src.url, src.title)}, {src.publisher}, {src.date}.</li>
              ))}
            </ul>
          </Section>

          <Section id="comment" n={n("comment")} title="Comment without a map">
            <p>
              {cap(COPY.round)} closed in {COPY.raisedYear}, but you can replay it here and try commenting as if it were {SURVEY.window}. You don't need the map: describe the place in your
              own words — for example “{COPY.describeExample}” — and it will be placed for you. This demo has no server; your comment stays in this browser.
            </p>
            <div className="txt-pg__cta">
              <Link to={`${PROJECT_BASE}/feedback/compose?describe=1`} className="btn btn--accent btn--lg"><Icon name="edit" />Write a comment and describe the location</Link>
              <p className="txt-pg__sub">You can also refer to a feature by its ID, such as {COPY.idExample}.</p>
            </div>
          </Section>
        </article>
      </div>
    </main>
  );
}

function Section({ id, n, title, children }) {
  return (
    <section id={`txt-${id}`} className="txt-pg__sec" aria-labelledby={`txt-${id}-h`}>
      <h2 id={`txt-${id}-h`} tabIndex={-1}><span className="t-num txt-pg__n">{n}.</span> {title}</h2>
      {children}
    </section>
  );
}
