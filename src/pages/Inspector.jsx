import { useEffect, useMemo, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { Empty, FeatureId, Legend, LEGEND_PROPOSAL, Truth } from "../components/ui.jsx";
import { CAMERA, COPY, DECISION, EXISTING_FEATURES, F, LEGEND, OPTIONS, OPTION_BY_ID, THEME_BY_ID, optName, optTag } from "../data/featured.js";
import { formatCoord, point } from "../lib/geo.js";
import { useMapMode, useParam } from "../lib/useMapMode.js";
import { useIsMobile } from "../lib/motion.js";
import { KIND_LABEL, PROJECT_BASE, changesNear, commentsNear, describeWhere } from "./proposal-lib.js";
import "./proposal.css";

const RADIUS = 15;
const ZOOM = { transit: 19.2, bike: 18.9 };

// R07 · Feature inspector — one existing feature, what each alternative changes there, and what people said.
export default function Inspector() {
  const { fid } = useParams();
  const [mode, setMode] = useMapMode();
  const [optParam, setOptParam] = useParam("option", DECISION.chosen);
  const navigate = useNavigate();
  const { search } = useLocation();
  const qs = search;
  const mobile = useIsMobile();
  const headRef = useRef(null);
  const option = optParam === "today" ? null : OPTION_BY_ID[optParam] || OPTION_BY_ID[DECISION.chosen];

  const index = EXISTING_FEATURES.findIndex((f) => f.id === fid);
  const feature = EXISTING_FEATURES[index];
  const prev = index >= 0 ? EXISTING_FEATURES[(index - 1 + EXISTING_FEATURES.length) % EXISTING_FEATURES.length] : null;
  const next = index >= 0 ? EXISTING_FEATURES[(index + 1) % EXISTING_FEATURES.length] : null;

  // Keep the feature clear of the floating panel on wide screens by shifting the camera east.
  const camera = useMemo(() => {
    if (!feature) return null;
    const zoom = ZOOM[feature.kind] ?? 19.7;
    const mpp = (40075016.686 * Math.cos((feature.lngLat[1] * Math.PI) / 180)) / (512 * 2 ** zoom);
    const [x, y] = F.toLocal(feature.lngLat);
    const center = mobile ? feature.lngLat : F.toLngLat([x + 210 * mpp, y]);
    return { center, zoom, bearing: 0, pitch: 0 };
  }, [feature, mobile]);

  const perOption = useMemo(() => (feature ? OPTIONS.map((o) => ({ o, items: changesNear(o, feature.lngLat, RADIUS) })) : []), [feature]);
  const nearby = useMemo(() => (feature ? commentsNear(feature.lngLat, RADIUS) : []), [feature]);

  const markers = useMemo(() => [
    ...EXISTING_FEATURES.map((f) => ({
      id: f.id, kind: "feature", fid: f.id, label: f.name, lngLat: f.lngLat, featureKind: f.kind,
      selected: f.id === fid, dim: f.id !== fid, showLabel: f.id === fid,
    })),
    ...nearby.map((c) => ({ id: c.id, kind: "comment", lngLat: c.lngLat, label: c.text, ariaLabel: `Comment: ${c.text}` })),
  ], [fid, nearby]);

  // Move focus to the new feature's name when stepping through features.
  const firstFid = useRef(fid);
  useEffect(() => { if (fid !== firstFid.current) headRef.current?.focus({ preventScroll: true }); }, [fid]);

  // Keyboard: [ and ] step through features (not while typing).
  useEffect(() => {
    if (!feature) return undefined;
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select, [role=slider]")) return;
      if (e.key === "[") navigate(`${PROJECT_BASE}/inspect/${prev.id}${search}`);
      if (e.key === "]") navigate(`${PROJECT_BASE}/inspect/${next.id}${search}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [feature, prev, next, navigate, search]);


  if (!feature) {
    return (
      <main id="main" tabIndex={-1} className="wrap page ins-pg__missing">
        <Empty level={1} icon="search" title={`We couldn't find feature “${fid}”`}
          action={<Link to={`${PROJECT_BASE}/explore`} className="btn btn--primary"><Icon name="arrowLeft" />Back to the street</Link>}>
          It may have been renamed in a revision, or the link was mistyped. These are the features you can inspect on {COPY.placeShort}:
        </Empty>
        <ul className="rows ins-pg__missing-list" aria-label={COPY.featuresLabel}>
          {EXISTING_FEATURES.map((f) => (
            <li key={f.id}>
              <Link className="rowbtn" to={`${PROJECT_BASE}/inspect/${f.id}`}>
                <FeatureId id={f.id} />
                <span className="rowbtn__main"><span className="rowbtn__title">{f.name}</span><span className="rowbtn__sub">{f.summary}</span></span>
                <Icon name="chevronRight" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  const focus = point(F, F.toLocal(feature.lngLat), {});
  const at = `${feature.lngLat[0].toFixed(6)},${feature.lngLat[1].toFixed(6)}`;

  return (
    <main id="main" tabIndex={-1} className="map-page ins-pg">
      <nav className="map-page__panel ins-pg__nav" aria-label={COPY.featuresLabel}>
        <div className="map-page__scroll stack" style={{ "--stack": "14px" }}>
          <p className="t-eyebrow">Today · {EXISTING_FEATURES.length} features</p>
          <ul className="rows">
            {EXISTING_FEATURES.map((f) => (
              <li key={f.id}>
                <NavLink className="rowbtn" to={`${PROJECT_BASE}/inspect/${f.id}${qs}`} aria-current={f.id === fid ? "true" : undefined}>
                  <FeatureId id={f.id} tone={f.id === fid ? "accent" : undefined} />
                  <span className="rowbtn__main"><span className="rowbtn__title">{f.name}</span><span className="rowbtn__sub">{describeWhere(f)}</span></span>
                </NavLink>
              </li>
            ))}
          </ul>
          <p className="t-caption t-muted ins-pg__hint"><kbd>[</kbd> <kbd>]</kbd> step through features</p>
        </div>
      </nav>

      <div className="map-page__map">
        <MapView
          mode={mode}
          onModeChange={setMode}
          initialCamera={camera || CAMERA.home}
          camera={camera}
          proposal={option?.geojson || null}
          showProposal={!!option}
          focus={focus}
          markers={markers}
          onMarkerClick={(m) => m.kind === "feature" && navigate(`${PROJECT_BASE}/inspect/${m.fid}${qs}`)}
          legend={<Legend items={LEGEND || LEGEND_PROPOSAL} />}
          hud={false}
        />
      </div>

      <article className="ins-pg__panel panel-float" aria-labelledby="ins-name">
        <div className="ins-pg__scroll">
          <header className="stack" style={{ "--stack": "8px" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="row" style={{ gap: 8 }}><FeatureId id={feature.id} /><span className="t-caption t-muted">{KIND_LABEL[feature.kind]}</span></span>
              <Link to={`${PROJECT_BASE}/explore?f=${feature.id}`} className="btn btn--ghost btn--icon btn--sm" aria-label="Close the inspector"><Icon name="close" /></Link>
            </div>
            <h1 id="ins-name" ref={headRef} tabIndex={-1} className="t-h2">{feature.name}</h1>
            <p className="t-compact t-muted">{describeWhere(feature)}</p>
          </header>

          <section className="ins-pg__sec" aria-labelledby="ins-today">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 id="ins-today" className="ins-pg__h">Today</h2>
              <Truth kind="osm">OpenStreetMap · {COPY.agencyShort} where noted</Truth>
            </div>
            <ul className="ins-pg__facts">
              {feature.facts.map((t) => <li key={t}>{t}</li>)}
            </ul>
            {feature.osm && (
              <p className="t-caption t-muted ins-pg__osm">
                <a className="link" href={`https://www.openstreetmap.org/${feature.osm}`} target="_blank" rel="noreferrer">OpenStreetMap {feature.osm}<Icon name="external" /><span className="sr-only">(opens in a new tab)</span></a>
              </p>
            )}
          </section>

          <section className="ins-pg__sec" aria-labelledby="ins-options">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 id="ins-options" className="ins-pg__h">What each {COPY.alt.toLowerCase()} changes here</h2>
            </div>
            <div className="seg ins-pg__seg" role="radiogroup" aria-label="Drawn on the map">
              {[{ id: "today", label: "Today" }, ...OPTIONS.map((o) => ({ id: o.id, label: o.id }))].map((o) => (
                <button key={o.id} type="button" role="radio" aria-checked={(option?.id ?? "today") === o.id} className="seg__btn" onClick={() => setOptParam(o.id)}>
                  {o.id === "today" ? o.label : optTag(o.label)}
                </button>
              ))}
            </div>
            <ul className="ins-pg__opts">
              {perOption.map(({ o, items }) => (
                <li key={o.id} className="ins-pg__opt" data-on={option?.id === o.id}>
                  <button type="button" className="ins-pg__opt-head" onClick={() => setOptParam(o.id)} aria-pressed={option?.id === o.id} aria-label={`Show ${optName(o.id)} on the map`}>
                    <span className="alt-pg__letter">{o.id}</span>
                    <span className="ins-pg__opt-name">{o.name}</span>
                    <Icon name="eye" />
                  </button>
                  {items.length ? (
                    <ul className="ins-pg__chg">
                      {items.map((g) => (
                        <li key={g.label}><span>{g.label}{g.count > 1 && <span className="t-muted t-num"> ×{g.count}</span>}</span>{g.ids.length > 0 && <span className="t-mono t-muted">{g.ids.slice(0, 3).join(" ")}</span>}</li>
                      ))}
                    </ul>
                  ) : <p className="ins-pg__none">No change within {RADIUS} m</p>}
                </li>
              ))}
            </ul>
            <Truth kind="illustrative">Concept drawing · within {RADIUS} m of {feature.id}</Truth>
          </section>

          <section className="ins-pg__sec" aria-labelledby="ins-voices">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 id="ins-voices" className="ins-pg__h">Said nearby</h2>
              <span className="badge badge--voice t-num">{nearby.length}</span>
            </div>
            {nearby.length ? (
              <ul className="ins-pg__comments">
                {nearby.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <p>“{c.text}”</p>
                    <span className="t-caption t-muted">{c.author} · {THEME_BY_ID[c.theme]?.name}{c.option ? ` · ${optTag(c.option)}` : ""}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="t-compact t-muted">No comments within {RADIUS} m yet. Yours could be the first.</p>}
            {nearby.length > 0 && <Truth kind="sample" />}
          </section>
        </div>

        <footer className="ins-pg__foot">
          <Link to={`${PROJECT_BASE}/feedback?at=${at}`} className="btn btn--accent btn--block"><Icon name="comment" />Comment on this spot</Link>
          <p className="t-caption t-muted ins-pg__at">Pinned at {feature.id} · <span className="t-mono">{formatCoord(feature.lngLat)}</span></p>
          <div className="ins-pg__step">
            <Link to={`${PROJECT_BASE}/inspect/${prev.id}${qs}`} className="btn btn--ghost btn--sm" rel="prev"><Icon name="arrowLeft" /><span className="sr-only">Previous: </span>{prev.id}</Link>
            <span className="t-caption t-muted t-num">{index + 1} of {EXISTING_FEATURES.length}</span>
            <Link to={`${PROJECT_BASE}/inspect/${next.id}${qs}`} className="btn btn--ghost btn--sm" rel="next"><span className="sr-only">Next: </span>{next.id}<Icon name="arrowRight" /></Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
