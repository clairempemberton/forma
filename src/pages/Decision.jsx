import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { Legend, LEGEND_PROPOSAL, Notice, StatusBadge, Truth, fmtDate } from "../components/ui.jsx";
import { CAMERA, DECISION, OPTION_BY_ID, PLACE, PROJECT, REVISION_CHANGES, THEMES, THEME_BY_ID, TIMELINE, VERSIONS } from "../data/alder.js";
import { useMapMode } from "../lib/useMapMode.js";
import { CHANGE_STATUS, THEME_STATUS, TOTAL_COMMENTS } from "./outcomes-shared.js";
import "./outcomes.css";

const OPTION = OPTION_BY_ID[DECISION.chosen];
const VERSION = VERSIONS.find((v) => v.id === DECISION.version);
const MADE = REVISION_CHANGES.filter((c) => c.status === "changed");
const NEXT = TIMELINE.find((t) => t.status === "upcoming");

// The three reasons the decision text gives, each tied to the theme it answers.
const WHY = [
  { title: "It shortens the crossings people raised most", theme: "T-CROSS" },
  { title: "It keeps loading on 8th", theme: "T-LOADING" },
  { title: "It adds the bus shelter", theme: "T-TRANSIT" },
];

const SECTIONS = [
  { id: "dcs-summary", label: "Summary" },
  { id: "dcs-why", label: "Why" },
  { id: "dcs-plan", label: "The chosen plan" },
  { id: "dcs-not", label: "Not adopted" },
  { id: "dcs-themes", label: "Every theme, answered" },
  { id: "dcs-open", label: "Still unresolved" },
  { id: "dcs-timeline", label: "Timeline" },
];

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  el.focus({ preventScroll: true });
};

// R17 · Decision report — the public record of the round 1 decision.
export default function Decision() {
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
        <div className="wrap"><Icon name="alert" /><span><strong>This record is fictional.</strong> The project, committee and decision are a demonstration. {PLACE.name} is a real corner, and nothing here records a real approval.</span></div>
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
              <span className="t-caption t-muted">{fmtDate(DECISION.date)}</span>
              <span className="t-caption t-muted">·</span>
              <span className="t-caption t-muted">{PROJECT.title}</span>
            </div>
            <h1 className="t-h1 dcs__title">Option {OPTION.id}, revised as {VERSION.label.toLowerCase()}, goes forward</h1>
            <p className="dcs__lede">{DECISION.body}</p>
            <Truth kind="illustrative">Fictional decision · {PROJECT.team}</Truth>
          </header>

          <dl className="dcs__stats">
            <div className="dcs__stat"><dt>Chosen</dt><dd>Option {OPTION.id} · {OPTION.name}</dd></div>
            <div className="dcs__stat"><dt>Changes from comments</dt><dd><span className="t-num">{MADE.length}</span> <span className="dcs__of">of {REVISION_CHANGES.length} asked for</span></dd></div>
            <div className="dcs__stat"><dt>Themes with a public response</dt><dd><span className="t-num">{THEMES.length}</span> <span className="dcs__of">of {THEMES.length}</span></dd></div>
            <div className="dcs__stat"><dt>{NEXT.title}</dt><dd>{fmtDate(NEXT.date)}</dd></div>
          </dl>

          <section id="dcs-why" tabIndex={-1} className="dcs__section" aria-labelledby="dcs-why-h">
            <h2 id="dcs-why-h" className="t-h2">Why</h2>
            <p className="t-body t-muted measure">Of the three options, Option {OPTION.id} answered the most-raised concerns without removing loading access. The decision gives three reasons, each tied to a theme from round 1.</p>
            <ol className="dcs__why">
              {WHY.map((w, i) => {
                const t = THEME_BY_ID[w.theme];
                return (
                  <li key={w.theme}>
                    <span className="dcs__why-n" aria-hidden="true">{i + 1}</span>
                    <div>
                      <h3 className="t-h3">{w.title}</h3>
                      <p className="t-compact t-muted">{t.response} <Link className="link" to={`../themes?t=${t.id}`}>{t.name} · {t.count} comments</Link></p>
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

          <section id="dcs-plan" tabIndex={-1} className="dcs__section" aria-labelledby="dcs-plan-h">
            <div className="dcs__section-head">
              <h2 id="dcs-plan-h" className="t-h2">The chosen plan</h2>
              <Link className="link" to="../revision">Compare with version 1<Icon name="arrowRight" /></Link>
            </div>
            <figure className="dcs__map">
              <div className="dcs__map-frame">
                <MapView
                  mode={mode}
                  onModeChange={setMode}
                  initialCamera={{ ...CAMERA.home, zoom: 18.4 }}
                  proposal={VERSION.geojson}
                  markers={markers}
                  hud={false}
                  legend={<Legend items={LEGEND_PROPOSAL.filter((l) => l.swatch !== "comment" && l.swatch !== "feature")} />}
                  ariaLabel={`Map of Option ${OPTION.id}, ${VERSION.label}, at ${PLACE.name}`}
                />
              </div>
              <figcaption className="dcs__map-cap">
                <span>Option {OPTION.id} · {OPTION.name}, {VERSION.label.toLowerCase()} ({fmtDate(VERSION.date)}). Numbered rings are the changes made after round 1; change 4 was not made.</span>
                <Truth kind="illustrative">Concept, not for construction</Truth>
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
              <Truth kind="sample">Fictional counts · n = {TOTAL_COMMENTS}</Truth>
            </div>
            <div className="table-wrap">
              <table className="table dcs__table">
                <caption className="sr-only">Which themes from round 1 shaped which changes in version 2</caption>
                <thead>
                  <tr><th scope="col">Theme</th><th scope="col">Comments</th><th scope="col">Outcome</th><th scope="col">What it shaped</th></tr>
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
              <h2 id="dcs-open-h" className="t-h3">Still unresolved</h2>
              <ul className="dcs__open">
                {DECISION.unresolved.map((u) => <li key={u}><Icon name="clock" />{u}</li>)}
                {REVISION_CHANGES.filter((c) => c.status !== "changed").map((c) => <li key={c.id}><Icon name="clock" />{c.title}: {c.after.replace(/^Still not included — /, "not included; ")}</li>)}
              </ul>
            </div>
            <div className="card card--pad">
              <h2 className="t-h3">Records</h2>
              <ul className="dcs__docs">
                <li><Link to="../themes"><Icon name="comment" /><span>What we heard: six themes and responses</span><Icon name="arrowRight" /></Link></li>
                <li><Link to="../revision"><Icon name="swap" /><span>Version 1 and version 2, compared</span><Icon name="arrowRight" /></Link></li>
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
                    <p className="t-caption t-muted t-num">{fmtDate(t.date)}{t.status === "current" && " · now"}{t.status === "upcoming" && " · planned"}</p>
                    <p className="dcs__tl-title">{t.title}</p>
                    <p className="t-compact t-muted">{t.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <Notice tone="warning" icon="alert">This record is fictional. It shows how Forma publishes a decision; no committee met and nothing was approved.</Notice>
        </article>
      </div>
    </main>
  );
}
