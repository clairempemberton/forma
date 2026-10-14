// Shared derivations for the staff workspace. Everything here is computed from the demo
// data (SAMPLE_COMMENTS), the comments submitted in this browser (store "mine") and the
// staff's own triage decisions (store "triage"). Nothing is hardcoded per comment.
import { useMemo, createElement as h } from "react";
import { SAMPLE_COMMENTS, THEMES, THEME_BY_ID, OPTIONS, EXISTING_FEATURES, VERSIONS, REVISION_CHANGES, PROJECT, TIMELINE, F } from "../data/alder.js";
import { distanceMeters, centroid } from "../lib/geo.js";
import { useStore, setState } from "../lib/store.js";

export const STATUSES = [
  { id: "new", label: "New", tone: "voice" },
  { id: "read", label: "Read", tone: "neutral" },
  { id: "grouped", label: "Grouped", tone: "accent" },
  { id: "follow-up", label: "Needs follow-up", tone: "warning" },
  { id: "hidden", label: "Hidden", tone: "ink" },
];
export const STATUS_BY_ID = Object.fromEntries(STATUSES.map((s) => [s.id, s]));

export const STAGES = ["Exploring", "Feedback open", "Reviewing", "Revised", "Decision published"];

export const DECISIONS = [
  { id: "addressed", label: "Addressed", tone: "positive" },
  { id: "partly", label: "Partly", tone: "accent" },
  { id: "not-adopted", label: "Not adopted", tone: "neutral" },
];
export const DECISION_BY_ID = Object.fromEntries(DECISIONS.map((d) => [d.id, d]));

// Sample ids are short (c01); give every comment a stable reference staff can quote.
export const refOf = (c) => c.ref || `CM-${c.id.replace(/\D/g, "").padStart(3, "0")}`;
export const themeName = (id) => THEME_BY_ID[id]?.name || "No theme";
export const optionLabel = (id) => (id ? `Option ${id}` : "—");

// ——— Moderation rules ———
const PHONE = /(\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
const URL_RE = /\bhttps?:\/\/|\bwww\./i;
const SHORT = 40;
const words = (t) => new Set(t.toLowerCase().match(/[a-z']{4,}/g) || []);

export function flagsFor(c, all) {
  const out = [];
  if (PHONE.test(c.text)) out.push({ id: "phone", label: "Contains a phone number", icon: "alert", pii: true });
  if (EMAIL.test(c.text)) out.push({ id: "email", label: "Contains an email address", icon: "alert", pii: true });
  if (URL_RE.test(c.text)) out.push({ id: "link", label: "Contains a link", icon: "external" });
  if (c.text.trim().length < SHORT) out.push({ id: "short", label: `Very short (${c.text.trim().length} characters)`, icon: "text" });
  const letters = c.text.replace(/[^a-z]/gi, "");
  if (letters.length > 12 && letters === letters.toUpperCase()) out.push({ id: "caps", label: "Written in capitals", icon: "alert" });
  if (all) {
    const w = words(c.text);
    const dup = all.find((o) => o.id !== c.id && o.date <= c.date && o.id < c.id && distanceMeters(o.lngLat, c.lngLat) < 4 && jaccard(w, words(o.text)) >= 0.3);
    if (dup) out.push({ id: "dup", label: `Possible duplicate of ${refOf(dup)}`, icon: "swap" });
  }
  return out;
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let n = 0; a.forEach((x) => { if (b.has(x)) n++; });
  return n / (a.size + b.size - n);
}

// ——— The working set: every comment with staff decisions applied ———
export function buildComments(mine, triage) {
  const raw = [...SAMPLE_COMMENTS, ...mine.map((m) => ({ ...m, truth: "yours" }))];
  return raw.map((c) => {
    const t = triage[c.id] || {};
    const flags = flagsFor(c, raw);
    if (t.flag) flags.push({ id: "manual", label: "Flagged by staff", icon: "flag" });
    const status = t.status || "new";
    return {
      ...c,
      ref: refOf(c),
      themeEff: t.theme !== undefined ? t.theme : c.theme,
      themeChanged: t.theme !== undefined && t.theme !== c.theme,
      status,
      note: t.note || "",
      manualFlag: !!t.flag,
      flags,
      reviewed: status !== "new",
    };
  });
}

export function useStaffData() {
  const mine = useStore((s) => s.mine);
  const triage = useStore((s) => s.triage);
  const responses = useStore((s) => s.responses) || EMPTY;
  const decisions = useStore((s) => s.themeDecisions) || EMPTY;
  const published = useStore((s) => s.published);
  const publishedAt = useStore((s) => s.publishedAt);
  const comments = useMemo(() => buildComments(mine, triage), [mine, triage]);
  return { comments, mine, triage, responses, decisions, published, publishedAt };
}
const EMPTY = {};

export const setResponse = (id, text) => setState((s) => ({ responses: { ...(s.responses || {}), [id]: text } }));
export const setThemeDecision = (id, patch) => setState((s) => ({ themeDecisions: { ...(s.themeDecisions || {}), [id]: { ...((s.themeDecisions || {})[id] || {}), ...patch } } }));

export const moderationQueue = (comments) => comments.filter((c) => c.flags.length && !c.reviewed);

export function themeStats(comments) {
  return THEMES.map((t) => {
    const list = comments.filter((c) => c.themeEff === t.id && c.status !== "hidden");
    const byOption = Object.fromEntries([...OPTIONS.map((o) => o.id), "none"].map((k) => [k, 0]));
    list.forEach((c) => { byOption[c.option || "none"]++; });
    return { ...t, list, live: list.length, byOption };
  });
}

// ——— Spatial helpers ———
// Points staff can measure from: existing features (OSM) and the labelled parts of version 2.
export const SPATIAL_FEATURES = [
  ...EXISTING_FEATURES.map((f) => ({ id: f.id, label: `${f.id} · ${f.name}`, lngLat: f.lngLat })),
  ...dedupe(VERSIONS[1].geojson.features.filter((f) => f.properties.id && f.properties.label)
    .map((f) => ({ id: f.properties.id, label: `${f.properties.id} · ${f.properties.label} (v2)`, lngLat: centroid(f) }))),
];
function dedupe(list) { const seen = new Set(); return list.filter((x) => (seen.has(x.id) ? false : seen.add(x.id))); }

export const metres = (a, b) => distanceMeters(a, b);

export function centreOf(list) {
  if (!list.length) return null;
  return [list.reduce((s, c) => s + c.lngLat[0], 0) / list.length, list.reduce((s, c) => s + c.lngLat[1], 0) / list.length];
}

// A camera that frames a set of points: zoom chosen from their spread.
export function cameraFor(list, base = 19.4) {
  const c = centreOf(list);
  if (!c) return null;
  const spread = Math.max(0, ...list.map((p) => distanceMeters(c, p.lngLat)));
  const zoom = spread < 8 ? base : spread < 20 ? 19 : spread < 45 ? 18.2 : 17.3;
  return { center: c, zoom, bearing: 0, pitch: 0 };
}

// Comments that motivated a revision change: same theme, ranked by distance to the change.
export const NEAR_M = 20;
export function evidenceFor(change, comments) {
  return comments
    .filter((c) => change.themes.includes(c.themeEff) && c.status !== "hidden")
    .map((c) => ({ ...c, dist: distanceMeters(c.lngLat, change.lngLat) }))
    .sort((a, b) => a.dist - b.dist);
}

// ——— Dates ———
export const todayISO = () => new Date().toISOString().slice(0, 10);
export function daysUntil(iso) {
  const d = new Date(`${iso}T00:00:00`);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((d - t) / 86400000);
}
export const currentStage = () => Math.max(0, STAGES.indexOf(PROJECT.status));
export const currentStep = () => TIMELINE.find((s) => s.status === "current");
export const nextStep = () => TIMELINE.find((s) => s.status === "upcoming");

// Weekly buckets (weeks start Monday) between the first and last comment date.
export function weeklyCounts(comments) {
  if (!comments.length) return [];
  const monday = (iso) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
  const dates = comments.map((c) => c.date).sort();
  const weeks = [];
  for (let w = monday(dates[0]); w <= dates[dates.length - 1]; ) {
    weeks.push({ week: w, sample: 0, yours: 0 });
    const d = new Date(`${w}T12:00:00`); d.setDate(d.getDate() + 7); w = d.toISOString().slice(0, 10);
  }
  comments.forEach((c) => { const b = weeks.find((x) => x.week === monday(c.date)); if (b) b[c.mine ? "yours" : "sample"]++; });
  return weeks;
}

// What would go public: public comments that staff have not hidden, plus their excerpts.
export function publicSet(comments) {
  return comments.filter((c) => c.public && c.status !== "hidden");
}

// The before-publishing checks, computed from current state. Used by Overview and Publish.
export function publishChecks({ comments, responses, decisions }) {
  const answered = THEMES.filter((t) => (responses[t.id] || "").trim().length > 0);
  const decided = THEMES.filter((t) => decisions[t.id]?.status);
  const pub = publicSet(comments);
  const privateLeaks = pub.filter((c) => !c.public);
  const piiLeaks = pub.filter((c) => c.flags.some((f) => f.pii));
  const queue = moderationQueue(comments);
  const v2 = VERSIONS[1].geojson.features.filter((f) => f.properties.id && f.properties.label);
  const unlabelled = VERSIONS[1].geojson.features.filter((f) => f.properties.id && !f.properties.label);
  const changesOk = REVISION_CHANGES.filter((r) => r.before && r.after && r.lngLat && r.themes.every((id) => THEME_BY_ID[id]));
  const mapText = unlabelled.length === 0 && changesOk.length === REVISION_CHANGES.length;
  return [
    {
      id: "responses", icon: "comment", title: "Every theme has a public response", blocking: true,
      ok: answered.length === THEMES.length,
      detail: `${answered.length} of ${THEMES.length} themes answered`, fix: { to: "/staff/themes", label: "Write responses" },
    },
    {
      id: "privacy", icon: "shield", title: "Privacy audit", blocking: true,
      ok: privateLeaks.length === 0 && piiLeaks.length === 0,
      detail: privateLeaks.length + piiLeaks.length === 0
        ? `${pub.length} public comments checked · no private comments or contact details`
        : `${piiLeaks.length} public comment${piiLeaks.length === 1 ? "" : "s"} contain contact details${privateLeaks.length ? ` · ${privateLeaks.length} private` : ""}`,
      items: piiLeaks, fix: { to: piiLeaks[0] ? `/staff/triage?c=${piiLeaks[0].id}` : "/staff/triage", label: "Review in Feedback" },
    },
    {
      id: "moderation", icon: "flag", title: "No flagged comments left unreviewed", blocking: true,
      ok: queue.length === 0,
      detail: queue.length ? `${queue.length} flagged comment${queue.length === 1 ? "" : "s"} still marked New` : "Every flagged comment has a status",
      items: queue, fix: { to: queue[0] ? `/staff/triage?c=${queue[0].id}` : "/staff/triage", label: "Open the queue" },
    },
    {
      id: "maptext", icon: "text", title: "Map and text versions match", blocking: true,
      ok: mapText,
      detail: `${v2.length} mapped features and ${changesOk.length} changes described in both`,
    },
    {
      id: "decisions", icon: "edit", title: "Revision decisions recorded", blocking: false,
      ok: decided.length === THEMES.length,
      detail: `${decided.length} of ${THEMES.length} themes marked addressed, partly or not adopted`, fix: { to: "/staff/revisions", label: "Record decisions" },
    },
  ];
}

export function changeThemes(change) { return change.themes.map((id) => THEME_BY_ID[id]).filter(Boolean); }
export { REVISION_CHANGES, THEMES, THEME_BY_ID, OPTIONS, F };

const PILL = { voice: "badge--voice", accent: "badge--accent", warning: "badge--warning", ink: "badge--outline", neutral: "" };
export function StatusPill({ id }) {
  const s = STATUS_BY_ID[id] || STATUS_BY_ID.new;
  return h("span", { className: `badge ${PILL[s.tone]}` }, s.label);
}
