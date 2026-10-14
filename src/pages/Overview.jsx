import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { Legend, LEGEND_PROPOSAL, StatusBadge, Truth, fmtDate } from "../components/ui.jsx";
import {
  CAMERA, COPY, DECISION, LEGEND, EXISTING_FEATURES, F, OPTIONS, OPTION_BY_ID, PLACE, PROJECT, STORY, SURVEY, THEMES, THEME_BY_ID, TIMELINE, SAMPLE_COMMENTS,
  TOTAL_COMMENTS, cap, optName,
} from "../data/featured.js";
import { centroid, point } from "../lib/geo.js";
import { useMapMode, useParam } from "../lib/useMapMode.js";
import { useStore } from "../lib/store.js";
import { prefersReducedMotion } from "../lib/motion.js";
import { SiteFooter } from "./DiscoveryKit.jsx";
import { fitCamera } from "./outcomes-shared.js";
import "./discovery.css";

// Each listed change in the chosen option, tied to the map features it describes (by kind; COPY.changeRules).
function derive() {
  const CHOSEN = OPTION_BY_ID[DECISION.chosen];
  const CHANGES = CHOSEN.changes.map((text) => {
    const [, icon, kinds] = COPY.changeRules.find(([re]) => re.test(text)) || [null, "layers", []];
    const feats = CHOSEN.geojson.features.filter((f) => kinds.includes(f.properties.kind));
    return { text, icon, feats, ids: feats.map((f) => f.properties.id).filter(Boolean) };
  });
  return {
    CHOSEN, CHANGES,
    PROBLEM: STORY.find((s) => s.id === "problem"),
    NOW: TIMELINE.find((t) => t.status === "current"),
    STEP_LINKS: COPY.stepLinks,
    MAX_THEME: Math.max(...THEMES.map((t) => t.count)),
  };
}
const THEME_STATUS = { addressed: ["positive", "Addressed in the decision"], partly: ["warning", "Partly addressed"], open: ["neutral", "Still open"] };

export default function Overview() {
  const { CHOSEN, CHANGES, PROBLEM, NOW, STEP_LINKS, MAX_THEME } = useMemo(derive, []);
  const [mode, setMode] = useMapMode();
  const [tourParam, setTourParam] = useParam("tour");
  const tour = tourParam != null && STORY[Number(tourParam) - 1] ? Number(tourParam) - 1 : null;
  const step = tour != null ? STORY[tour] : null;
  const mine = useStore((s) => s.mine);
  const [commentId, setCommentId] = useState(null);
  const [focusIds, setFocusIds] = useState(null);
  const [camera, setCamera] = useState(null);
  const stageRef = useRef(null);
  const stepTitleRef = useRef(null);

  // ——— Tour: each step sets camera, layers and focus ———
  useEffect(() => {
    if (!step) return;
    setCamera({ ...step.camera });
    setCommentId(null);
    setFocusIds(null);
  }, [step]);

  const optionId = step ? step.option || DECISION.chosen : DECISION.chosen;
  const option = OPTION_BY_ID[optionId];
  const showProposal = step ? !!step.show.proposal : true;
  const showComments = step ? !!step.show.comments : true;
  const showFeatures = !!step?.show.existing;

  const focusFeature = useMemo(() => {
    if (step?.focus) {
      const f = EXISTING_FEATURES.find((x) => x.id === step.focus);
      return f ? point(F, F.toLocal(f.lngLat), {}) : null;
    }
    if (focusIds) return focusIds;
    return null;
  }, [step, focusIds]);

  const comments = useMemo(() => [...SAMPLE_COMMENTS, ...mine.filter((c) => c.lngLat)], [mine]);
  const selectedComment = comments.find((c) => c.id === commentId) || null;

  const markers = useMemo(() => {
    const list = [];
    if (showFeatures) {
      EXISTING_FEATURES.forEach((f) => list.push({
        id: f.id, kind: "feature", fid: f.id, label: f.name, lngLat: f.lngLat, featureKind: f.kind,
        selected: step?.focus === f.id, dim: !!step?.focus && step.focus !== f.id, showLabel: step?.focus === f.id,
      }));
    }
    if (showComments) {
      comments.forEach((c) => list.push({
        id: c.id, kind: "comment", lngLat: c.lngLat, label: c.text, mine: !!c.mine, selected: c.id === commentId,
        ariaLabel: `${c.mine ? "Your comment" : "Resident comment"}: ${c.text}`,
      }));
    }
    return list;
  }, [showFeatures, showComments, comments, commentId, step]);

  const goTo = (i) => {
    setTourParam(i == null ? null : String(i + 1));
    if (i != null) requestAnimationFrame(() => stepTitleRef.current?.focus({ preventScroll: true }));
  };
  const endTour = () => { setTourParam(null); setCamera({ ...CAMERA.home }); };

  const onMarkerClick = (m) => {
    if (m.kind === "cluster") { setCamera({ center: m.lngLat, zoom: 20, bearing: 0, pitch: 0 }); return; }
    if (m.kind === "comment") setCommentId(commentId === m.id ? null : m.id);
  };

  const showChange = (c) => {
    if (step) setTourParam(null);
    setFocusIds(c.feats);
    setCamera(fitCamera(c.feats.map(centroid), { px: 520, min: 16.8, max: 19, fallback: CAMERA.home }));
    stageRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
  };

  const onTourKey = (e) => {
    if (tour == null || e.target.closest("input,textarea")) return;
    if (e.key === "ArrowRight" && tour < STORY.length - 1) { e.preventDefault(); goTo(tour + 1); }
    if (e.key === "ArrowLeft" && tour > 0) { e.preventDefault(); goTo(tour - 1); }
    if (e.key === "Escape") { e.preventDefault(); endTour(); }
  };

  const decided = fmtDate(DECISION.date, { month: "short", year: "numeric" });
  const showingLabel = showProposal ? `${optName(option.id)}${option.id === DECISION.chosen ? " · refined" : ""}` : "Today";

  return (
    <>
      <main id="main" tabIndex={-1} className="ov">
        {/* ——— Hero ——— */}
        <section className="wrap ov-hero" aria-labelledby="ov-title">
          <div className="ov-hero__copy">
            <div className="ov-hero__badges">
              <StatusBadge tone={PROJECT.statusTone}>{PROJECT.status}</StatusBadge>
              <span className="badge badge--outline badge--plain">{PROJECT.round}</span>
            </div>
            <h1 id="ov-title" className="t-display ov-hero__title">{PROJECT.title}</h1>
            <p className="ov-hero__place">
              <Icon name="pin" />
              <span>{PLACE.name} · {PLACE.neighborhood}, {PLACE.city}</span>
            </p>
            <p className="ov-hero__lead">
              {PROBLEM.body} {PROJECT.summary} You can also replay {COPY.round} and try commenting as if it were {SURVEY.window}.
            </p>
            <div className="ov-hero__ctas">
              <Link to="explore" className="btn btn--accent btn--lg">Explore today<Icon name="arrowRight" /></Link>
              <Link to="compare" className="btn btn--secondary btn--lg"><Icon name="swap" />Compare {COPY.alts}</Link>
              <Link to="feedback" className="btn btn--secondary btn--lg"><Icon name="comment" />Replay {COPY.round}</Link>
            </div>
            <ul className="ov-hero__access">
              <li><Link to="text"><Icon name="text" />Text-only version</Link></li>
              <li><Truth kind="source">Real project · facts cited from {PROJECT.agency}</Truth></li>
              <li><a href={PROJECT.url} target="_blank" rel="noreferrer">{PROJECT.agency} project page<Icon name="external" /><span className="sr-only">(opens in a new tab)</span></a></li>
            </ul>
          </div>

          <aside className="ov-facts" aria-labelledby="ov-facts-title">
            <h2 id="ov-facts-title" className="ov-facts__title">At a glance</h2>
            <dl className="ov-facts__list">
              <div><dt>Where</dt><dd>{PLACE.name}<span className="t-caption t-muted">{PLACE.neighborhood}</span></dd></div>
              <div><dt>Led by</dt><dd>{PROJECT.team}</dd></div>
              <div><dt>Stage</dt><dd>{PROJECT.status}<span className="t-caption t-muted">This page: {PROJECT.round.toLowerCase()}</span></dd></div>
              <div><dt>Budget</dt><dd>{PROJECT.budget}</dd></div>
              <div><dt>{cap(COPY.round)}</dt><dd><span><span className="t-num">{SURVEY.total.toLocaleString("en-US")}</span> people rated {OPTIONS.length} {COPY.alts}</span></dd></div>
            </dl>
            <Link to="decision" className="ov-facts__link"><span><strong>Decision · {decided}</strong><span className="t-caption t-muted">A refined {optName(DECISION.chosen)}</span></span><Icon name="chevronRight" /></Link>
          </aside>
        </section>

        {/* ——— Map + guided tour ——— */}
        <section className="wrap ov-stage-wrap" aria-labelledby="ov-tour-title">
          <div className="ov-stage" ref={stageRef}>
            <div className="ov-stage__map">
              <MapView
                mode={mode}
                onModeChange={setMode}
                initialCamera={CAMERA.home}
                camera={camera}
                proposal={option.geojson}
                showProposal={showProposal}
                focus={focusFeature}
                markers={markers}
                onMarkerClick={onMarkerClick}
                onSelectProposal={(id) => { const c = CHANGES.find((x) => x.ids.includes(id)); if (c) setFocusIds(c.feats); }}
                hud={false}
                onReady={(map) => {
                  // Keep camera targets clear of the tour card on wide screens.
                  const pad = () => map.setPadding({ left: window.innerWidth >= 768 ? 340 : 0, top: 0, right: 0, bottom: 0 });
                  pad();
                  window.addEventListener("resize", pad);
                  map.once("remove", () => window.removeEventListener("resize", pad));
                }}
                legend={<Legend items={LEGEND || LEGEND_PROPOSAL} />}
                streetTarget={step?.camera.center}
                streetContext={COPY.streetContext}
              >
                <div className="ov-showing glass" aria-live="polite">
                  <span className={`ov-showing__dot ${showProposal ? "is-on" : ""}`} aria-hidden="true" />
                  Showing <strong>{showingLabel}</strong>
                  <span className="ov-showing__sep" aria-hidden="true" />
                  <Truth kind={showProposal ? "illustrative" : "osm"}>{showProposal ? "Concept drawing" : "OpenStreetMap"}</Truth>
                </div>
                {selectedComment && (
                  <div className="ov-comment panel-float" role="dialog" aria-label="Comment">
                    <div className="ov-comment__top">
                      <span className={`badge ${selectedComment.mine ? "badge--accent" : "badge--voice"}`}>{THEME_BY_ID[selectedComment.theme]?.name || "Comment"}</span>
                      <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => setCommentId(null)} aria-label="Close comment"><Icon name="close" /></button>
                    </div>
                    <p className="ov-comment__text">“{selectedComment.text}”</p>
                    <p className="t-caption t-muted">{selectedComment.author} · {fmtDate(selectedComment.date)}</p>
                    <Truth kind={selectedComment.mine ? "yours" : "sample"} />
                  </div>
                )}
              </MapView>
            </div>

            <div className={`ov-tour ${step ? "is-active" : ""}`} role="region" aria-labelledby="ov-tour-title" onKeyDown={onTourKey}>
              {!step ? (
                <div className="ov-tour__intro">
                  <p className="t-eyebrow ov-tour__eyebrow"><Icon name="compass" />Guided tour · {STORY.length} stops</p>
                  <h2 id="ov-tour-title" className="t-h3">Walk through the project</h2>
                  <p className="t-compact t-muted">{COPY.tourIntro}</p>
                  <ol className="ov-tour__preview">
                    {STORY.map((s, i) => <li key={s.id}><span className="t-num">{i + 1}</span>{s.title}</li>)}
                  </ol>
                  <button type="button" className="btn btn--accent btn--block" onClick={() => goTo(0)}><Icon name="arrowRight" />Start the tour</button>
                </div>
              ) : (
                <>
                  <div className="ov-tour__head">
                    <h2 id="ov-tour-title" className="ov-tour__label">Guided tour</h2>
                    <span className="t-caption t-muted t-num" aria-hidden="true">{tour + 1} / {STORY.length}</span>
                    <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={endTour} aria-label="End the tour"><Icon name="close" /></button>
                  </div>
                  <ol className="ov-tour__dots" aria-label="Tour steps">
                    {STORY.map((s, i) => (
                      <li key={s.id}>
                        <button type="button" className="ov-tour__dot" data-on={i <= tour} aria-current={i === tour ? "step" : undefined} onClick={() => goTo(i)} aria-label={`Step ${i + 1}: ${s.title}`} />
                      </li>
                    ))}
                  </ol>
                  <div className="ov-tour__body" aria-live="polite">
                    <p className="t-eyebrow">Step {tour + 1} of {STORY.length}</p>
                    <h3 className="t-h3" tabIndex={-1} ref={stepTitleRef}>{step.title}</h3>
                    <p className="t-compact">{step.body}</p>
                    {STEP_LINKS[step.id] && <Link to={STEP_LINKS[step.id][0]} className="link">{STEP_LINKS[step.id][1]}<Icon name="arrowRight" /></Link>}
                  </div>
                  <div className="ov-tour__foot">
                    <button type="button" className="btn btn--secondary" onClick={() => goTo(tour - 1)} disabled={tour === 0}><Icon name="arrowLeft" />Back</button>
                    {tour < STORY.length - 1
                      ? <button type="button" className="btn btn--primary" onClick={() => goTo(tour + 1)}>Next<Icon name="arrowRight" /></button>
                      : <Link to="feedback" className="btn btn--accent">Leave a comment<Icon name="arrowRight" /></Link>}
                  </div>
                  <p className="ov-tour__keys t-caption t-muted">Use ← and → to move, Esc to leave.</p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ——— Proposal + feedback ——— */}
        <section className="wrap ov-cols" aria-label="Proposal and community feedback">
          <div className="ov-block">
            <div className="ov-block__head">
              <p className="t-eyebrow">What {PROJECT.agency} chose · {decided}</p>
              <h2 className="t-h2">{optName(CHOSEN.id)} · {CHOSEN.name}</h2>
              <p className="t-compact t-muted">{CHOSEN.summary}</p>
            </div>
            <ul className="ov-changes">
              {CHANGES.map((c) => (
                <li key={c.text}>
                  <span className="ov-changes__icon"><Icon name={c.icon} /></span>
                  <span className="ov-changes__text">{c.text}</span>
                  {c.feats.length > 0 && <button type="button" className="btn btn--ghost btn--sm" onClick={() => showChange(c)} aria-label={`Show on map: ${c.text}`}><Icon name="pin" />Show</button>}
                </li>
              ))}
            </ul>
            <div className="ov-block__foot">
              <Truth kind="illustrative" />
              <Link to="alternatives" className="link">See the other {COPY.alts}<Icon name="arrowRight" /></Link>
            </div>
          </div>

          <div className="ov-block">
            <div className="ov-block__head">
              <p className="t-eyebrow">What people raised in {COPY.raisedYear}</p>
              <h2 className="t-h2">{THEMES.length} themes, each with {PROJECT.agency}'s answer</h2>
              <p className="t-compact t-muted">{COPY.themesSource} Bars count the <span className="t-num">{TOTAL_COMMENTS}</span> sample comments in this demo, not real ones.</p>
            </div>
            <ul className="ov-themes">
              {[...THEMES].sort((a, b) => b.count - a.count).map((t) => (
                <li key={t.id}>
                  <div className="ov-themes__row">
                    <span className="ov-themes__name">{t.name}</span>
                    <span className="ov-themes__count t-num">{t.count}</span>
                  </div>
                  <div className="ov-themes__bar" aria-hidden="true"><span style={{ width: `${(t.count / MAX_THEME) * 100}%` }} /></div>
                  <div className="ov-themes__row">
                    <span className="t-caption t-muted">{t.response}</span>
                    <StatusBadge tone={THEME_STATUS[t.status][0]}>{THEME_STATUS[t.status][1]}</StatusBadge>
                  </div>
                </li>
              ))}
            </ul>
            <div className="ov-block__foot">
              <Truth kind="sample">Bars are sample counts · responses from {PROJECT.agency}</Truth>
              <Link to="perspectives" className="link">Community perspectives<Icon name="arrowRight" /></Link>
            </div>
          </div>
        </section>

        {/* ——— Timeline + next steps ——— */}
        <section className="wrap ov-when" aria-labelledby="ov-when-title">
          <div className="ov-when__head">
            <p className="t-eyebrow">Project timeline</p>
            <h2 id="ov-when-title" className="t-h2">Where things stand</h2>
          </div>
          <ol className="ov-tl">
            {TIMELINE.map((t) => (
              <li key={t.date} className="ov-tl__item" data-status={t.status} aria-current={t.status === "current" ? "step" : undefined}>
                <span className="ov-tl__dot" aria-hidden="true" />
                <span className="ov-tl__date t-num">{fmtDate(t.date, { month: "short", year: "numeric" })}</span>
                <span className="ov-tl__title">{t.title}{t.status === "current" && <span className="badge badge--accent">Now</span>}</span>
                <span className="t-caption t-muted">{t.body}</span>
              </li>
            ))}
          </ol>

          <div className="ov-next">
            <div className="ov-next__copy">
              <p className="t-eyebrow">Next steps</p>
              <h3 className="t-h2">{NOW ? `${NOW.title}: ${fmtDate(NOW.date, { month: "long", year: "numeric" })}` : "The project is complete."}</h3>
              <p className="t-compact t-muted">
                {NOW?.body} {COPY.builtNote} This page replays {COPY.round}: try commenting as if it were {SURVEY.window}. This demo has no server; your comment stays in this browser.
              </p>
              <ul className="ov-next__open">
                {DECISION.unresolved.map((u) => <li key={u}><Icon name="clock" />Left open in the decision: {u.charAt(0).toLowerCase() + u.slice(1)}</li>)}
              </ul>
            </div>
            <div className="ov-next__actions">
              <Link to="feedback" className="btn btn--accent btn--lg btn--block"><Icon name="comment" />Try the {COPY.round} feedback flow</Link>
              <Link to="revision" className="btn btn--secondary btn--lg btn--block"><Icon name="history" />How {optName(DECISION.chosen)} was refined</Link>
              <Link to="updates" className="btn btn--ghost btn--block"><Icon name="bell" />Follow updates</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
