// The active, fully built project. Every project screen imports its data from here.
// Bindings are live: ProjectLayout calls loadProject(id) before rendering a project's pages,
// which swaps every export below to that project's module. Read them at render time, not at import time.
import { useSyncExternalStore } from "react";
import * as hawthorne from "./hawthorne.js";

const LOADERS = {
  hawthorne: async () => hawthorne,
};
// Short names for switchers on screens outside a project (/me, /staff).
export const FULL_PROJECTS = [
  { id: "hawthorne", short: "SE Hawthorne" },
];
export const FULL_PROJECT_IDS = Object.keys(LOADERS);
export const isFullProject = (id) => id in LOADERS;

export let ORIGIN, F, SOURCES, CROSS_STREETS, CAMERA, PLACE, EXISTING_FEATURES, BOUNDARY, STREET_LABELS, OPTIONS, OPTION_BY_ID,
  VERSIONS, REVISION_CHANGES, STORY, SAMPLE_COMMENTS, THEMES, THEME_BY_ID, SURVEY, RESULTS, DECISION, TIMELINE, EVIDENCE,
  PROJECT, describePlace, WHERE, TODAY_RULES, FID_RULES, NOTICE, MATRIX_ROWS, inProjectArea, COPY, OSM, LEGEND;
export let PROJECT_BASE, TOTAL_COMMENTS;

function use(m) {
  ({ ORIGIN, F, SOURCES, CROSS_STREETS, CAMERA, PLACE, EXISTING_FEATURES, BOUNDARY, STREET_LABELS, OPTIONS, OPTION_BY_ID,
    VERSIONS, REVISION_CHANGES, STORY, SAMPLE_COMMENTS, THEMES, THEME_BY_ID, SURVEY, RESULTS, DECISION, TIMELINE, EVIDENCE,
    PROJECT, describePlace, WHERE, TODAY_RULES, FID_RULES, NOTICE, MATRIX_ROWS, inProjectArea, COPY, OSM, LEGEND } = m);
  PROJECT_BASE = `/projects/${PROJECT.id}`;
  TOTAL_COMMENTS = THEMES.reduce((n, t) => n + t.count, 0);
  // Notify after the current render: ProjectLayout switches projects while rendering.
  queueMicrotask(() => listeners.forEach((l) => l()));
}
const listeners = new Set();
use(hawthorne);

const cache = { hawthorne };
export const activeId = () => PROJECT.id;

// Loads a project's module and makes it active. Resolves to the module, or null for an unknown id.
export async function loadProject(id) {
  if (!LOADERS[id]) return null;
  const m = cache[id] || (cache[id] = await LOADERS[id]());
  use(m);
  return m;
}
// "Alternative 2" / "Alt 2" on Hawthorne, "Option D" on Creston: each project names options its own way.
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
export const countWord = (n) => WORDS[n] ?? String(n);
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const optName = (id) => `${COPY.alt} ${id}`;
export const optTag = (id) => `${COPY.altShort} ${id}`;

// For screens outside a project's routes (/me, /staff): re-render when the active project changes.
export function useActiveProjectId() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => PROJECT.id);
}

// Synchronous switch for an already loaded project.
export function activateLoaded(id) {
  if (!cache[id]) return false;
  if (PROJECT.id !== id) use(cache[id]);
  return true;
}
