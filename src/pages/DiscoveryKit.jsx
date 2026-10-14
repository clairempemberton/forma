// Pieces shared by the public discovery screens: landing, how it works, directory,
// project preview and not found.
import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo, StatusBadge } from "../components/ui.jsx";
import Icon from "../components/Icon.jsx";
import { distanceMeters } from "../lib/geo.js";

// ——— Site footer ———
export function SiteFooter() {
  return (
    <footer className="dsc-footer">
      <div className="wrap dsc-footer__inner">
        <div className="dsc-footer__brand stack" style={{ "--stack": "14px" }}>
          <Logo />
          <p className="t-compact t-muted">
            Forma is a prototype for planning streets in the open. The corner is real; the project, its options, comments and outcomes are fictional.
          </p>
        </div>
        <nav className="dsc-footer__col" aria-label="Forma">
          <p className="t-eyebrow">Forma</p>
          <Link to="/projects">Explore projects</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/me">My comments</Link>
        </nav>
        <nav className="dsc-footer__col" aria-label="Demo project">
          <p className="t-eyebrow">Demo project</p>
          <Link to="/projects/alder-8th">Alder &amp; 8th</Link>
          <Link to="/projects/alder-8th/text">Text-only version</Link>
          <Link to="/staff">Staff workspace (demo)</Link>
        </nav>
        <div className="dsc-footer__col">
          <p className="t-eyebrow">Data</p>
          <p className="t-compact t-muted">Map data © OpenStreetMap contributors (ODbL). Base map tiles by OpenFreeMap. Street-level photos from Mapillary contributors.</p>
        </div>
      </div>
    </footer>
  );
}

// ——— Plan thumbnails: small SVG site plans, one per project, drawn in the map palette. ———
const VARIANT = { "alder-8th": "crossing", "belmont-12th": "transit", "laurelhurst-north": "park", "broadway-7th": "signal", "division-50th": "corner" };

export function PlanThumb({ id, className = "" }) {
  const v = VARIANT[id] || "crossing";
  return (
    <svg className={`dsc-plan ${className}`} viewBox="0 0 320 168" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <rect width="320" height="168" fill="#f4f6f8" />
      {v === "crossing" && <Crossing />}
      {v === "transit" && <Transit />}
      {v === "park" && <Park />}
      {v === "signal" && <Signal />}
      {v === "corner" && <Corner />}
    </svg>
  );
}

const ROAD = "#e2e6eb";
const BLOCK = "#ffffff";
const EDGE = "#d6dbe2";
const ACC = "#2b50f0";
const ACC_FILL = "rgba(43,80,240,0.14)";
const TREE = "#cfe6db";
const TREE_EDGE = "#7bb89f";

const Block = (p) => <rect rx="3" fill={BLOCK} stroke={EDGE} strokeWidth="1" {...p} />;
const Tree = ({ x, y, r = 7, ring }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={TREE} stroke={TREE_EDGE} strokeWidth="1" />
    {ring && <circle cx={x} cy={y} r={r + 3} fill="none" stroke={ACC} strokeWidth="1.4" />}
  </g>
);
const Stripes = ({ x, y, w, h, n = 6, vertical, color = "#fff" }) =>
  Array.from({ length: n }, (_, i) =>
    vertical
      ? <rect key={i} x={x} y={y + (i * h) / n + 1} width={w} height={h / n - 2.4} fill={color} />
      : <rect key={i} x={x + (i * w) / n + 1} y={y} width={w / n - 2.4} height={h} fill={color} />,
  );
const Dashes = ({ x0, x1, y, vertical }) =>
  Array.from({ length: Math.floor((x1 - x0) / 18) }, (_, i) =>
    vertical
      ? <rect key={i} x={y - 0.75} y={x0 + i * 18} width="1.5" height="9" fill="#fff" />
      : <rect key={i} x={x0 + i * 18} y={y - 0.75} width="9" height="1.5" fill="#fff" />,
  );

function Crossing() {
  return (
    <>
      <rect x="0" y="62" width="320" height="44" fill={ROAD} />
      <rect x="138" y="0" width="44" height="168" fill={ROAD} />
      <Block x="-4" y="-4" width="130" height="54" />
      <Block x="194" y="-4" width="130" height="54" />
      <Block x="-4" y="118" width="130" height="54" />
      <Block x="194" y="118" width="130" height="54" />
      <Dashes x0={0} x1={130} y={84} />
      <Dashes x0={196} x1={320} y={84} />
      {/* bike lane south side */}
      <rect x="0" y="96" width="132" height="10" fill={ACC_FILL} />
      <rect x="188" y="96" width="132" height="10" fill={ACC_FILL} />
      {/* raised crossings */}
      <rect x="140" y="44" width="40" height="16" fill={ACC_FILL} stroke={ACC} strokeWidth="1.4" rx="2" />
      <Stripes x={142} y={46} w={36} h={12} />
      <rect x="140" y="108" width="40" height="16" fill={ACC_FILL} stroke={ACC} strokeWidth="1.4" rx="2" />
      <Stripes x={142} y={110} w={36} h={12} />
      {/* curb extensions NE and SW */}
      <rect x="180" y="52" width="24" height="18" rx="5" fill={ACC_FILL} stroke={ACC} strokeWidth="1.4" />
      <rect x="116" y="98" width="24" height="18" rx="5" fill={ACC_FILL} stroke={ACC} strokeWidth="1.4" />
      <Tree x={226} y={36} ring />
      <Tree x={94} y={36} ring />
      <Tree x={226} y={134} />
      <Tree x={60} y={134} />
      <circle cx="122" cy="110" r="3.2" fill="#d99035" stroke="#fff" />
    </>
  );
}

function Transit() {
  return (
    <>
      <rect x="0" y="70" width="320" height="48" fill={ROAD} />
      <Dashes x0={4} x1={320} y={94} />
      <Block x="-4" y="-4" width="150" height="58" />
      <Block x="164" y="-4" width="160" height="58" />
      <Block x="-4" y="134" width="328" height="40" />
      <rect x="150" y="0" width="10" height="56" fill="#eef1f4" />
      {/* bus pad + shelter */}
      <rect x="184" y="56" width="96" height="14" fill={ACC_FILL} />
      <rect x="208" y="58" width="48" height="9" rx="2" fill="#fff" stroke={ACC} strokeWidth="1.6" />
      <rect x="190" y="74" width="84" height="18" rx="3" fill="none" stroke={ACC} strokeWidth="1.2" strokeDasharray="3 3" />
      <Tree x={40} y={28} />
      <Tree x={110} y={30} />
      <Tree x={300} y={30} />
      <circle cx="196" cy="62" r="3" fill="#d99035" stroke="#fff" />
    </>
  );
}

function Park() {
  return (
    <>
      <rect x="0" y="0" width="320" height="30" fill={ROAD} />
      <rect x="250" y="0" width="70" height="168" fill={ROAD} />
      <rect x="0" y="40" width="240" height="132" rx="4" fill="#e7f2ec" stroke="#cfe0d6" />
      <Block x="262" y="40" width="70" height="60" />
      <Block x="262" y="110" width="70" height="62" />
      <Tree x={30} y={70} r={12} />
      <Tree x={62} y={120} r={14} />
      <Tree x={120} y={78} r={10} />
      <Tree x={180} y={130} r={13} />
      <Tree x={210} y={66} r={9} />
      {/* proposed path */}
      <path d="M118 30 C 120 70, 170 86, 160 172" fill="none" stroke={ACC} strokeWidth="6" strokeLinecap="round" opacity="0.18" />
      <path d="M118 30 C 120 70, 170 86, 160 172" fill="none" stroke={ACC} strokeWidth="1.6" strokeDasharray="5 4" />
      <rect x="104" y="30" width="28" height="12" rx="2" fill={ACC_FILL} stroke={ACC} strokeWidth="1.4" />
      {[[126, 60], [150, 92], [160, 128]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.4" fill="#fff" stroke={ACC} strokeWidth="1.6" />)}
    </>
  );
}

function Signal() {
  return (
    <>
      <rect x="0" y="56" width="320" height="64" fill={ROAD} />
      <rect x="150" y="0" width="40" height="168" fill={ROAD} />
      <Block x="-4" y="-4" width="140" height="48" />
      <Block x="204" y="-4" width="120" height="48" />
      <Block x="-4" y="132" width="140" height="40" />
      <Block x="204" y="132" width="120" height="40" />
      <Dashes x0={0} x1={140} y={76} />
      <Dashes x0={0} x1={140} y={100} />
      <Dashes x0={200} x1={320} y={88} />
      <rect x="134" y="56" width="16" height="64" fill={ACC_FILL} stroke={ACC} strokeWidth="1.4" rx="2" />
      <Stripes x={136} y={58} w={12} h={60} n={9} vertical />
      <rect x="190" y="56" width="14" height="64" fill="none" />
      <Stripes x={192} y={58} w={10} h={60} n={9} vertical color="#f7f8fa" />
      {[[136, 50], [148, 126]].map(([x, y]) => (
        <g key={x}><circle cx={x} cy={y} r="5.5" fill={ACC} /><circle cx={x} cy={y} r="2" fill="#fff" /></g>
      ))}
      <Tree x={40} y={22} />
      <Tree x={250} y={22} />
    </>
  );
}

function Corner() {
  return (
    <>
      <rect x="0" y="64" width="320" height="40" fill={ROAD} />
      <rect x="196" y="0" width="38" height="168" fill={ROAD} />
      <Dashes x0={0} x1={190} y={84} />
      <Block x="-4" y="-4" width="190" height="58" />
      <Block x="244" y="-4" width="80" height="58" />
      <Block x="-4" y="114" width="190" height="58" />
      <Block x="244" y="114" width="80" height="58" />
      <rect x="198" y="64" width="34" height="40" fill="none" />
      <Stripes x={186} y={66} w={10} h={36} n={6} vertical />
      {/* refuge island under review */}
      <rect x="40" y="80" width="80" height="8" rx="4" fill={ACC_FILL} stroke={ACC} strokeWidth="1.4" strokeDasharray="4 3" />
      <Stripes x={70} y={66} w={20} h={36} n={6} vertical />
      <Tree x={60} y={30} />
      <Tree x={150} y={138} />
      <Tree x={280} y={30} />
    </>
  );
}

// ——— Near me ———
// Asks the browser for a position once and hands back a rounded lng,lat. Nothing is saved.
export function useLocateOnce() {
  const [state, setState] = useState({ status: "idle", message: "" });
  const locate = (onFound) => {
    if (!("geolocation" in navigator)) {
      setState({ status: "error", message: "This browser can't share a location. Search by neighborhood or street instead." });
      return;
    }
    setState({ status: "busy", message: "Asking your browser for your location…" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude.toFixed(3);
        const lat = pos.coords.latitude.toFixed(3);
        setState({ status: "idle", message: "" });
        onFound(`${lng},${lat}`);
      },
      (err) => {
        const denied = err?.code === 1;
        setState({ status: "error", message: denied ? "Location permission was declined. You can still search by neighborhood or street." : "We couldn't get a location. Try again, or search by neighborhood or street." });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };
  return [state, locate];
}

export function parseNear(value) {
  if (!value) return null;
  const [lng, lat] = value.split(",").map(Number);
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lng, lat];
}

export function formatDistance(m) {
  if (m < 950) return `${Math.max(50, Math.round(m / 50) * 50)} m away`;
  if (m < 100000) return `${(m / 1000).toFixed(1)} km away`;
  return `${Math.round(m / 1000).toLocaleString("en-US")} km away`;
}

export { distanceMeters };

export { matchesQuery } from "../lib/search.js";

// ——— Project card (landing + directory) ———
export function ProjectCard({ p, distance, selected, onSelect, headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  return (
    <article className={`dsc-card ${selected ? "is-selected" : ""}`} onClick={onSelect ? (e) => { if (!e.target.closest("a,button")) onSelect(); } : undefined}>
      <div className="dsc-card__media">
        <PlanThumb id={p.id} />
        {p.live && <span className="dsc-card__live">Fully built demo</span>}
      </div>
      <div className="dsc-card__body">
        <div className="dsc-card__meta">
          <StatusBadge tone={p.statusTone}>{p.status}</StatusBadge>
          <span className="t-caption t-muted">{p.area} · {p.topic}</span>
        </div>
        <H className="dsc-card__title">
          <Link to={`/projects/${p.id}`} className="dsc-card__link">{p.title}</Link>
        </H>
        <p className="t-compact t-muted">{p.summary}</p>
        <div className="dsc-card__foot">
          <span><Icon name="calendar" />{p.dates}</span>
          {distance ? <span className="dsc-card__dist"><Icon name="locate" />{distance}</span> : <span><Icon name="a11y" />{p.access}</span>}
        </div>
      </div>
    </article>
  );
}

