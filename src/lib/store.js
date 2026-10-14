// Local persistence for the demo: the resident's drafts and submitted comments, and
// staff triage decisions. There is no server in this prototype; everything stays in this
// browser's localStorage and is wiped by "Reset demo".
import { useSyncExternalStore } from "react";

const KEY = "forma.v1";
const listeners = new Set();

const initial = () => ({ draft: null, mine: [], triage: {}, responses: {}, themeDecisions: {}, published: false, followed: ["alder-8th"] });

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...initial(), ...JSON.parse(raw) } : initial();
  } catch {
    return initial();
  }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage may be blocked; state still lives in memory */ }
}

export function setState(patch) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  save();
  listeners.forEach((l) => l());
}

export function getState() { return state; }

export function useStore(selector = (s) => s) {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => selector(state),
  );
}

export function resetDemo() {
  state = initial();
  save();
  listeners.forEach((l) => l());
}

// ——— Draft & submission ———
export function updateDraft(patch) {
  setState((s) => ({ draft: { ...(s.draft || { visibility: "public", theme: null, text: "", lngLat: null, option: null, name: "" }), ...patch } }));
}

export function clearDraft() { setState({ draft: null }); }

export function submitDraft() {
  const d = state.draft;
  const described = d?.locMode === "describe" && d.describe?.trim();
  if ((!d?.lngLat && !described) || !d.text?.trim()) throw new Error("A location and a comment are required.");
  const id = `my-${Date.now().toString(36)}`;
  const ref = `FRM-${Math.floor(Date.now() / 1000).toString(36).toUpperCase().slice(-6)}`;
  const comment = {
    id, ref, lngLat: described ? null : d.lngLat, theme: d.theme, text: d.text.trim(), option: d.option, public: d.visibility === "public",
    author: d.visibility === "public" ? (d.name?.trim() || "Resident") : "Private to the project team",
    // A location described in words has no real coordinate; maps skip it and show the words instead.
    locMode: described ? "describe" : "map", describe: described ? d.describe.trim() : null, placeLabel: d.placeLabel || null, featureId: d.featureId || null,
    date: new Date().toISOString().slice(0, 10), status: "received", mine: true, sentiment: d.sentiment || "concern", truth: "yours",
  };
  setState((s) => ({ mine: [comment, ...s.mine], draft: null }));
  return comment;
}

export function setTriage(commentId, patch) {
  setState((s) => ({ triage: { ...s.triage, [commentId]: { ...(s.triage[commentId] || {}), ...patch } } }));
}
