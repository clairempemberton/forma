// Shared pieces for the community perspectives screens and the three-step feedback flow.
import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { EXISTING_FEATURES, F, ORIGIN, THEME_BY_ID, OPTION_BY_ID } from "../data/alder.js";
import { distanceMeters } from "../lib/geo.js";
import { Steps } from "../components/ui.jsx";
import MapView from "../map/MapView.jsx";
import { useMemo } from "react";

export const PROJECT_BASE = "/projects/alder-8th";

// Short names for the theme chips; the full name is the theme's `name`.
export const THEME_SHORT = {
  "T-CROSS": "Crossing safety",
  "T-ACCESS": "Curb ramps",
  "T-BIKE": "Bike connection",
  "T-LOADING": "Loading",
  "T-SHADE": "Shade and trees",
  "T-TRANSIT": "Bus stop",
};
export const THEME_ICON = { "T-CROSS": "walk", "T-ACCESS": "access", "T-BIKE": "bike", "T-LOADING": "truck", "T-SHADE": "tree", "T-TRANSIT": "bus" };
export const themeName = (id, short = true) => (id && THEME_BY_ID[id] ? (short ? THEME_SHORT[id] : THEME_BY_ID[id].name) : "Something else");

export const OPTION_CHOICES = [
  { id: "today", label: "Today" },
  { id: "A", label: "Option A" },
  { id: "B", label: "Option B" },
  { id: "C", label: "Option C" },
  { id: "general", label: "General" },
];
// Stored as null (general), "today", or an option id.
export const optionLabel = (o) => (o == null || o === "general" ? "General" : o === "today" ? "Today's corner" : `Option ${o}${OPTION_BY_ID[o] ? ` · ${OPTION_BY_ID[o].short}` : ""}`);

export const SENTIMENTS = [
  { id: "concern", label: "A concern", short: "Concern", icon: "alert", hint: "Something here worries you or gets in your way." },
  { id: "support", label: "Support", short: "Support", icon: "check", hint: "Something you want to keep or see built." },
  { id: "idea", label: "An idea", short: "Idea", icon: "sparkle", hint: "A suggestion the team may not have thought of." },
];
export const sentimentLabel = (s) => SENTIMENTS.find((x) => x.id === s)?.short || "Observation";

// Nearest inspectable feature, with the distance in metres.
export function nearestFeature(lngLat) {
  let best = null;
  for (const f of EXISTING_FEATURES) {
    const d = distanceMeters(lngLat, f.lngLat);
    if (!best || d < best.distance) best = { feature: f, distance: d };
  }
  return best;
}

export const distanceFromCorner = (lngLat) => distanceMeters(lngLat, ORIGIN);

// A plain-language name for a spot, from its position relative to the corner.
export function describePlace(lngLat) {
  if (!lngLat) return "No location yet";
  const [x, y] = F.toLocal(lngLat);
  const d = Math.hypot(x, y);
  if (d < 4) return "Middle of the intersection";
  if (Math.abs(x) < 15 && Math.abs(y) < 15) return `${y >= 0 ? "North" : "South"}${x >= 0 ? "east" : "west"} corner of Alder & 8th`;
  if (Math.abs(y) <= 9) return `SE Alder St, ${x > 0 ? "east" : "west"} of 8th`;
  if (Math.abs(x) <= 9) return `SE 8th Ave, ${y > 0 ? "north" : "south"} of Alder`;
  if (y < -45) return "Toward SE Morrison St";
  return `${y >= 0 ? "North" : "South"}${x >= 0 ? "east" : "west"} block, ${Math.round(d)} m from the corner`;
}

export const fmtMeters = (m) => (m < 1 ? "under 1 m" : `${Math.round(m)} m`);

// Step header for the three-step flow.
export function FlowSteps({ step, label }) {
  return (
    <div className="pt-flowsteps">
      <Steps total={3} current={step - 1} />
      <span className="t-caption t-muted t-num">Step {step} of 3 · {label}</span>
    </div>
  );
}

// A switch built on a real button.
export function Switch({ checked, onChange, id, labelledBy }) {
  return (
    <button type="button" role="switch" id={id} aria-checked={checked} aria-labelledby={labelledBy} className="pt-switch" onClick={() => onChange(!checked)}>
      <span aria-hidden="true" />
    </button>
  );
}

export function BackLink({ to, children }) {
  return <Link className="pt-back" to={to}><Icon name="arrowLeft" />{children}</Link>;
}

const lockMap = (map) => {
  ["dragPan", "scrollZoom", "boxZoom", "dragRotate", "keyboard", "doubleClickZoom", "touchZoomRotate", "touchPitch"].forEach((h) => map[h]?.disable?.());
  map.getCanvas().setAttribute("tabindex", "-1");
};

// A small, locked map that shows one pin. Decorative: the place is always described in text beside it.
export function MiniMap({ lngLat, zoom = 18.9, className = "", proposal = null }) {
  const markers = useMemo(() => (lngLat ? [{ id: "pin", kind: "comment", lngLat, label: "Your comment", mine: true, selected: true }] : []), [lngLat]);
  const camera = useMemo(() => (lngLat ? { center: lngLat, zoom, bearing: 0, pitch: 0 } : null), [lngLat, zoom]);
  if (!lngLat) return null;
  return (
    <div className={`pt-minimap ${className}`} aria-hidden="true" inert="">
      <MapView
        initialCamera={{ center: lngLat, zoom, bearing: 0, pitch: 0 }}
        camera={camera}
        markers={markers}
        proposal={proposal}
        showProposal={!!proposal}
        controls={false}
        modeSwitch={false}
        hud={false}
        onReady={lockMap}
        ariaLabel="Small map showing your pin"
      />
    </div>
  );
}

// Tracking for a submitted comment. Staff triage (lib/store.js `triage[id]`) may set
// { theme, status } where status is one of read | grouped | answered | hidden.
const READ = ["read", "grouped", "themed", "answered", "responded"];
const GROUPED = ["grouped", "themed", "answered", "responded"];
const ANSWERED = ["answered", "responded"];
export function trackComment(c, triage = {}, published = false) {
  const t = triage[c.id] || {};
  const assignedTheme = t.theme || null;
  const theme = assignedTheme || c.theme;
  let level = 0;
  if (READ.includes(t.status) || assignedTheme) level = 1;
  if (GROUPED.includes(t.status) || assignedTheme) level = 2;
  if (ANSWERED.includes(t.status) || (level >= 2 && published)) level = 3;
  const steps = [
    { id: "received", title: "Received", body: "Saved with its pin." },
    { id: "read", title: "Read by the team", body: "Two planners read every comment." },
    { id: "grouped", title: "Grouped into a theme", body: "Comments that describe the same thing are read together." },
    { id: "answered", title: "Answered publicly", body: "The team responds to each theme, in public." },
  ].map((s, i) => ({ ...s, status: i <= level ? "done" : i === level + 1 ? "current" : "upcoming" }));
  return { level, steps, theme, assignedByTeam: !!assignedTheme, hidden: t.status === "hidden" };
}
