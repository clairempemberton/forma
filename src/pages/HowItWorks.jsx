import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { Truth, fmtDate } from "../components/ui.jsx";
import { DECISION, OPTION_BY_ID, REVISION_CHANGES, SAMPLE_COMMENTS, THEMES, THEME_BY_ID } from "../data/alder.js";
import { resetDemo, useStore } from "../lib/store.js";
import { SiteFooter } from "./DiscoveryKit.jsx";
import "./discovery.css";

const BASE = "/projects/alder-8th";
const COMMENT = SAMPLE_COMMENTS.find((c) => c.id === "c04");
const THEME = THEME_BY_ID[COMMENT.theme];
const CHANGE = REVISION_CHANGES.find((c) => c.id === "RC-1");
const CHOSEN = OPTION_BY_ID[DECISION.chosen];

const LOOP = [
  {
    id: "feedback", icon: "comment", title: "Resident feedback",
    body: "People pin a comment to the exact corner, crossing or bus stop they mean. No account needed, and each person decides whether it's public or only for the project team.",
    link: [`${BASE}/feedback`, "Try leaving a comment"],
    example: (
      <figure className="hiw-ex hiw-ex--voice">
        <figcaption className="hiw-ex__label"><span className="hiw-ex__pin" aria-hidden="true"><Icon name="comment" /></span>Southwest corner · {fmtDate(COMMENT.date, { month: "short", day: "numeric" })}</figcaption>
        <blockquote>“{COMMENT.text}”</blockquote>
        <p className="t-caption t-muted">{COMMENT.author}</p>
      </figure>
    ),
  },
  {
    id: "themes", icon: "layers", title: "Identified themes",
    body: "The team reads every comment and groups it into themes, with counts anyone can check. A comment can belong to a theme without losing its place on the map.",
    link: [`${BASE}/themes`, "See the six themes"],
    example: (
      <div className="hiw-ex">
        <p className="hiw-ex__label">Theme</p>
        <p className="hiw-ex__title">{THEME.name}</p>
        <div className="hiw-ex__bar" aria-hidden="true"><span style={{ width: `${(THEME.count / Math.max(...THEMES.map((t) => t.count))) * 100}%` }} /></div>
        <p className="t-caption t-muted"><span className="t-num">{THEME.count}</span> comments, including the one above</p>
      </div>
    ),
  },
  {
    id: "review", icon: "scale", title: "Planning review",
    body: "Each theme is weighed against what the street can hold: its width, loading, emergency access and the other options. Trade-offs are written down, not hidden in a meeting.",
    link: [`${BASE}/compare`, "Compare the options"],
    example: (
      <div className="hiw-ex">
        <p className="hiw-ex__label">Weighed on the same map</p>
        <ul className="hiw-ex__opts">
          {["A", "B", "C"].map((id) => (
            <li key={id} data-on={id === DECISION.chosen}><span className="fid fid--line">{id}</span>{OPTION_BY_ID[id].name}</li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: "revision", icon: "edit", title: "Proposal revision",
    body: "When a theme changes the design, the new version shows exactly what moved. When it doesn't, the reason sits right next to the request.",
    link: [`${BASE}/revision`, "See version 1 against version 2"],
    example: (
      <div className="hiw-ex">
        <p className="hiw-ex__label">{CHANGE.title}</p>
        <div className="hiw-ex__ba">
          <div><span className="t-eyebrow">Before</span><p className="t-compact">{CHANGE.before}</p></div>
          <Icon name="arrowRight" />
          <div className="is-after"><span className="t-eyebrow">After</span><p className="t-compact">{CHANGE.after}</p></div>
        </div>
      </div>
    ),
  },
  {
    id: "decision", icon: "flag", title: "Published decision",
    body: "Every round ends with a public decision: what was chosen, what was not adopted and why, and what is still unresolved. Then the next round opens on the revised design.",
    link: [`${BASE}/decision`, "Read the round 1 decision"],
    example: (
      <div className="hiw-ex">
        <p className="hiw-ex__label">{DECISION.status} · {fmtDate(DECISION.date, { month: "short", day: "numeric" })}</p>
        <p className="hiw-ex__title">Option {CHOSEN.id}, {CHOSEN.name.toLowerCase()}, revised as version 2</p>
        <p className="t-caption t-muted">{DECISION.notAdopted.length} requests not adopted, each with a reason</p>
      </div>
    ),
  },
];

const REAL = [
  ["Streets, sidewalks, crossings, stop signs and trees at SE Alder St & SE 8th Ave", "OpenStreetMap contributors, ODbL"],
  ["Base map and 3D building shapes", "OpenFreeMap tiles from OpenStreetMap data; Mapbox, including satellite, when configured"],
  ["Street-level photos", "Mapillary contributors, shown as photographed"],
];
const MADE_UP = [
  ["The project, the Eastside Streets team and its committee", "Invented to show how a real round would run"],
  ["Options A, B and C and their drawings", "Illustrative, not surveyed. Don't measure from them"],
  ["Resident comments, theme counts, dates and the decision", "Written for the demo and labelled wherever they appear"],
  ["The other projects in the directory", "Real Portland locations, fictional projects"],
];

export default function HowItWorks() {
  const saved = useStore((s) => s.mine.length + (s.draft ? 1 : 0));
  const [cleared, setCleared] = useState(false);

  return (
    <>
      <main id="main" tabIndex={-1} className="hiw">
        <section className="wrap hiw-hero" aria-labelledby="hiw-title">
          <p className="t-eyebrow lnd-eyebrow">How it works</p>
          <h1 id="hiw-title" className="t-display hiw-hero__title">From a comment on a corner to a decision you can read.</h1>
          <p className="hiw-hero__lead">
            Forma runs one loop for every project. You can join at any step and leave at any step, and every step stays public.
          </p>
          <ol className="hiw-loop" aria-label="The Forma loop">
            {LOOP.map((s, i) => (
              <li key={s.id}>
                <a href={`#hiw-${s.id}`} className="hiw-loop__node" onClick={(e) => { e.preventDefault(); document.getElementById(`hiw-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                  <span className="hiw-loop__n t-num">{i + 1}</span>{s.title}
                </a>
                {i < LOOP.length - 1 && <Icon name="chevronRight" className="hiw-loop__arrow" />}
              </li>
            ))}
          </ol>
          <p className="hiw-loop__back"><Icon name="reset" />Then the next round opens on the revised design.</p>
        </section>

        <section className="hiw-steps" aria-labelledby="hiw-steps-title">
          <div className="wrap">
            <div className="hiw-steps__head">
              <h2 id="hiw-steps-title" className="t-h2">Follow one comment through the loop</h2>
              <Truth kind="illustrative">Alder &amp; 8th · fictional project on a real corner</Truth>
            </div>
            <ol className="hiw-rail">
              {LOOP.map((s, i) => (
                <li key={s.id} id={`hiw-${s.id}`} className="hiw-stage">
                  <div className="hiw-stage__marker" aria-hidden="true"><span><Icon name={s.icon} /></span></div>
                  <div className="hiw-stage__copy">
                    <p className="t-eyebrow">Step {i + 1}</p>
                    <h3 className="t-h2">{s.title}</h3>
                    <p className="t-body t-muted">{s.body}</p>
                    <Link to={s.link[0]} className="link">{s.link[1]}<Icon name="arrowRight" /></Link>
                  </div>
                  <div className="hiw-stage__example">{s.example}</div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="wrap hiw-section" aria-labelledby="hiw-truth-title">
          <div className="hiw-section__head">
            <p className="t-eyebrow">Honesty</p>
            <h2 id="hiw-truth-title" className="t-h1">What's real, and what's illustrative</h2>
            <p className="t-body t-muted measure">The corner is real and so is its data. Everything about the project is made up for this demo, and the app labels it wherever it appears.</p>
          </div>
          <div className="hiw-truth">
            <div className="hiw-truth__col">
              <div className="hiw-truth__top"><Truth kind="osm">Real</Truth></div>
              <ul>{REAL.map(([a, b]) => <li key={a}><Icon name="check" /><span><strong>{a}</strong><span>{b}</span></span></li>)}</ul>
            </div>
            <div className="hiw-truth__col is-made">
              <div className="hiw-truth__top"><Truth kind="illustrative">Illustrative</Truth></div>
              <ul>{MADE_UP.map(([a, b]) => <li key={a}><Icon name="info" /><span><strong>{a}</strong><span>{b}</span></span></li>)}</ul>
            </div>
          </div>
        </section>

        <section className="wrap hiw-section hiw-section--line" aria-labelledby="hiw-privacy-title">
          <div className="hiw-section__head">
            <p className="t-eyebrow">Privacy</p>
            <h2 id="hiw-privacy-title" className="t-h1">You decide what's public</h2>
          </div>
          <ul className="hiw-privacy">
            <li>
              <span className="hiw-privacy__icon"><Icon name="eye" /></span>
              <h3 className="t-h3">Comments can be private</h3>
              <p className="t-compact t-muted">Choose “Private to the project team” and your comment never appears on the public map. Your name is always optional.</p>
            </li>
            <li>
              <span className="hiw-privacy__icon"><Icon name="lock" /></span>
              <h3 className="t-h3">Drafts stay in this browser</h3>
              <p className="t-compact t-muted">This prototype has no server. Drafts and the comments you send are saved in this browser and nowhere else.</p>
              <div className="hiw-privacy__action">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => { resetDemo(); setCleared(true); }} disabled={!saved}>Clear what this demo saved</button>
                <span className="t-caption t-muted" role="status">{cleared && !saved ? "Cleared." : saved ? `${saved} item${saved === 1 ? "" : "s"} saved here` : "Nothing saved yet"}</span>
              </div>
            </li>
            <li>
              <span className="hiw-privacy__icon"><Icon name="locate" /></span>
              <h3 className="t-h3">Your location is never stored</h3>
              <p className="t-compact t-muted">“Use my location” asks once, rounds the result to about 100 m, and only uses it to sort projects by distance.</p>
            </li>
          </ul>
        </section>

        <section className="wrap hiw-cta" aria-labelledby="hiw-cta-title">
          <div className="hiw-cta__box">
            <div>
              <h2 id="hiw-cta-title" className="t-h2">See the loop on a real corner</h2>
              <p className="t-body t-muted">A five-stop guided tour of Alder &amp; 8th, on the live map.</p>
            </div>
            <div className="hiw-cta__actions">
              <Link to={`${BASE}?tour=1`} className="btn btn--accent btn--lg"><Icon name="compass" />Take the guided tour</Link>
              <Link to="/projects" className="btn btn--secondary btn--lg">Browse projects</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
