import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { Notice, StatusBadge } from "../components/ui.jsx";
import { PROJECTS, STAGES } from "../data/projects.js";
import { useMapMode, useParam } from "../lib/useMapMode.js";
import { flyDuration, prefersReducedMotion } from "../lib/motion.js";
import { PlanThumb, distanceMeters, formatDistance, matchesQuery, parseNear, useLocateOnce } from "./DiscoveryKit.jsx";
import { useMedia } from "./proposal-lib.js";
import { queryWords } from "../lib/search.js";
import { geocode } from "../lib/geocode.js";
import { MAPBOX_TOKEN } from "../lib/env.js";
import "./discovery.css";
import "./home.css";

const bounds = (list) => {
  const lng = list.map((p) => p.lngLat[0]);
  const lat = list.map((p) => p.lngLat[1]);
  return [[Math.min(...lng), Math.min(...lat)], [Math.max(...lng), Math.max(...lat)]];
};
const ALL_BOUNDS = bounds(PROJECTS);
const INITIAL = { center: [(ALL_BOUNDS[0][0] + ALL_BOUNDS[1][0]) / 2 - 0.02, (ALL_BOUNDS[0][1] + ALL_BOUNDS[1][1]) / 2], zoom: 12.4, bearing: 0, pitch: 0 };
const TONE_OF = Object.fromEntries(STAGES.map((s) => [s.status, s.tone]));

// The home page is the product: a map of real Portland projects with a floating list.
export default function Home() {
  const [mode, setMode] = useMapMode();
  const [q, setQ] = useParam("q", "");
  const [stage, setStage] = useParam("stage");
  const [nearRaw, setNear] = useParam("near");
  const [sel, setSel] = useParam("p");
  const [hover, setHover] = useState(null);
  const [loc, locate] = useLocateOnce();
  const mapRef = useRef(null);
  const near = parseNear(nearRaw);
  const narrow = useMedia("(max-width: 767px)");

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

  const matching = useMemo(() => PROJECTS.filter((p) => placeHit || matchesQuery(p, query)), [query, placeHit]);
  const results = useMemo(() => {
    const list = matching
      .filter((p) => !stage || p.status === stage)
      .map((p) => ({ ...p, meters: origin ? distanceMeters(origin, p.lngLat) : null }));
    return origin ? list.sort((a, b) => a.meters - b.meters) : list;
  }, [matching, stage, origin]);

  const selected = results.find((p) => p.id === sel) || null;
  const nearest = origin && results.length ? results[0].meters : null;
  const originUseful = origin && nearest != null && nearest < 40000;
  const featured = !origin && results.find((p) => p.live);
  const rest = featured ? results.filter((p) => p !== featured) : results;

  const camera = useMemo(() => (selected ? { center: selected.lngLat, zoom: selected.live ? 16.2 : 15.4, bearing: 0, pitch: 0 } : null), [selected]);

  const markers = useMemo(() => {
    const list = results.map((p) => ({
      id: p.id, kind: "project", lngLat: p.lngLat, label: p.title, tone: TONE_OF[p.status], featured: !!p.live,
      selected: p.id === sel, hover: p.id === hover, dim: !!sel && p.id !== sel,
      ariaLabel: `${p.title}, ${p.status}. Show in the list.`,
    }));
    if (originUseful) list.push({ id: "origin", kind: "feature", label: near ? "You, roughly" : placeHit.label, lngLat: origin, ariaLabel: near ? "Your approximate location" : `Searched place: ${placeHit.label}` });
    return list;
  }, [results, sel, hover, origin, originUseful, near, placeHit]);

  const padding = narrow ? { top: 70, bottom: 40, left: 40, right: 40 } : { top: 90, bottom: 70, left: 470, right: 90 };
  const fitAll = (list = results, animate = true) => {
    const map = mapRef.current;
    if (!map || !list.length) return;
    const pts = originUseful ? [...list, { lngLat: origin }] : list;
    map.fitBounds(bounds(pts), { padding, maxZoom: 15, duration: animate ? flyDuration(900) : 0 });
  };

  // Re-frame the map when the filters change the set of projects.
  const resultKey = results.map((p) => p.id).join(",") + (originUseful ? `+${origin}` : "");
  const firstKey = useRef(resultKey);
  useEffect(() => {
    if (resultKey === firstKey.current) return;
    firstKey.current = resultKey;
    if (!sel) fitAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultKey]);

  const select = (id, fromMap) => {
    const next = sel === id ? null : id;
    setSel(next);
    if (!next) fitAll();
    if (fromMap && next) {
      requestAnimationFrame(() => document.getElementById(`home-p-${id}`)?.scrollIntoView({ block: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" }));
    }
  };

  // A project opened from a link (?p=…) is scrolled into view in the list.
  useEffect(() => {
    if (sel) document.getElementById(`home-p-${sel}`)?.scrollIntoView({ block: "nearest" });
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = (s) => matching.filter((p) => p.status === s).length;

  return (
    <main id="main" tabIndex={-1} className="home">
      <div className="home__map">
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
          ariaLabel="Map of projects in Portland"
          streetTarget={selected?.lngLat}
          streetContext="Street-level photos near the selected project."
        />
      </div>

      <section className="home__panel" aria-labelledby="home-title">
        <header className="home__head">
          <p className="t-eyebrow">Portland, Oregon</p>
          <h1 id="home-title" className="home__title">What's changing on Portland's streets</h1>
        </header>

        <form className="home__search" role="search" onSubmit={(e) => e.preventDefault()}>
          <div className="search">
            <Icon name="search" />
            <label htmlFor="home-q" className="sr-only">Search projects, streets or neighborhoods</label>
            <input id="home-q" className="input" type="search" placeholder="Search streets, places, projects" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          </div>
          {near ? (
            <button type="button" className="btn btn--secondary btn--icon home__loc is-on" onClick={() => setNear(null)} aria-label="Stop sorting by distance" title="Stop sorting by distance"><Icon name="close" /></button>
          ) : (
            <button type="button" className="btn btn--secondary btn--icon home__loc" onClick={() => locate((n) => setNear(n))} disabled={loc.status === "busy"} aria-busy={loc.status === "busy"} aria-label="Sort by distance from me" title="Near me"><Icon name="locate" /></button>
          )}
        </form>
        {loc.message && <p className={`home__msg ${loc.status === "error" ? "is-error" : ""}`} role="status">{loc.message}</p>}

        <div className="home__chips" role="group" aria-label="Filter by stage">
          <button type="button" className="chip" aria-pressed={!stage} onClick={() => setStage(null)}>All<span className="count">{matching.length}</span></button>
          {STAGES.map((s) => (
            <button key={s.status} type="button" className="chip" aria-pressed={stage === s.status} onClick={() => setStage(stage === s.status ? null : s.status)}>
              <span className={`home__dot home__dot--${s.tone}`} aria-hidden="true" />{s.status}<span className="count">{count(s.status)}</span>
            </button>
          ))}
        </div>

        <div className="home__scroll">
          {placeHit && (
            <Notice icon="pin">
              Nearest to {placeHit.label}{originUseful ? "" : `, about ${formatDistance(nearest).replace(" away", "")} away. Every project here is in Portland, Oregon`}.
            </Notice>
          )}
          {near && !originUseful && results.length > 0 && (
            <Notice icon="globe">You're about {formatDistance(nearest).replace(" away", "")} from these projects. Every project here is in Portland, Oregon.</Notice>
          )}
          {place?.status === "busy" && !results.length && <p className="home__msg" role="status">Looking up “{query}”…</p>}

          {featured && (
            <article id={`home-p-${featured.id}`} className={`home-feature ${sel === featured.id ? "is-selected" : ""}`} onMouseEnter={() => setHover(featured.id)} onMouseLeave={() => setHover(null)}>
              <button type="button" className="home-feature__media" onClick={() => select(featured.id)} aria-label={`Show ${featured.title} on the map`}>
                <PlanThumb id={featured.id} />
                <span className="home-feature__tag">Explore in depth</span>
              </button>
              <div className="home-feature__body">
                <div className="home-row__meta">
                  <StatusBadge tone={featured.statusTone}>{featured.status}</StatusBadge>
                  <span className="t-caption t-muted">{featured.area} · {featured.agency}</span>
                </div>
                <h2 className="home-feature__title">{featured.title}</h2>
                <p className="t-compact t-muted">{featured.summary}</p>
                <ul className="home-facts">{featured.facts.map((f) => <li key={f}>{f}</li>)}</ul>
                <Link to={`/projects/${featured.id}`} className="btn btn--accent home-feature__cta">Explore the alternatives<Icon name="arrowRight" /></Link>
              </div>
            </article>
          )}

          {rest.length > 0 && (
            <ul className="home-list" aria-label="Projects">
              {rest.map((p) => {
                const open = sel === p.id;
                return (
                  <li key={p.id} id={`home-p-${p.id}`} className={`home-row ${open ? "is-open" : ""}`} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)}>
                    <button type="button" className="home-row__btn" aria-expanded={open} onClick={() => select(p.id)}>
                      <span className={`home__dot home__dot--${p.statusTone}`} aria-hidden="true" />
                      <span className="home-row__main">
                        <span className="home-row__title">{p.title}</span>
                        <span className="home-row__sub">{p.status} · {p.area}{p.meters != null ? ` · ${formatDistance(p.meters)}` : ""}</span>
                      </span>
                      <Icon name={open ? "chevronDown" : "chevronRight"} />
                    </button>
                    {open && (
                      <div className="home-row__detail">
                        <p className="t-compact">{p.summary}</p>
                        <ul className="home-facts">{(p.facts || []).map((f) => <li key={f}>{f}</li>)}</ul>
                        <p className="t-caption t-muted"><Icon name="calendar" />{p.dates} · {p.agency}</p>
                        <div className="home-row__actions">
                          <Link to={`/projects/${p.id}`} className="btn btn--secondary btn--sm">{p.live ? "Open project" : "Details"}<Icon name="arrowRight" /></Link>
                          {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="btn btn--ghost btn--sm">Official page<Icon name="external" /></a>}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {!results.length && place?.status !== "busy" && (
            <div className="home__empty">
              <p className="t-compact"><strong>No projects match.</strong> {place?.status === "none" ? `We couldn't find a project or a Portland place called “${query}”.` : "Try another stage."}</p>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => { setQ(""); setStage(null); }}>Show all projects</button>
            </div>
          )}

          <p className="home__credit">
            Unofficial concept, not affiliated with the City of Portland. Project facts from official pages · Map data © OpenStreetMap contributors.
          </p>
        </div>
      </section>
    </main>
  );
}
