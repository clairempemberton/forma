import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { Truth } from "../components/ui.jsx";
import { F, OPTION_BY_ID, PLACE, REVISION_CHANGES, SAMPLE_COMMENTS, THEMES } from "../data/alder.js";
import { PROJECTS } from "../data/projects.js";
import { prefersReducedMotion } from "../lib/motion.js";
import { ProjectCard, SiteFooter, matchesQuery, useLocateOnce } from "./DiscoveryKit.jsx";
import { queryWords } from "../lib/search.js";
import "./discovery.css";

const HERO_CAMERA = { center: F.toLngLat([2, -4]), zoom: 18.45, bearing: -6, pitch: 54 };
const SAMPLE = SAMPLE_COMMENTS.find((c) => c.id === "c04");
const SHELTER = [-122.6565854, 45.5173274];

const HERO_MARKERS = [
  { id: "h-bike", kind: "feature", featureKind: "bike", label: "Protected bike lane", lngLat: F.toLngLat([30, -4.1]) },
  { id: "h-cross", kind: "feature", featureKind: "crossing", label: "Raised crossing", lngLat: F.toLngLat([0, 8]) },
  { id: "h-bus", kind: "feature", featureKind: "transit", label: "Bus shelter", lngLat: SHELTER },
  { id: "h-c04", kind: "comment", label: SAMPLE.text, lngLat: SAMPLE.lngLat, selected: true },
].map((m) => ({ ...m, ariaLabel: m.kind === "comment" ? "Sample resident comment at the southwest corner. Open the proposal." : `${m.label}, proposed. Open the proposal.` }));

const STEPS = [
  { n: "01", icon: "eye", title: "See it", body: "Every project starts with a map of the place as it is today, then the options laid on top. Switch between them, tilt into 3D, and nothing is hidden in a PDF." },
  { n: "02", icon: "pin", title: "Show what matters", body: "Drop a comment on the corner, crossing or bus stop you mean. No account. You choose whether it's public or only for the project team." },
  { n: "03", icon: "history", title: "Follow what happens", body: "The team groups comments into themes and answers each one. When the design changes, you see what changed, what didn't, and why." },
];

export default function Landing() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [loc, locate] = useLocateOnce();
  const suggestions = useMemo(() => (queryWords(q).some((w) => w.length > 1) ? PROJECTS.filter((p) => matchesQuery(p, q.trim())).slice(0, 3) : []), [q]);

  // The hero map is a picture of the place, not a tool: no scroll-jacking, a slow settle on load.
  const onReady = (map) => {
    ["scrollZoom", "dragPan", "dragRotate", "keyboard", "doubleClickZoom", "touchZoomRotate", "touchPitch", "boxZoom"].forEach((h) => map[h]?.disable?.());
    const zoom = map.getContainer().clientWidth < 560 ? 18.15 : 18.7;
    if (prefersReducedMotion()) map.jumpTo({ bearing: -24, zoom, pitch: 54 });
    else map.easeTo({ bearing: -24, zoom, pitch: 54, duration: 7000, easing: (t) => 1 - (1 - t) ** 3, essential: false });
  };

  const comments = THEMES.reduce((n, t) => n + t.count, 0);
  const changed = REVISION_CHANGES.filter((c) => c.status === "changed").length;
  const notAdopted = REVISION_CHANGES.filter((c) => c.status === "not-changed").length;
  const proof = [
    { value: comments, label: "comments read", icon: "comment" },
    { value: THEMES.length, label: "themes, each answered in public", icon: "layers" },
    { value: changed, label: "changes made in version 2", icon: "edit" },
    { value: notAdopted, label: "request not adopted, with the reason", icon: "scale" },
  ];

  return (
    <>
      <main id="main" tabIndex={-1} className="lnd">
        {/* ——— Hero ——— */}
        <section className="lnd-hero" aria-labelledby="lnd-title">
          <div className="wrap lnd-hero__grid">
            <div className="lnd-hero__copy">
              <p className="t-eyebrow lnd-eyebrow">Portland · Streets, parks and public space</p>
              <h1 id="lnd-title" className="t-display lnd-hero__title">Your neighborhood.<br />Your perspective.</h1>
              <p className="lnd-hero__lead">
                See what could change on the streets you use, compare the options side by side, and leave a comment on the exact corner you mean. Then follow what happened to it.
              </p>
              <div className="lnd-hero__ctas">
                <Link to="/projects" className="btn btn--accent btn--lg">Explore projects<Icon name="arrowRight" /></Link>
                <Link to="/how-it-works" className="btn btn--secondary btn--lg">How it works</Link>
              </div>

              <form
                className="lnd-find"
                role="search"
                aria-labelledby="lnd-find-label"
                onSubmit={(e) => { e.preventDefault(); navigate(q.trim() ? `/projects?q=${encodeURIComponent(q.trim())}` : "/projects"); }}
              >
                <label id="lnd-find-label" htmlFor="lnd-find" className="lnd-find__label">Find projects near you</label>
                <div className="lnd-find__row">
                  <div className="search lnd-find__search">
                    <Icon name="search" />
                    <input
                      id="lnd-find" className="input" type="search" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)}
                      placeholder="Neighborhood or street, e.g. Buckman" aria-describedby="lnd-find-hint"
                    />
                  </div>
                  <button type="button" className="btn btn--secondary lnd-find__loc" onClick={() => locate((near) => navigate(`/projects?near=${near}`))} disabled={loc.status === "busy"} aria-busy={loc.status === "busy"}>
                    <Icon name="locate" />{loc.status === "busy" ? "Locating…" : "Use my location"}
                  </button>
                </div>
                <p id="lnd-find-hint" className="lnd-find__hint">
                  <Icon name="lock" />Location is optional, used once to sort projects, and never stored.
                </p>
                <p className={`lnd-find__status ${loc.status === "error" ? "is-error" : ""}`} role="status" aria-live="polite">{loc.message}</p>
                {suggestions.length > 0 && (
                  <ul className="lnd-suggest" aria-label="Matching projects">
                    {suggestions.map((p) => (
                      <li key={p.id}>
                        <Link to={`/projects/${p.id}`} className="lnd-suggest__item">
                          <span className="lnd-suggest__title">{p.title}</span>
                          <span className="t-caption t-muted">{p.area} · {p.topic}</span>
                          <Icon name="arrowRight" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </form>
            </div>

            <figure className="lnd-hero__visual" aria-label="Live 3D map of SE Alder St and SE 8th Ave with the proposed changes">
              <MapView
                mode="3d"
                modeSwitch={false}
                controls={false}
                hud={false}
                initialCamera={HERO_CAMERA}
                proposal={OPTION_BY_ID.C.geojson}
                showProposal
                markers={HERO_MARKERS}
                clusterKinds={[]}
                onMarkerClick={() => navigate("/projects/alder-8th/explore?show=C")}
                onReady={onReady}
                ariaLabel="3D map of SE Alder St and SE 8th Ave, Portland, showing the fictional Option C proposal"
                className="lnd-map"
              >
                <span className="lnd-hero__truth glass"><Icon name="info" />Illustrative · fictional project on a real corner</span>
                <div className="lnd-quote panel-float">
                  <div className="lnd-quote__head">
                    <span className="lnd-quote__avatar" aria-hidden="true"><Icon name="comment" /></span>
                    <span className="lnd-quote__where">Southwest corner · {PLACE.short}</span>
                  </div>
                  <blockquote className="lnd-quote__text">“{SAMPLE.text}”</blockquote>
                  <div className="lnd-quote__foot">
                    <span className="badge badge--positive">Changed in revision</span>
                    <span className="t-caption t-muted">Sample comment</span>
                  </div>
                </div>
              </MapView>
              <figcaption className="lnd-hero__caption">
                <Icon name="pin" />{PLACE.name} · {PLACE.neighborhood}, {PLACE.city}
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ——— How it works ——— */}
        <section className="lnd-band" aria-labelledby="lnd-steps-title">
          <div className="wrap">
            <div className="lnd-sechead">
              <div className="stack" style={{ "--stack": "10px" }}>
                <p className="t-eyebrow">How it works</p>
                <h2 id="lnd-steps-title" className="t-h1 lnd-h2">Three steps, and you can stop after any of them.</h2>
              </div>
              <Link to="/how-it-works" className="link">What happens to your comment<Icon name="arrowRight" /></Link>
            </div>
            <ol className="lnd-steps">
              {STEPS.map((s) => (
                <li key={s.n} className="lnd-step">
                  <div className="lnd-step__top">
                    <span className="lnd-step__icon"><Icon name={s.icon} /></span>
                    <span className="lnd-step__n t-num" aria-hidden="true">{s.n}</span>
                  </div>
                  <h3 className="t-h3">{s.title}</h3>
                  <p className="t-compact t-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ——— Featured projects ——— */}
        <section className="lnd-section" aria-labelledby="lnd-featured-title">
          <div className="wrap">
            <div className="lnd-sechead">
              <div className="stack" style={{ "--stack": "10px" }}>
                <p className="t-eyebrow">Open now in Portland</p>
                <h2 id="lnd-featured-title" className="t-h1 lnd-h2">Featured projects</h2>
              </div>
              <Link to="/projects" className="btn btn--secondary">See all {PROJECTS.length} projects<Icon name="arrowRight" /></Link>
            </div>
            <ul className="dsc-cards">
              {PROJECTS.slice(0, 3).map((p) => <li key={p.id}><ProjectCard p={p} /></li>)}
            </ul>
            <p className="lnd-note"><Truth kind="illustrative">Real Portland locations; every project, status and date is fictional</Truth></p>
          </div>
        </section>

        {/* ——— Proof of process ——— */}
        <section className="lnd-section lnd-section--tight" aria-labelledby="lnd-proof-title">
          <div className="wrap">
            <div className="lnd-proof">
              <div className="lnd-proof__copy">
                <p className="t-eyebrow">Proof of process · Alder &amp; 8th, round 1</p>
                <h2 id="lnd-proof-title" className="t-h2">Every comment was read, grouped and answered in public.</h2>
                <p className="t-body t-muted">
                  One request couldn't be adopted, and the record says why. Every project on Forma ends with a public decision anyone can read.
                </p>
                <Link to="/projects/alder-8th/decision" className="btn btn--primary">Read the decision<Icon name="arrowRight" /></Link>
              </div>
              <div className="lnd-proof__flow">
                <ol className="lnd-proof__stats">
                  {proof.map((s, i) => (
                    <li key={s.label} className="lnd-proof__stat">
                      <Icon name={s.icon} className="lnd-proof__icon" />
                      <span className="lnd-proof__value t-num">{s.value}</span>
                      <span className="lnd-proof__label">{s.label}</span>
                      {i < proof.length - 1 && <Icon name="arrowRight" className="lnd-proof__arrow" />}
                    </li>
                  ))}
                </ol>
                <Truth kind="illustrative">Fictional project and numbers, for demonstration</Truth>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
