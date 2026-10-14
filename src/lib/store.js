// Local persistence for the demo: the resident's drafts and submitted comments, and
// staff triage decisions. There is no server in this prototype; everything stays in this
// browser's localStorage and is wiped by "Reset demo".
import { useSyncExternalStore } from "react";
import { activeId } from "../data/featured.js";

const KEY = "forma.v3";
const OLD_KEY = "forma.v2";
const listeners = new Set();

// Drafts, comments, triage and publishing belong to one project; selectors see the active project's.
const SCOPED = ["draft", "mine", "triage", "responses", "themeDecisions", "published", "publishedAt"];
const scopeInitial = () => ({ draft: null, mine: [], triage: {}, responses: {}, themeDecisions: {}, published: false, publishedAt: null });
const initial = () => ({ followed: ["hawthorne"], byProject: {} });

let state = load();
let view = null;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initial(), ...JSON.parse(raw) };
    // Before projects were separate, everything belonged to Hawthorne.
    const old = JSON.parse(localStorage.getItem(OLD_KEY) || "null");
    if (old) {
      const hw = Object.fromEntries(SCOPED.filter((k) => k in old).map((k) => [k, old[k]]));
      hw.mine = (hw.mine || []).map((c) => ({ project: "hawthorne", ...c }));
      return { ...initial(), followed: old.followed || ["hawthorne"], byProject: { hawthorne: hw } };
    }
  } catch { /* fall through */ }
  return initial();
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage may be blocked; state still lives in memory */ }
}

const scopeOf = (id) => ({ ...scopeInitial(), ...(state.byProject[id] || {}) });

// The state as one project sees it: global keys plus that project's scoped keys. Cached per project.
function current() {
  const id = activeId();
  if (!view || view.id !== id) view = { id, value: { ...state, ...scopeOf(id) } };
  return view.value;
}

export function setState(patch) {
  const id = activeId();
  const p = typeof patch === "function" ? patch(current()) : patch;
  const scoped = {}, global = {};
  for (const [k, v] of Object.entries(p)) (SCOPED.includes(k) ? scoped : global)[k] = v;
  state = { ...state, ...global, byProject: { ...state.byProject, [id]: { ...scopeOf(id), ...scoped } } };
  view = null;
  save();
  listeners.forEach((l) => l());
}

export function getState() { return current(); }

export function useStore(selector = (s) => s) {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => selector(current()),
  );
}

// Every comment submitted in this browser, across projects, newest first.
export const allMine = () => Object.entries(state.byProject).flatMap(([id, p]) => (p.mine || []).map((c) => ({ project: id, ...c })))
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
export function useAllMine() {
  const all = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state);
  return all === lastAll.state ? lastAll.value : (lastAll = { state: all, value: allMine() }).value;
}
let lastAll = { state: null, value: [] };

export function resetDemo() {
  state = initial();
  view = null;
  save();
  listeners.forEach((l) => l());
}

// ——— Draft & submission ———
export function updateDraft(patch) {
  setState((s) => ({ draft: { ...(s.draft || { visibility: "public", theme: null, text: "", lngLat: null, option: null, name: "" }), ...patch } }));
}

export function clearDraft() { setState({ draft: null }); }

export function submitDraft() {
  const d = current().draft;
  const described = d?.locMode === "describe" && d.describe?.trim();
  if ((!d?.lngLat && !described) || !d.text?.trim()) throw new Error("A location and a comment are required.");
  const id = `my-${Date.now().toString(36)}`;
  const ref = `FRM-${Math.floor(Date.now() / 1000).toString(36).toUpperCase().slice(-6)}`;
  const comment = {
    id, ref, lngLat: described ? null : d.lngLat, theme: d.theme, text: d.text.trim(), option: d.option, public: d.visibility === "public",
    author: d.visibility === "public" ? (d.name?.trim() || "Resident") : "Private to the project team",
    // A location described in words has no real coordinate; maps skip it and show the words instead.
    locMode: described ? "describe" : "map", describe: described ? d.describe.trim() : null, placeLabel: d.placeLabel || null, featureId: d.featureId || null,
    date: new Date().toISOString().slice(0, 10), status: "received", mine: true, project: activeId(), sentiment: d.sentiment || "concern", truth: "yours",
  };
  setState((s) => ({ mine: [comment, ...s.mine], draft: null }));
  return comment;
}

export function setTriage(commentId, patch) {
  setState((s) => ({ triage: { ...s.triage, [commentId]: { ...(s.triage[commentId] || {}), ...patch } } }));
}
