import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { Empty, Notice, StatusBadge, Truth } from "../components/ui.jsx";
import { PROJECTS } from "../data/projects.js";
import { useMapMode, useParam } from "../lib/useMapMode.js";
import { flyDuration, prefersReducedMotion } from "../lib/motion.js";
import { ProjectCard, distanceMeters, formatDistance, matchesQuery, parseNear, useLocateOnce } from "./DiscoveryKit.jsx";
import { queryWords } from "../lib/search.js";
import { geocode } from "../lib/geocode.js";
import { MAPBOX_TOKEN } from "../lib/env.js";
import "./discovery.css";

const STAGES = [
  { status: "Exploring", tone: "neutral", title: "Ideas wanted", body: "Nothing is drawn yet" },
  { status: "Feedback open", tone: "accent", title: "Comment on options", body: "Designs are ready to react to" },
  { status: "In review", tone: "warning", title: "Team is reading", body: "Comments are closed" },
  { status: "Decision published", label: "Decided", tone: "ink", title: "Decision made", body: "Read the reasons" },
];
const TOPICS = [...new Set(PROJECTS.map((p) => p.topic))];

const bounds = (list) => {
  const lng = list.map((p) => p.lngLat[0]);
  const lat = list.map((p) => p.lngLat[1]);
  return [[Math.min(...lng), Math.min(...lat)], [Math.max(...lng), Math.max(...lat)]];
};
const ALL_BOUNDS = bounds(PROJECTS);
const INITIAL = { center: [(ALL_BOUNDS[0][0] + ALL_BOUNDS[1][0]) / 2, (ALL_BOUNDS[0][1] + ALL_BOUNDS[1][1]) / 2], zoom: 13, bearing: 0, pitch: 0 };

export default function Directory() {
  const [mode, setMode] = useMapMode();
  const [q, setQ] = useParam("q", "");
  const [stage, setStage] = useParam("stage");
  const [topic, setTopic] = useParam("topic");
  const [nearRaw, setNear] = useParam("near");
  const [sel, setSel] = useParam("p");
  const [loc, locate] = useLocateOnce();
  const mapRef = useRef(null);
  const near = parseNear(nearRaw);

  // When no project mentions the words typed, treat them as a place ("Hawthorne", "97214")
  // and list projects nearest to it instead of showing nothing.
  const query = q.trim();
  const textHits = useMemo(() => PROJECTS.filter((p) => matchesQuery(p, query)).length, [query]);
  const wantsPlace = !textHits && queryWords(query).length > 0;
  const [place, setPlace] = useState(null); // { q, status: "busy" | "found" | "none", label?, lngLat? }
  useEffect(() => {
    if (!wantsPlace) { setPlace(null); return; }
    setPlace({ q: query, status: "busy" });
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      geocode(query, { mapboxToken: MAPBOX_TOKEN, signal: ctrl.signal })
        .then((hit) => setPlace(hit ? { q: query, status: "found", ...hit } : { q: query, status: "none" }))
        .catch((err) => { if (err.name !== "AbortError") setPlace({ q: query, status: "none" }); });
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query, wantsPlace]);
  const placeHit = place?.status === "found" && place.q === query ? place : null;
  const origin = near || placeHit?.lngLat || null;

  const results = useMemo(() => {
    const list = PROJECTS
      .filter((p) => placeHit || matchesQuery(p, query))
      .filter((p) => !stage || p.status === stage)
      .filter((p) => !topic || p.topic === topic)
      .map((p) => ({ ...p, meters: origin ? distanceMeters(origin, p.lngLat) : null }));
    return origin ? list.sort((a, b) => a.meters - b.meters) : list;
  }, [query, placeHit, stage, topic, origin]);

  const selected = results.find((p) => p.id === sel) || null;
  const open = results.filter((p) => p.status === "Feedback open").length;
  const nearest = origin && results.length ? results[0].meters : null;
  const nearUseful = near && nearest != null && nearest < 40000;
  const placeUseful = !near && placeHit && nearest != null && nearest < 40000;

  const camera = useMemo(() => (selected ? { center: selected.lngLat, zoom: 15.6, bearing: 0, pitch: 0 } : null), [selected]);

  const markers = useMemo(() => {
    const list = results.map((p) => ({
      id: p.id, kind: "project", lngLat: p.lngLat, label: p.title, selected: p.id === sel, dim: !!sel && p.id !== sel,
      ariaLabel: `${p.title}, ${p.status}. Show on the list.`,
    }));
    if (nearUseful) list.push({ id: "you", kind: "feature", label: "You, roughly", lngLat: near, ariaLabel: "Your approximate location" });
    if (placeUseful) list.push({ id: "place", kind: "feature", label: placeHit.label, lngLat: placeHit.lngLat, ariaLabel: `Searched place: ${placeHit.label}` });
    return list;
  }, [results, sel, near, nearUseful, placeHit, placeUseful]);

  const fitAll = (list = results, animate = true) => {
    const map = mapRef.current;
    if (!map || !list.length) return;
    const pts = nearUseful ? [...list, { lngLat: near }] : placeUseful ? [...list, { lngLat: placeHit.lngLat }] : list;
    map.fitBounds(bounds(pts), { padding: { top: 90, bottom: 80, left: 70, right: 80 }, maxZoom: 15, duration: animate ? flyDuration(900) : 0 });
  };

  // Re-frame the map when the filters change the set of projects.
  const resultKey = results.map((p) => p.id).join(",") + (nearUseful ? "+you" : "") + (placeUseful ? `+${placeHit.lngLat}` : "");
  const firstKey = useRef(resultKey);
  useEffect(() => {
    if (resultKey === firstKey.current) return;
    firstKey.current = resultKey;
    if (!sel) fitAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultKey]);

  const select = (id, fromMap) => {
    setSel(sel === id ? null : id);
    if (fromMap && sel !== id) {
      const el = document.getElementById(`dir-card-${id}`);
      el?.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }
  };

  const clearAll = () => { setQ(""); setStage(null); setTopic(null); };
  const filtersOn = !!(q || stage || topic);

  return (
    <main id="main" tabIndex={-1} className="dir">
        <div className="dir-body">
          <section className="dir-list" aria-labelledby="dir-title">
            <header className="dir-head">
            <div className="dir-head__copy">
              <p className="t-eyebrow">Portland · demo projects</p>
              <h1 id="dir-title" className="t-h1">Projects you can shape</h1>
              <p className="t-body t-muted measure">
                {PROJECTS.length} projects across the east side. Each one is at a different stage, and the stage tells you what kind of input helps most.
              </p>
            </div>
            <ol className="dir-stages" aria-label="Project stages">
              {STAGES.map((s) => (
                <li key={s.status}>
                  <StatusBadge tone={s.tone}>{s.label ?? s.status}</StatusBadge>
                  <span className="dir-stages__title">{s.title}</span>
                  <span className="t-caption t-muted">{s.body}</span>
                </li>
              ))}
            </ol>
            </header>

            <div className="dir-filters">
              <form className="dir-search" role="search" onSubmit={(e) => e.preventDefault()}>
                <div className="search">
                  <Icon name="search" />
                  <label htmlFor="dir-q" className="sr-only">Search projects by name, neighborhood or topic</label>
                  <input id="dir-q" className="input" type="search" placeholder="Search by name, neighborhood or topic" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
                </div>
                {near ? (
                  <button type="button" className="btn btn--secondary dir-search__loc" onClick={() => setNear(null)} aria-label="Stop sorting by distance">
                    <Icon name="close" />Near you
                  </button>
                ) : (
                  <button type="button" className="btn btn--secondary dir-search__loc" onClick={() => locate((n) => setNear(n))} disabled={loc.status === "busy"} aria-busy={loc.status === "busy"}>
                    <Icon name="locate" />{loc.status === "busy" ? "Locating…" : "Near me"}
                  </button>
                )}
              </form>
              {loc.message && <p className={`dir-loc-msg ${loc.status === "error" ? "is-error" : ""}`} role="status">{loc.message}</p>}

              <div className="dir-chips" role="group" aria-labelledby="dir-stage-label">
                <span id="dir-stage-label" className="dir-chips__label">Stage</span>
                <button type="button" className="chip" aria-pressed={!stage} onClick={() => setStage(null)}>All</button>
                {STAGES.map((s) => (
                  <button key={s.status} type="button" className="chip" aria-pressed={stage === s.status} onClick={() => setStage(stage === s.status ? null : s.status)}>
                    {s.status}<span className="count">{PROJECTS.filter((p) => p.status === s.status).length}</span>
                  </button>
                ))}
              </div>
              <div className="dir-chips" role="group" aria-labelledby="dir-topic-label">
                <span id="dir-topic-label" className="dir-chips__label">Topic</span>
                <button type="button" className="chip" aria-pressed={!topic} onClick={() => setTopic(null)}>All</button>
                {TOPICS.map((t) => (
                  <button key={t} type="button" className="chip" aria-pressed={topic === t} onClick={() => setTopic(topic === t ? null : t)}>
                    {t}<span className="count">{PROJECTS.filter((p) => p.topic === t).length}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="dir-count">
              <h2 id="dir-results" className="dir-count__text" aria-live="polite">
                <strong className="t-num">{results.length} project{results.length === 1 ? "" : "s"}</strong>
                <span className="t-muted"> · {open} open for comments{origin ? " · nearest first" : ""}</span>
              </h2>
              {filtersOn && <button type="button" className="btn btn--ghost btn--sm" onClick={clearAll}>Clear filters</button>}
            </div>

            {placeHit && (
              <Notice icon="pin">
                No project mentions “{query}”, so these are sorted by distance from {placeHit.label}
                {placeUseful ? "." : `, about ${formatDistance(nearest).replace(" away", "")} away. Every Forma demo project is in Portland, Oregon.`}
              </Notice>
            )}

            {near && !nearUseful && results.length > 0 && (
              <Notice icon="globe">You're about {formatDistance(nearest).replace(" away", "")} from these projects. Every Forma demo project is in Portland, Oregon.</Notice>
            )}

            {place?.status === "busy" && !results.length ? (
              <p className="dir-loc-msg" role="status">Looking up “{query}”…</p>
            ) : results.length ? (
              <ul className="dir-cards">
                {results.map((p) => (
                  <li key={p.id} id={`dir-card-${p.id}`} className="dir-cards__item">
                    <ProjectCard p={p} distance={p.meters != null ? formatDistance(p.meters) : null} selected={p.id === sel} headingLevel={3} />
                    <button type="button" className="dir-cards__locate" aria-pressed={p.id === sel} onClick={() => select(p.id)}>
                      <Icon name="pin" /><span>{p.id === sel ? "Shown on map" : "Show on map"}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="dir-empty">
                <Empty icon="search" title="No projects match" action={<button type="button" className="btn btn--secondary btn--sm" onClick={clearAll}>Clear filters</button>}>
                  {place?.status === "none" ? `We couldn't find a project or a Portland place called “${query}”. ` : ""}Try a neighborhood like Buckman or Richmond, a street, or a topic like transit.
                </Empty>
              </div>
            )}
            <div className="dir-truth">
              <Truth kind="illustrative">Real Portland locations; every project, status and date is fictional. Only Alder &amp; 8th is fully built.</Truth>
              <p className="t-caption t-muted">Map data © OpenStreetMap contributors · Tiles by OpenFreeMap</p>
            </div>
          </section>

          <div className="dir-map">
            <MapView
              mode={mode}
              onModeChange={setMode}
              initialCamera={INITIAL}
              camera={camera}
              showExisting={false}
              focusMask={false}
              hud={false}
              markers={markers}
              clusterKinds={[]}
              onMarkerClick={(m) => m.kind === "project" && select(m.id, true)}
              onReady={(map) => { mapRef.current = map; fitAll(results, false); }}
              ariaLabel="Map of Forma demo projects in Portland"
              streetTarget={selected?.lngLat}
              streetContext="Street-level photos near the selected project."
            >
              {selected ? (
                <div className="dir-pop panel-float" aria-live="polite">
                  <div className="dir-pop__top">
                    <StatusBadge tone={selected.statusTone}>{selected.status}</StatusBadge>
                    <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => setSel(null)} aria-label="Close project summary"><Icon name="close" /></button>
                  </div>
                  <p className="dir-pop__title">{selected.title}</p>
                  <p className="t-caption t-muted">{selected.area} · {selected.topic}{selected.meters != null ? ` · ${formatDistance(selected.meters)}` : ""}</p>
                  <div className="dir-pop__actions">
                    <Link to={`/projects/${selected.id}`} className="btn btn--accent btn--sm">{selected.live ? "Open project" : "Preview project"}<Icon name="arrowRight" /></Link>
                    <button type="button" className="btn btn--secondary btn--sm" onClick={() => { setSel(null); fitAll(); }}>Show all</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="dir-fit glass" onClick={() => fitAll()}><Icon name="expand" />Show all {results.length}</button>
              )}
            </MapView>
          </div>
        </div>
    </main>
  );
}
