import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { FeatureId, Truth, fmtDate } from "../components/ui.jsx";
import { DECISION, EXISTING_FEATURES, OPTIONS, PLACE, PROJECT, REVISION_CHANGES, THEMES, THEME_BY_ID, TIMELINE, VERSIONS } from "../data/alder.js";
import { formatCoord } from "../lib/geo.js";
import { KIND_LABEL, MATRIX, PROJECT_BASE, describeWhere, wordsFor } from "./proposal-lib.js";
import "./proposal.css";

const SECTIONS = [
  { id: "project", label: "The project" },
  { id: "today", label: "Today" },
  ...OPTIONS.map((o) => ({ id: `option-${o.id.toLowerCase()}`, label: `Option ${o.id}, change by change` })),
  { id: "compare", label: "Comparison table" },
  { id: "revision", label: "What changed in version 2" },
  { id: "themes", label: "What people said" },
  { id: "timeline", label: "Timeline" },
  { id: "comment", label: "Comment without a map" },
];

const STATUS = { addressed: "Addressed", partly: "Partly addressed", open: "Still open", changed: "Changed", "not-changed": "Not changed" };

// The text page renders from the same data as the map, so these counts always agree.
const MAP_COUNTS = {
  features: EXISTING_FEATURES.length,
  options: OPTIONS.length,
  changes: REVISION_CHANGES.length,
  themes: THEMES.length,
};

// R19 · Accessibility — everything on the map, in words. No map required.
export default function TextVersion() {
  const [large, setLarge] = useState(false);
  const [current, setCurrent] = useState(SECTIONS[0].id);
  const latest = VERSIONS[VERSIONS.length - 1];

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
              {PROJECT.status} until {fmtDate(PROJECT.closes, { month: "long", day: "numeric", year: "numeric" })}. Three options for the corner of {PLACE.name} in {PLACE.neighborhood.split(" · ")[0]}, {PLACE.city}.
              This page describes everything the map shows, in the same order.
            </p>
            <div className="txt-pg__match" role="status">
              <Icon name="check" />
              <div>
                <strong>Map and text versions match.</strong> Both are built from the same project data: {MAP_COUNTS.features} existing features,
                {" "}{MAP_COUNTS.options} options, {MAP_COUNTS.changes} revision changes and {MAP_COUNTS.themes} comment themes. Current version: {latest.label}, {fmtDate(latest.date)}.
              </div>
            </div>
          </header>

          <Section id="project" n={1} title="The project">
            <dl className="txt-pg__dl">
              <div><dt>Place</dt><dd>{PLACE.name}, {PLACE.neighborhood}, {PLACE.city}. Centre of the corner: {formatCoord(PLACE.coordinates)}.</dd></div>
              <div><dt>Status</dt><dd>{PROJECT.status} · {PROJECT.round}</dd></div>
              <div><dt>Feedback closes</dt><dd>{fmtDate(PROJECT.closes, { month: "long", day: "numeric", year: "numeric" })}</dd></div>
              <div><dt>Team</dt><dd>{PROJECT.team}</dd></div>
              <div><dt>Decision so far</dt><dd>{DECISION.body}</dd></div>
            </dl>
            <p className="txt-pg__note">The streets are real; facts about them come from OpenStreetMap. The project, its options, comments and outcomes are fictional.</p>
          </Section>

          <Section id="today" n={2} title="Today">
            <p>Two streets meet here: SE Alder St runs east–west and SE 8th Ave runs north–south. These are the features you can select on the map.</p>
            <div className="table-wrap">
              <table className="table txt-pg__table">
                <caption>Existing features at the corner, from OpenStreetMap.</caption>
                <thead><tr><th scope="col">ID</th><th scope="col">Feature</th><th scope="col">Where</th><th scope="col">Facts</th></tr></thead>
                <tbody>
                  {EXISTING_FEATURES.map((f) => (
                    <tr key={f.id}>
                      <td><FeatureId id={f.id} /></td>
                      <th scope="row"><span className="txt-pg__th">{f.name}</span><span className="txt-pg__sub">{KIND_LABEL[f.kind]}</span></th>
                      <td data-label="Where">{describeWhere(f)}</td>
                      <td data-label="Facts">
                        <ul className="txt-pg__ul">{f.facts.map((t) => <li key={t}>{t}</li>)}</ul>
                        <a className="txt-pg__osm" href={`https://www.openstreetmap.org/${f.osm}`} target="_blank" rel="noreferrer">OSM {f.osm}<span className="sr-only"> (opens in a new tab)</span></a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {OPTIONS.map((o, i) => (
            <Section key={o.id} id={`option-${o.id.toLowerCase()}`} n={3 + i} title={`Option ${o.id}, change by change`}>
              <p><strong>{o.name}.</strong> {o.summary}</p>
              <div className="table-wrap">
                <table className="table txt-pg__table">
                  <caption>Each change in Option {o.id}, compared with today. Illustrative.</caption>
                  <thead><tr><th scope="col">Change</th><th scope="col">Today</th><th scope="col">Near</th></tr></thead>
                  <tbody>
                    {wordsFor(o).map((r) => (
                      <tr key={r.change}>
                        <th scope="row"><span className="txt-pg__th">{r.change}</span></th>
                        <td data-label="Today">{r.today}</td>
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
                <Link to={`${PROJECT_BASE}/feedback/compose?describe=1&option=${o.id}`} className="link">Comment on Option {o.id}</Link>
                <Link to={`${PROJECT_BASE}/alternatives?option=${o.id}`} className="link">Show on map</Link>
              </p>
            </Section>
          ))}

          <Section id="compare" n={3 + OPTIONS.length} title="Comparison table">
            <div className="table-wrap">
              <table className="table txt-pg__table">
                <caption>The three options compared in words. Ratings are relative to each other and illustrative, not modelled.</caption>
                <thead><tr><th scope="col">Topic</th><th scope="col">Today</th>{OPTIONS.map((o) => <th key={o.id} scope="col">Option {o.id}</th>)}</tr></thead>
                <tbody>
                  {MATRIX.map((row) => (
                    <tr key={row.id}>
                      <th scope="row"><span className="txt-pg__th">{row.label}</span>{row.truth === "estimate" && <span className="txt-pg__sub">Estimate</span>}</th>
                      <td data-label="Today">{TODAY_ROW[row.id]}</td>
                      {OPTIONS.map((o) => <td key={o.id} data-label={`Option ${o.id}`}>{row.cells[o.id].text} <span className="txt-pg__sub">({row.cells[o.id].score} of 3)</span></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="revision" n={4 + OPTIONS.length} title="What changed in version 2">
            <p>Option {DECISION.chosen} was revised after the first comment period. Version 1 was shared on {fmtDate(VERSIONS[0].date)}; version 2 on {fmtDate(latest.date)}.</p>
            <div className="table-wrap">
              <table className="table txt-pg__table">
                <caption>Changes between version 1 and version 2 of Option {DECISION.chosen}.</caption>
                <thead><tr><th scope="col">Change</th><th scope="col">Version 1</th><th scope="col">Version 2</th><th scope="col">Status</th></tr></thead>
                <tbody>
                  {REVISION_CHANGES.map((c) => (
                    <tr key={c.id}>
                      <th scope="row"><span className="txt-pg__th">{c.title}</span><span className="txt-pg__sub">{c.themes.map((t) => THEME_BY_ID[t]?.name).join(", ")}</span></th>
                      <td data-label="Version 1">{c.before}</td>
                      <td data-label="Version 2">{c.after}</td>
                      <td data-label="Status">{STATUS[c.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="themes" n={5 + OPTIONS.length} title="What people said">
            <p>Round 1 comments, grouped into themes, with the team's response. <Truth kind="sample" /></p>
            <div className="table-wrap">
              <table className="table txt-pg__table">
                <caption>Comment themes from round 1 and how the team responded.</caption>
                <thead><tr><th scope="col">Theme</th><th scope="col">Comments</th><th scope="col">Response</th><th scope="col">Status</th></tr></thead>
                <tbody>
                  {THEMES.map((t) => (
                    <tr key={t.id}>
                      <th scope="row"><span className="txt-pg__th">{t.name}</span></th>
                      <td className="t-num" data-label="Comments">{t.count}</td>
                      <td data-label="Response">{t.response}</td>
                      <td data-label="Status">{STATUS[t.status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="timeline" n={6 + OPTIONS.length} title="Timeline">
            <ol className="txt-pg__timeline">
              {TIMELINE.map((t) => (
                <li key={t.date} data-status={t.status}>
                  <time dateTime={t.date}>{fmtDate(t.date)}</time>
                  <div><strong>{t.title}</strong>{t.status === "current" && <span className="txt-pg__now"> (now)</span>}{t.status === "upcoming" && <span className="txt-pg__sub"> Upcoming</span>}<p>{t.body}</p></div>
                </li>
              ))}
            </ol>
          </Section>

          <Section id="comment" n={7 + OPTIONS.length} title="Comment without a map">
            <p>You don't need the map to take part. Describe the place in your own words — for example “the north crossing of 8th Ave, outside the café” — and the team will place it for you.</p>
            <div className="txt-pg__cta">
              <Link to={`${PROJECT_BASE}/feedback/compose?describe=1`} className="btn btn--accent btn--lg"><Icon name="edit" />Write a comment and describe the location</Link>
              <p className="txt-pg__sub">You can also refer to a feature by its ID, such as X-01 for the north crossing.</p>
            </div>
          </Section>
        </article>
      </div>
    </main>
  );
}

const TODAY_ROW = {
  crossing: "About 10 m, unmarked",
  bike: "No bike facility on Alder",
  curb: "On-street parking; loading on 8th",
  trees: "No new trees",
  transit: "Bench, no shelter",
};

function Section({ id, n, title, children }) {
  return (
    <section id={`txt-${id}`} className="txt-pg__sec" aria-labelledby={`txt-${id}-h`}>
      <h2 id={`txt-${id}-h`} tabIndex={-1}><span className="t-num txt-pg__n">{n}.</span> {title}</h2>
      {children}
    </section>
  );
}
