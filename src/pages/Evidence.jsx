import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { Notice, Truth } from "../components/ui.jsx";
import { COPY, EVIDENCE, MATRIX_ROWS, OPTIONS, PROJECT, RESULTS, SOURCES } from "../data/featured.js";
import { PROJECT_BASE } from "./proposal-lib.js";
import "./proposal.css";

const link = (src, label = src.title) => (
  <a className="link" href={src.url} target="_blank" rel="noreferrer">{label}<Icon name="external" /><span className="sr-only">(opens in a new tab)</span></a>
);

// R08 · Evidence — the reasoning behind the agency's decision, in plain language, with what this demo doesn't know.
// Each project lays out its sections in COPY.evidence; each section explains one EVIDENCE item, with an optional
// crossing diagram, comparison table or list of results.
export default function Evidence() {
  const E = COPY.evidence;
  const topics = [...E.sections.map((x) => ({ id: x.id, label: x.label })), { id: "street", label: E.placeLabel }, { id: "words", label: "Words you'll see" }];
  return (
    <main id="main" tabIndex={-1} className="evd-pg">
      <div className="wrap evd-pg__grid">
        <article className="evd-pg__main" aria-labelledby="evd-title">
          <nav className="evd-pg__topics" aria-label="On this page">
            {topics.map((t) => <a key={t.id} href={`#evd-${t.id}`} className="chip" onClick={(e) => { e.preventDefault(); document.getElementById(`evd-${t.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{t.label}</a>)}
          </nav>

          <header className="stack" style={{ "--stack": "14px" }}>
            <p className="t-eyebrow">Evidence · plain-language summary</p>
            <h1 id="evd-title" className="t-h1">Why {PROJECT.agency} chose what it chose</h1>
            <p className="t-body measure evd-pg__lede">{E.lede}</p>
          </header>

          {E.sections.map((sec) => <EvidenceSection key={sec.id} sec={sec} ev={EVIDENCE[sec.ev]} />)}

          <section id="evd-street" className="evd-pg__sec" aria-labelledby="evd-street-h">
            <h2 id="evd-street-h" className="t-h2">{E.placeLabel}</h2>
            <p className="t-body measure">{E.placeLead}</p>
            <div className="evd-pg__know">
              <div className="evd-pg__col">
                <h3 className="evd-pg__colh"><Icon name="check" />What we know</h3>
                <ul>{E.known.map((k) => <li key={k}>{k}</li>)}</ul>
                <Truth kind="osm" />
              </div>
              <div className="evd-pg__col evd-pg__col--unknown">
                <h3 className="evd-pg__colh"><Icon name="info" />Not in this demo</h3>
                <ul>{E.unknown.map((u) => <li key={u}>{u}</li>)}</ul>
                <p className="t-caption t-muted">Forma doesn't estimate {E.noEstimate} itself. Every figure on this page is {PROJECT.agency}'s.</p>
              </div>
            </div>
          </section>

          <section id="evd-words" className="evd-pg__sec" aria-labelledby="evd-words-h">
            <h2 id="evd-words-h" className="t-h3">Words you'll see</h2>
            <div className="evd-pg__glossary">
              {COPY.glossary.map((g, i) => (
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
              {E.sources.map((x) => (
                <li key={x.k}>
                  <span className="evd-pg__src-k">{x.k}</span>
                  <span>{x.src ? <>{link(SOURCES[x.src])}, {SOURCES[x.src].publisher}, {SOURCES[x.src].date}. </> : null}{x.text}</span>
                </li>
              ))}
              <li>
                <span className="evd-pg__src-k">Map data</span>
                <span><a className="link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors<Icon name="external" /><span className="sr-only">(opens in a new tab)</span></a>, ODbL. {E.osmCovers}</span>
              </li>
              <li>
                <span className="evd-pg__src-k">Comments</span>
                <span>Sample comments written for this demo, not real residents.</span>
              </li>
            </ul>
            <Notice tone="warning" icon="alert">Forma is an unofficial concept, not affiliated with {PROJECT.agency}. This page summarises {PROJECT.agency}'s reports; read them for the full analysis.</Notice>
            <div className="evd-pg__actions">
              <Link to={`${PROJECT_BASE}/text`} className="btn btn--secondary btn--sm"><Icon name="text" />Read everything as text</Link>
              <Link to={`${PROJECT_BASE}/compare`} className="btn btn--secondary btn--sm"><Icon name="layers" />See it on the map</Link>
            </div>
          </div>
          <Link to={`${PROJECT_BASE}/feedback`} className="evd-pg__ask">
            <span className="evd-pg__ask-icon" aria-hidden="true"><Icon name="comment" /></span>
            <span className="rowbtn__main">
              <span className="rowbtn__title">Something here doesn't match what you see?</span>
              <span className="rowbtn__sub">Try the {COPY.round} feedback flow — local knowledge counts as evidence too.</span>
            </span>
            <Icon name="chevronRight" />
          </Link>
        </aside>
      </div>
    </main>
  );
}

function EvidenceSection({ sec, ev }) {
  const rows = sec.matrix ? MATRIX_ROWS.filter((r) => sec.matrix.includes(r.id)) : [];
  return (
    <section id={`evd-${sec.id}`} className="evd-pg__sec" aria-labelledby={`evd-${sec.id}-h`}>
      <h2 id={`evd-${sec.id}-h`} className="t-h2">{ev.title}</h2>
      <p className="t-body measure">{ev.body}{sec.more ? ` ${sec.more}` : ""}</p>
      {sec.crossing && (
        <figure className="evd-pg__fig">
          <div className="evd-pg__diagrams">
            {sec.crossing.plans.map((pl) => <CrossingPlan key={pl.label} width={sec.crossing.widthFt} {...pl} />)}
          </div>
          <figcaption className="evd-pg__cap">
            <span>{sec.crossing.caption}</span>
            <Truth kind="estimate" />
          </figcaption>
        </figure>
      )}
      {sec.facts && (
        <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {sec.facts.map((r) => (
            <div key={r.label} className="stat"><dt className="stat__label">{r.label}</dt><dd className="stat__value">{r.value}</dd></div>
          ))}
        </dl>
      )}
      {rows.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">{rows.map((r) => r.label).join(" and ")}, by {COPY.alt.toLowerCase()}, from {PROJECT.agency}'s {COPY.decisionDoc}</caption>
            <thead><tr><th scope="col">{COPY.alt}</th>{rows.map((r) => <th key={r.id} scope="col">{r.label}</th>)}</tr></thead>
            <tbody>
              {OPTIONS.map((o) => (
                <tr key={o.id}>
                  <th scope="row">{o.id} · {o.short}</th>
                  {rows.map((r) => <td key={r.id}>{r.cells[o.id].text}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {sec.results && (
        <dl style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          {RESULTS.map((r) => (
            <div key={r.label} className="stat"><dt className="stat__label">{r.label}</dt><dd className="stat__value">{r.value}</dd></div>
          ))}
        </dl>
      )}
      <p className="t-caption t-muted">Source: {ev.source} {sec.link && link(SOURCES[sec.link.src], sec.link.label)}{rows.length > 0 && <Truth kind="source" />}</p>
    </section>
  );
}

// Plan view of one crossing: sidewalks top and bottom, the cross-section between, drawn to scale in feet.
// The dimension line marks the traffic someone walking crosses before they can stop.
function CrossingPlan({ label, layout, note, width: CURB_FT }) {
  const S = 4.4; // px per foot
  const top = 34, road = CURB_FT * S, w = 248;
  const cx = w / 2;
  let y = top;
  const parts = layout.map(([kind, ft]) => { const p = { kind, y0: y, y1: y + ft * S }; y += ft * S; return p; });
  const lanes = parts.filter((p) => p.kind === "lane");
  const island = parts.find((p) => p.kind === "island");
  // Before: every lane at once. After: the first lane, up to the island.
  const span = island ? [lanes[0].y0, lanes[0].y1] : [lanes[0].y0, lanes[lanes.length - 1].y1];
  const title = `${label}: about ${CURB_FT} feet curb to curb. ${note}.`;
  return (
    <div className="evd-pg__diagram">
      <svg viewBox={`0 0 ${w} ${top * 2 + road}`} role="img" aria-label={title}>
        <rect x="0" y="0" width={w} height={top} className="evd-svg__walk" />
        <rect x="0" y={top + road} width={w} height={top} className="evd-svg__walk" />
        <rect x="0" y={top} width={w} height={road} className="evd-svg__road" />
        {parts.slice(1).filter((p, i) => parts[i].kind === "lane" && p.kind === "lane").map((p) => (
          <line key={p.y0} x1="0" x2={w} y1={p.y0} y2={p.y0} className="evd-svg__centre" />
        ))}
        {island && <rect x={cx - 34} y={island.y0} width="68" height={island.y1 - island.y0} rx="4" className="evd-svg__bulb" />}
        {parts.filter((p) => p.kind === "lane").map((p) => Array.from({ length: Math.floor((p.y1 - p.y0 - 4) / 9) }, (_, i) => (
          <rect key={`${p.y0}-${i}`} x={cx - 20} y={p.y0 + 3 + i * 9} width="40" height="4.5" className="evd-svg__zebra" />
        )))}
        <g className="evd-svg__dim">
          <line x1={cx + 40} x2={cx + 40} y1={span[0]} y2={span[1]} />
          <line x1={cx + 34} x2={cx + 46} y1={span[0]} y2={span[0]} />
          <line x1={cx + 34} x2={cx + 46} y1={span[1]} y2={span[1]} />
        </g>
        <text x={cx + 52} y={(span[0] + span[1]) / 2 + 4} className="evd-svg__num">{island ? "1 lane" : `${lanes.length} lanes`}</text>
        <text x="10" y="21" className="evd-svg__label">Sidewalk</text>
        <text x="10" y={top + 14} className="evd-svg__label evd-svg__label--road">Parking</text>
        {island && <text x="10" y={(island.y0 + island.y1) / 2 + 4} className="evd-svg__label evd-svg__label--road">Island</text>}
      </svg>
      <p className="evd-pg__dlabel"><strong>{label}</strong><span>{note}</span></p>
    </div>
  );
}
