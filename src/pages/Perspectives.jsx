import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { FeatureId, Truth, fmtDate } from "../components/ui.jsx";
import { CAMERA, COPY, DECISION, F, OPTIONS, OPTION_BY_ID, PROJECT, PROJECT_BASE, SAMPLE_COMMENTS, SOURCES, SURVEY, THEMES, THEME_BY_ID, cap, optName, optTag } from "../data/featured.js";
import { distanceMeters } from "../lib/geo.js";
import { useMapMode, useParam } from "../lib/useMapMode.js";
import { useIsMobile, prefersReducedMotion } from "../lib/motion.js";
import { useStore } from "../lib/store.js";
import { themeIcon, themeShort, themeName, nearestFeature, optionLabel, sentimentLabel } from "./participate-shared.jsx";
import "./participate.css";

const optionFilters = () => [
  { id: "all", label: "All" }, ...OPTIONS.map((o) => ({ id: o.id, label: o.id, option: true })), { id: "general", label: "General" },
];
const SENTIMENT_FILTERS = [
  { id: "all", label: "All" }, { id: "concern", label: "Concerns" }, { id: "support", label: "Support" }, { id: "idea", label: "Ideas" },
];
const RESPONSE_STATUS = { addressed: ["positive", "Addressed"], partly: ["warning", "Partly addressed"], open: ["", "Still open"] };
const RELATED_RADIUS = 15;

// Rough metres per screen pixel at a zoom level, at this latitude.
const metresPerPx = (zoom) => 54862 / 2 ** zoom;

// R09 · Comment map — community perspectives.
export default function Perspectives() {
  const [mode, setMode] = useMapMode();
  const [theme, setTheme] = useParam("theme");
  const [opt, setOpt] = useParam("opt", "all");
  const [sent, setSent] = useParam("sent", "all");
  const [sel, setSel] = useParam("c");
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const mapRef = useRef(null);
  const [clusterTarget, setClusterTarget] = useState(null);
  const zoomRef = useRef(CAMERA.home.zoom);

  const mine = useStore((s) => s.mine);
  const triage = useStore((s) => s.triage);

  const all = useMemo(() => [
    ...mine.filter((c) => c.public && triage[c.id]?.status !== "hidden").map((c) => ({ ...c, theme: triage[c.id]?.theme || c.theme, mine: true })),
    ...SAMPLE_COMMENTS,
  ], [mine, triage]);

  // Alternative and sentiment filters hide; the theme filter highlights ("connected feedback").
  const visible = useMemo(() => all.filter((c) => {
    if (opt !== "all" && (opt === "general" ? c.option && c.option !== "general" && c.option !== "today" : c.option !== opt)) return false;
    if (sent !== "all" && (c.sentiment || "concern") !== sent) return false;
    return true;
  }), [all, opt, sent]);

  const counts = useMemo(() => Object.fromEntries(THEMES.map((t) => [t.id, visible.filter((c) => c.theme === t.id).length])), [visible]);
  const activeTheme = theme ? THEME_BY_ID[theme] : null;
  const ordered = useMemo(() => (activeTheme ? [...visible.filter((c) => c.theme === theme), ...visible.filter((c) => c.theme !== theme)] : visible), [visible, activeTheme, theme]);
  const selected = visible.find((c) => c.id === sel) || null;

  const related = useMemo(() => {
    if (!selected) return [];
    return visible
      .filter((c) => c.id !== selected.id)
      .map((c) => ({ c, d: distanceMeters(selected.lngLat, c.lngLat) }))
      .filter((r) => r.d <= RELATED_RADIUS)
      .sort((a, b) => a.d - b.d);
  }, [selected, visible]);

  const markers = useMemo(() => visible.map((c) => ({
    id: c.id, kind: "comment", lngLat: c.lngLat, label: c.text, mine: !!c.mine,
    selected: c.id === sel,
    dim: (!!theme && c.theme !== theme) || (!!sel && c.id !== sel && !(theme && c.theme === theme)),
    ariaLabel: `${c.mine ? "Your comment" : "Comment"} about ${themeName(c.theme)}: ${c.text}`,
  })), [visible, sel, theme]);

  // Center the selected comment in the part of the map the panel doesn't cover.
  const selCamera = useMemo(() => {
    if (!selected) return null;
    const zoom = Math.max(zoomRef.current, 19.4);
    const [x, y] = F.toLocal(selected.lngLat);
    const shift = metresPerPx(zoom);
    // Wide maps: the panel sits on the right, so push the pin left. Narrow maps: the panel is a bottom sheet, so push it up.
    const narrow = isMobile || window.innerWidth < 1160;
    const center = narrow ? F.toLngLat([x, y - Math.round(window.innerHeight * 0.2) * shift]) : F.toLngLat([x + 210 * shift, y]);
    return { center, zoom, bearing: 0, pitch: 0, at: performance.now() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, isMobile]);

  const select = (id, fromList = false) => {
    setClusterTarget(null);
    setSel(id === sel && fromList !== "step" ? null : id);
    if (fromList && isMobile) mapRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  const onMarkerClick = (m) => {
    if (m.kind === "cluster") {
      // Already as close as the map goes: open the first comment; the rest are listed as nearby.
      if (zoomRef.current >= 20.5) { select(m.members[0].id); return; }
      const xs = m.members.map((p) => F.toLocal(p.lngLat));
      const span = Math.max(4, ...xs.map((a) => Math.max(...xs.map((b) => Math.hypot(a[0] - b[0], a[1] - b[1])))));
      const zoom = Math.min(21, Math.max(zoomRef.current + 1.2, Math.log2((54862 * 220) / span)));
      // A fresh object identity makes MapView fly there.
      setClusterTarget({ center: m.lngLat, zoom, bearing: 0, pitch: 0, at: performance.now() });
      return;
    }
    select(m.id);
  };
  const mapCamera = clusterTarget && clusterTarget.at > (selCamera?.at || 0) ? clusterTarget : selCamera;

  const group = selected ? [selected, ...related.map((r) => r.c)] : [];
  const near = selected ? nearestFeature(selected.lngLat) : null;
  const totalSample = SAMPLE_COMMENTS.length;
  const yours = all.length - totalSample;

  return (
    <main id="main" tabIndex={-1} className="map-page pt-persp">
      <section className="map-page__panel" aria-labelledby="persp-title">
        <div className="map-page__scroll stack" style={{ "--stack": "22px" }}>
          <div className="stack" style={{ "--stack": "8px" }}>
            <p className="t-eyebrow">{cap(COPY.round)} replay · {SURVEY.window}</p>
            <h1 id="persp-title" className="t-h2">Community perspectives</h1>
            <p className="t-compact t-muted">How place-based comments on {COPY.placeShort} could look, using sample comments. Comments aren't votes, so nothing here is ranked or liked.</p>
            <Truth kind="sample" />
          </div>

          <fieldset className="pt-filter">
            <legend className="pt-filter__label">Topic</legend>
            <div className="pt-chips">
              {THEMES.map((t) => (
                <button key={t.id} type="button" className="chip pt-chip" aria-pressed={theme === t.id} onClick={() => { setTheme(theme === t.id ? null : t.id); }}>
                  {theme === t.id && <Icon name="check" />}{themeShort(t.id)}<span className="count">{counts[t.id]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {activeTheme && (
            <div className="pt-connected" aria-live="polite">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <span className="t-eyebrow">Connected feedback</span>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setTheme(null)}>Clear</button>
              </div>
              <p className="t-compact"><strong>{counts[activeTheme.id]} sample comments</strong> on this map are about “{activeTheme.name.toLowerCase()}”. They're highlighted; the rest are dimmed.</p>
              <ThemeResponse t={activeTheme} />
            </div>
          )}

          <div className="pt-filter">
            <p className="pt-filter__label" id="opt-label">About</p>
            <div className="seg pt-seg" role="radiogroup" aria-labelledby="opt-label">
              {optionFilters().map((o) => (
                <button key={o.id} type="button" role="radio" aria-checked={opt === o.id} className="seg__btn" onClick={() => setOpt(o.id)}>{o.option ? <><span className="sr-only">{COPY.alt} </span>{o.label}</> : o.label}</button>
              ))}
            </div>
          </div>

          <div className="pt-filter">
            <p className="pt-filter__label" id="sent-label">Kind of comment</p>
            <div className="seg pt-seg" role="radiogroup" aria-labelledby="sent-label">
              {SENTIMENT_FILTERS.map((o) => (
                <button key={o.id} type="button" role="radio" aria-checked={sent === o.id} className="seg__btn" onClick={() => setSent(o.id)}>{o.label}</button>
              ))}
            </div>
          </div>

          <section aria-labelledby="persp-list" className="stack" style={{ "--stack": "6px" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 id="persp-list" className="pt-filter__label">All visible comments</h2>
              <span className="t-caption t-muted t-num" aria-live="polite">{visible.length} shown</span>
            </div>
            {visible.length === 0 ? (
              <div className="pt-none">
                <p className="t-compact t-muted">No comments match these filters.</p>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => { setOpt("all"); setSent("all"); }}>Show all comments</button>
              </div>
            ) : (
              <ul className="rows pt-list">
                {ordered.map((c) => {
                  const off = !!theme && c.theme !== theme;
                  return (
                    <li key={c.id} data-dim={off || undefined}>
                      <button type="button" className="rowbtn pt-row" aria-pressed={sel === c.id} onClick={() => select(c.id, true)}>
                        <span className={`pt-dot ${c.mine ? "pt-dot--mine" : ""}`} aria-hidden="true" />
                        <span className="rowbtn__main">
                          <span className="pt-row__text">{c.text}</span>
                          <span className="rowbtn__sub">{c.mine ? "Yours · " : ""}{themeName(c.theme)} · {fmtDate(c.date, { month: "short", day: "numeric" })}{c.option ? ` · ${optTag(c.option)}` : ""}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <p className="pt-privacy t-caption t-muted"><Icon name="shield" />Pins show the spot a comment is about, never where someone lives. Names are first names or “Resident”.</p>
        </div>
        <div className="map-page__foot">
          <span className="t-caption t-muted">{yours > 0 ? `${yours} of yours · ` : ""}{totalSample} sample comments</span>
          <span className="spacer" />
          <button type="button" className="btn btn--accent" onClick={() => navigate(selected ? `${PROJECT_BASE}/feedback?at=${selected.lngLat.map((v) => v.toFixed(6)).join(",")}` : `${PROJECT_BASE}/feedback`)}>
            <Icon name="plus" />Add yours
          </button>
        </div>
      </section>

      <div className="map-page__map" ref={mapRef}>
        <MapView
          mode={mode}
          onModeChange={setMode}
          initialCamera={CAMERA.home}
          camera={mapCamera}
          proposal={OPTION_BY_ID[opt]?.geojson || null}
          showProposal={!!OPTION_BY_ID[opt]}
          markers={markers}
          onMarkerClick={onMarkerClick}
          onCameraChange={(c) => { zoomRef.current = c.zoom; }}
          legend={<CommentLegend />}
        >
          <div className="map-chip glass" aria-live="polite">
            <Icon name="comment" /><strong className="t-num">{visible.length}</strong> comments
            {activeTheme && <> · <span className="pt-chip-theme">{themeShort(activeTheme.id)}</span></>}
            {OPTION_BY_ID[opt] && <> · {optTag(opt)}</>}
          </div>
          {selected && (
            <CommentPanel
              key={selected.id}
              c={selected}
              near={near}
              related={related}
              group={group}
              onSelect={(id) => select(id, "step")}
              onClose={() => { setSel(null); setClusterTarget(null); }}
            />
          )}
        </MapView>
      </div>
    </main>
  );
}

function ThemeResponse({ t, compact = false }) {
  const [tone, label] = RESPONSE_STATUS[t.status] || RESPONSE_STATUS.open;
  return (
    <div className={`pt-response ${compact ? "pt-response--compact" : ""}`}>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        <Icon name="check" className="pt-response__icon" />
        <span className="pt-response__title">{PROJECT.agency}'s response</span>
        <span className={`badge ${tone ? `badge--${tone}` : ""}`}>{label}</span>
      </div>
      <p className="t-compact">{t.response}</p>
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <Link className="link t-caption" to={`${PROJECT_BASE}/revision`}>How {optName(DECISION.chosen)} was refined<Icon name="arrowRight" /></Link>
        <Truth kind="source">Source: <a className="link" href={SOURCES.decision.url} target="_blank" rel="noreferrer">{PROJECT.agency} {COPY.decisionDoc}<span className="sr-only"> (opens in a new tab)</span></a></Truth>
      </div>
    </div>
  );
}

function CommentPanel({ c, near, related, group, onSelect, onClose }) {
  const idx = group.findIndex((g) => g.id === c.id);
  const t = THEME_BY_ID[c.theme];
  return (
    <aside className="float-panel float-panel--right panel-float pt-panel" aria-labelledby="pt-panel-title" aria-live="polite">
      <div className="row pt-panel__top">
        {near && <FeatureId id={near.feature.id} tone="line" />}
        <span className="t-caption t-muted pt-panel__where">{near ? near.feature.name : "Comment"} · {related.length + 1} here</span>
        <span className="spacer" />
        <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Close comment" onClick={onClose}><Icon name="close" /></button>
      </div>

      <div className="pt-badges">
        <span className="badge badge--voice">{t && <Icon name={themeIcon(t.id)} />}{themeName(c.theme)}</span>
        <span className="badge badge--outline badge--plain">{optionLabel(c.option).split(" · ")[0]}</span>
        <span className="badge badge--outline badge--plain">{sentimentLabel(c.sentiment)}</span>
      </div>

      <blockquote className="pt-quote" id="pt-panel-title">“{c.text}”</blockquote>

      <div className="pt-author">
        <span className="pt-avatar" aria-hidden="true"><Icon name="users" /></span>
        <span className="pt-author__who">
          <span className="t-compact" style={{ fontWeight: 500 }}>{c.mine ? `${c.author} (you)` : c.author}</span>
          <span className="t-caption t-muted"><time dateTime={c.date}>{fmtDate(c.date)}</time></span>
        </span>
        <span className="spacer" />
        {c.mine ? <Truth kind="yours" /> : <Truth kind="sample" />}
      </div>

      {t && <ThemeResponse t={t} compact />}

      {related.length > 0 && (
        <div className="pt-related">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h3 className="pt-filter__label">{related.length} other comment{related.length === 1 ? "" : "s"} within {RELATED_RADIUS} m</h3>
            <div className="row" style={{ gap: 2 }}>
              <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Previous comment nearby" onClick={() => onSelect(group[(idx - 1 + group.length) % group.length].id)}><Icon name="arrowLeft" /></button>
              <span className="t-caption t-muted t-num">{idx + 1}/{group.length}</span>
              <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Next comment nearby" onClick={() => onSelect(group[(idx + 1) % group.length].id)}><Icon name="arrowRight" /></button>
            </div>
          </div>
          <ul className="pt-related__list">
            {related.slice(0, 4).map(({ c: r, d }) => (
              <li key={r.id}>
                <button type="button" className="pt-related__item" onClick={() => onSelect(r.id)}>
                  <span className={`pt-dot ${r.mine ? "pt-dot--mine" : ""}`} aria-hidden="true" />
                  <span className="pt-related__text">{r.text}</span>
                  <span className="t-caption t-muted t-num">{Math.max(1, Math.round(d))} m</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function CommentLegend() {
  return (
    <div className="legend">
      <p className="t-eyebrow">Key</p>
      <ul>
        <li><span className="legend__sw legend__sw--comment" aria-hidden="true" />Resident comment (sample)</li>
        <li><span className="legend__sw legend__sw--comment pt-sw-mine" aria-hidden="true" />Your comment</li>
        <li><span className="pt-sw-cluster" aria-hidden="true">3</span>Several comments · select to zoom</li>
        <li><span className="legend__sw legend__sw--proposed" aria-hidden="true" />{COPY.alt} drawing (when one is chosen)</li>
      </ul>
    </div>
  );
}
