import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { Notice, Truth } from "../components/ui.jsx";
import { DECISION, EVIDENCE, PLACE } from "../data/alder.js";
import { PROJECT_BASE } from "./proposal-lib.js";
import "./proposal.css";

// Geometry used in data/alder.js: each roadway is about 10 m curb to curb (estimate from OSM),
// and a curb extension reaches about 2.1 m into it (illustrative).
const ROAD_M = 10;
const BULB_M = 2.1;
const SHORT_M = ROAD_M - 2 * BULB_M;

const TOPICS = [
  { id: "shorter", label: "Shorter crossings" },
  { id: "raised", label: "Raised crossings" },
  { id: "corner", label: "This corner" },
  { id: "words", label: "Words you'll see" },
];

const GLOSSARY = [
  { term: "Curb extension", def: "The sidewalk pushed out into the parking lane at a corner. Also called a bulb-out. People waiting to cross stand where drivers can see them." },
  { term: "Raised crossing", def: "A crossing built up to sidewalk height, like a long, flat speed bump. Drivers slow to go over it; people walking stay level." },
  { term: "Directional curb ramp", def: "A ramp that points straight along the crossing, rather than diagonally into the middle of the intersection." },
  { term: "Protected bike lane", def: "A bike lane separated from traffic by a physical barrier such as posts or a curb, not just paint." },
  { term: "Mini traffic circle", def: "A small raised circle in the middle of an intersection that every driver steers around, which slows turns." },
  { term: "Loading zone", def: "A stretch of curb kept for deliveries, so trucks don't double-park in the travel lane." },
];

// R08 · Evidence — the reasoning behind the proposal, in plain language, with what isn't known.
export default function Evidence() {
  return (
    <main id="main" tabIndex={-1} className="evd-pg">
      <div className="wrap evd-pg__grid">
        <article className="evd-pg__main" aria-labelledby="evd-title">
          <nav className="evd-pg__topics" aria-label="On this page">
            {TOPICS.map((t) => <a key={t.id} href={`#evd-${t.id}`} className="chip" onClick={(e) => { e.preventDefault(); document.getElementById(`evd-${t.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{t.label}</a>)}
          </nav>

          <header className="stack" style={{ "--stack": "14px" }}>
            <p className="t-eyebrow">Evidence · plain-language summary</p>
            <h1 id="evd-title" className="t-h1">Why the options do what they do</h1>
            <p className="t-body measure evd-pg__lede">
              The proposal leans on two ideas used widely in street design: make crossings shorter, and slow drivers where people cross.
              Here is how each one applies at {PLACE.short}, and where the evidence stops.
            </p>
          </header>

          <section id="evd-shorter" className="evd-pg__sec" aria-labelledby="evd-shorter-h">
            <h2 id="evd-shorter-h" className="t-h2">{EVIDENCE[0].title}</h2>
            <p className="t-body measure">
              {EVIDENCE[0].body} At {PLACE.short} each crossing is about {ROAD_M} m from curb to curb. A curb extension on both sides of a crossing
              brings that down to about {Math.round(SHORT_M)} m. With an extension on one side only, as in Option C, it's about {Math.round(ROAD_M - BULB_M)} m.
            </p>
            <figure className="evd-pg__fig">
              <div className="evd-pg__diagrams">
                <CrossingPlan label="Today" metres={ROAD_M} />
                <CrossingPlan label="Curb extensions on both sides" metres={SHORT_M} bulb />
              </div>
              <figcaption className="evd-pg__cap">
                <span>Plan view of one crossing. Lengths are estimated from OpenStreetMap geometry, not surveyed.</span>
                <Truth kind="estimate" />
              </figcaption>
            </figure>
            <p className="t-caption t-muted">Source: {EVIDENCE[0].source}</p>
          </section>

          <section id="evd-raised" className="evd-pg__sec" aria-labelledby="evd-raised-h">
            <h2 id="evd-raised-h" className="t-h2">{EVIDENCE[1].title}</h2>
            <p className="t-body measure">{EVIDENCE[1].body} All three options raise both crossings of 8th Ave, which is the street that doesn't stop today.</p>
            <figure className="evd-pg__fig">
              <div className="evd-pg__diagrams">
                <CrossingSection label="Today" />
                <CrossingSection label="Raised crossing" raised />
              </div>
              <figcaption className="evd-pg__cap">
                <span>Side view across the street. Not to scale.</span>
                <Truth kind="illustrative">Illustrative diagram</Truth>
              </figcaption>
            </figure>
            <p className="t-caption t-muted">Source: {EVIDENCE[1].source}</p>
          </section>

          <section id="evd-corner" className="evd-pg__sec" aria-labelledby="evd-corner-h">
            <h2 id="evd-corner-h" className="t-h2">{EVIDENCE[2].title}</h2>
            <p className="t-body measure">{EVIDENCE[2].body}</p>
            <div className="evd-pg__know">
              <div className="evd-pg__col">
                <h3 className="evd-pg__colh"><Icon name="check" />What we know</h3>
                <ul>
                  <li>All four crossings are mapped as unmarked</li>
                  <li>Alder St stops at the corner; 8th Ave does not</li>
                  <li>There is no traffic signal here</li>
                  <li>Alder has no bike facility; 7th Ave, one block west, has painted bike lanes</li>
                  <li>The SE Morrison &amp; 9th stop has a bench and no shelter</li>
                </ul>
                <Truth kind="osm" />
              </div>
              <div className="evd-pg__col evd-pg__col--unknown">
                <h3 className="evd-pg__colh"><Icon name="info" />What we don't know</h3>
                <ul>
                  <li>Traffic volumes and speeds on either street</li>
                  <li>Crash records for this corner</li>
                  <li>Surveyed curb-to-curb widths</li>
                  <li>Which curb ramps exist today — OSM doesn't record them</li>
                  {DECISION.unresolved.slice(0, 1).map((u) => <li key={u}>{u}</li>)}
                </ul>
                <p className="t-caption t-muted">We won't guess at how many collisions any option would prevent. That needs counts before and a study after construction.</p>
              </div>
            </div>
          </section>

          <section id="evd-words" className="evd-pg__sec" aria-labelledby="evd-words-h">
            <h2 id="evd-words-h" className="t-h3">Words you'll see</h2>
            <div className="evd-pg__glossary">
              {GLOSSARY.map((g, i) => (
                <details key={g.term} open={i === 0}>
                  <summary><span>{g.term}</span><Icon name="chevronDown" /></summary>
                  <p className="t-compact t-muted">{g.def}</p>
                </details>
              ))}
            </div>
          </section>
        </article>

        <aside className="evd-pg__aside" aria-label="Sources">
          <div className="evd-pg__card">
            <p className="t-eyebrow">Sources</p>
            <ul className="evd-pg__sources">
              <li>
                <span className="evd-pg__src-k">Map data</span>
                <span><a className="link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors<Icon name="external" /><span className="sr-only">(opens in a new tab)</span></a>, ODbL. Crossings, stop signs, bike lanes and the bus stop.</span>
              </li>
              <li>
                <span className="evd-pg__src-k">Distances</span>
                <span>Estimated from OSM sidewalk and crossing positions. Not surveyed.</span>
              </li>
              <li>
                <span className="evd-pg__src-k">Design ideas</span>
                <span>General planning practice; not a study of this corner.</span>
              </li>
              <li>
                <span className="evd-pg__src-k">Project</span>
                <span>Options, comments and decisions are part of a fictional demo.</span>
              </li>
            </ul>
            <Notice tone="warning" icon="alert">No traffic counts, crash data or engineering study sit behind this page. A real project would link its published documents here.</Notice>
            <div className="evd-pg__actions">
              <Link to={`${PROJECT_BASE}/text`} className="btn btn--secondary btn--sm"><Icon name="text" />Read everything as text</Link>
              <Link to={`${PROJECT_BASE}/compare`} className="btn btn--secondary btn--sm"><Icon name="layers" />See it on the map</Link>
            </div>
          </div>
          <Link to={`${PROJECT_BASE}/feedback`} className="evd-pg__ask">
            <span className="evd-pg__ask-icon" aria-hidden="true"><Icon name="comment" /></span>
            <span className="rowbtn__main">
              <span className="rowbtn__title">Something here doesn't match what you see?</span>
              <span className="rowbtn__sub">Tell the team — local knowledge counts as evidence too.</span>
            </span>
            <Icon name="chevronRight" />
          </Link>
        </aside>
      </div>
    </main>
  );
}

// Plan view: sidewalks top and bottom, roadway between, a crossing with a dimension line.
function CrossingPlan({ label, metres, bulb = false }) {
  const S = 13; // px per metre
  const top = 34, road = ROAD_M * S, w = 248;
  const b = bulb ? BULB_M * S : 0;
  const cx = w / 2;
  const y0 = top + b, y1 = top + road - b;
  const title = `${label}: crossing about ${Math.round(metres)} metres curb to curb`;
  return (
    <div className="evd-pg__diagram">
      <svg viewBox={`0 0 ${w} ${top * 2 + road}`} role="img" aria-label={title}>
        <rect x="0" y="0" width={w} height={top} className="evd-svg__walk" />
        <rect x="0" y={top + road} width={w} height={top} className="evd-svg__walk" />
        <rect x="0" y={top} width={w} height={road} className="evd-svg__road" />
        <line x1="0" x2={w} y1={top + road / 2} y2={top + road / 2} className="evd-svg__centre" />
        {bulb && (
          <>
            <path d={`M${cx - 58} ${top} h116 v${b - 6} q0 6 -6 6 h-104 q-6 0 -6 -6z`} className="evd-svg__bulb" />
            <path d={`M${cx - 58} ${top + road} h116 v${-b + 6} q0 -6 -6 -6 h-104 q-6 0 -6 6z`} className="evd-svg__bulb" />
          </>
        )}
        {Array.from({ length: Math.floor((y1 - y0 - 6) / 10) }, (_, i) => (
          <rect key={i} x={cx - 20} y={y0 + 5 + i * 10} width="40" height="5" className="evd-svg__zebra" />
        ))}
        <g className="evd-svg__dim">
          <line x1={cx + 40} x2={cx + 40} y1={y0} y2={y1} />
          <line x1={cx + 34} x2={cx + 46} y1={y0} y2={y0} />
          <line x1={cx + 34} x2={cx + 46} y1={y1} y2={y1} />
        </g>
        <text x={cx + 52} y={(y0 + y1) / 2 + 4} className="evd-svg__num">≈{Math.round(metres)} m</text>
        <text x="10" y="21" className="evd-svg__label">Sidewalk</text>
        <text x="10" y={top + road / 2 - 8} className="evd-svg__label evd-svg__label--road">Roadway</text>
      </svg>
      <p className="evd-pg__dlabel"><strong>{label}</strong><span className="t-num">About {Math.round(metres)} m</span></p>
    </div>
  );
}

// Section view across the street: sidewalk — curb — road — curb — sidewalk.
function CrossingSection({ label, raised = false }) {
  const w = 248, h = 130, walk = 56, road = 92, curb = 14;
  const x0 = 34, x1 = x0 + 180;
  const surface = raised
    ? `M0 ${walk} H${w}`
    : `M0 ${walk} H${x0} V${walk + curb} H${x1} V${walk} H${w}`;
  const ground = raised
    ? `M${x0} ${walk + curb} V${walk} H${x1} V${walk + curb}`
    : null;
  const walkerY = raised ? walk : walk + curb;
  return (
    <div className="evd-pg__diagram">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={raised ? `${label}: the crossing is built up level with the sidewalk, so people stay level the whole way` : `${label}: people step down from the curb to road level to cross`}>
        <path d={`${surface} V${h} H0 Z`} className="evd-svg__ground" />
        {ground && <path d={`M${x0} ${walk + curb} H${x1}`} className="evd-svg__old" />}
        {ground && <path d={`${ground} Z`} className="evd-svg__table" />}
        <path d={surface} className="evd-svg__surface" />
        {[0.32, 0.68].map((t) => (
          <g key={t} transform={`translate(${x0 + (x1 - x0) * t} ${walkerY})`} className="evd-svg__person">
            <circle cx="0" cy="-27" r="4.5" />
            <path d="M0 -22 V-9 M0 -9 L-5 0 M0 -9 L5 0 M-6 -17 L6 -17" />
          </g>
        ))}
        <text x="6" y={walk - 10} className="evd-svg__label">Sidewalk</text>
        <text x={(x0 + x1) / 2} y={h - 14} textAnchor="middle" className="evd-svg__label">{raised ? "Raised to sidewalk level" : "Road level"}</text>
      </svg>
      <p className="evd-pg__dlabel"><strong>{label}</strong><span>{raised ? "Level the whole way" : "Step down, step up"}</span></p>
    </div>
  );
}
