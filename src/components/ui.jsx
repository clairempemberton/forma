import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";
import { COPY, PROJECT } from "../data/featured.js";

export function Logo({ to = "/" }) {
  return (
    <Link to={to} className="logo" aria-label="Forma home">
      <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="currentColor" /><path d="M8 15V10a2 2 0 0 1 2-2h5v7zm9-7h5a2 2 0 0 1 2 2v5h-7zm7 9v5a2 2 0 0 1-2 2h-5v-7zM15 24h-5a2 2 0 0 1-2-2v-5h7z" fill="#fff" /><circle cx="16" cy="16" r="2.2" fill="#fff" /></svg>
      <span>FORMA</span>
    </Link>
  );
}

const TONE = { accent: "badge--accent", positive: "badge--positive", warning: "badge--warning", info: "badge--info", danger: "badge--danger", ink: "badge--ink", neutral: "", voice: "badge--voice" };
export function StatusBadge({ tone = "neutral", children }) {
  return <span className={`badge ${TONE[tone] ?? ""}`}>{children}</span>;
}

// Labels what kind of truth a piece of content is.
const TRUTH = {
  source: { icon: "check", text: () => `Source: ${PROJECT.agency}` },
  osm: { icon: "check", text: "OpenStreetMap data" },
  estimate: { icon: "ruler", text: "Estimate, not surveyed" },
  illustrative: { icon: "info", text: () => COPY.illustrativeLabel },
  sample: { icon: "info", text: "Sample comments · not real residents" },
  yours: { icon: "lock", text: "Saved in this browser only" },
  simulated: { icon: "sparkle", text: "Simulated render" },
};
export function Truth({ kind, children }) {
  const t = TRUTH[kind] || TRUTH.illustrative;
  return <span className={`truth truth--${kind}`}><Icon name={t.icon} />{children || (typeof t.text === "function" ? t.text() : t.text)}</span>;
}

export function FeatureId({ id, tone }) {
  return <span className={`fid ${tone ? `fid--${tone}` : ""}`}>{id}</span>;
}

export function SectionHeader({ eyebrow, title, children, action }) {
  return (
    <div className="section-head">
      <div className="stack" style={{ "--stack": "8px" }}>
        {eyebrow && <p className="t-eyebrow">{eyebrow}</p>}
        <h2 className="t-h2">{title}</h2>
        {children && <p className="t-body t-muted measure">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function Notice({ tone = "", icon = "info", children }) {
  return <div className={`notice ${tone ? `notice--${tone}` : ""}`}><Icon name={icon} /><div>{children}</div></div>;
}

export function Empty({ icon = "inbox", title, children, action, level = 3 }) {
  const H = `h${level}`;
  return (
    <div className="empty">
      <div className="empty__icon"><Icon name={icon} /></div>
      <H className="t-h3">{title}</H>
      {children && <p className="t-compact t-muted measure">{children}</p>}
      {action}
    </div>
  );
}

export function Steps({ total, current }) {
  return <div className="steps" aria-hidden="true">{Array.from({ length: total }, (_, i) => <span key={i} data-on={i <= current} />)}</div>;
}

export function Legend({ items }) {
  return (
    <div className="legend">
      <p className="t-eyebrow">Key</p>
      <ul>
        {items.map((it) => (
          <li key={it.label}><span className={`legend__sw legend__sw--${it.swatch}`} style={it.style} aria-hidden="true" />{it.label}</li>
        ))}
      </ul>
    </div>
  );
}

export const LEGEND_PROPOSAL = [
  { swatch: "existing", label: "Existing sidewalk & crossing (OSM)" },
  { swatch: "island", label: "Refuge island" },
  { swatch: "turn", label: "Center turn lane" },
  { swatch: "bus", label: "Bus and right-turn lane" },
  { swatch: "bike", label: "Bike lane" },
  { swatch: "parking", label: "Parking" },
  { swatch: "comment", label: "Resident comment (sample)" },
  { swatch: "feature", label: "Feature you can inspect" },
];

export const fmtDate = (iso, opts = { month: "short", day: "numeric", year: "numeric" }) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", opts);
