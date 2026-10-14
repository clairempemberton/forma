import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { StatusBadge, Truth } from "../components/ui.jsx";
import { projectById } from "../data/projects.js";
import { formatCoord } from "../lib/geo.js";
import { useMapMode } from "../lib/useMapMode.js";
import NotFound from "./NotFound.jsx";
import { PlanThumb, SiteFooter } from "./DiscoveryKit.jsx";
import "./discovery.css";

// Stand-in for directory projects that aren't built out. The location is real; the project is not.
export default function ProjectPreview() {
  const { id } = useParams();
  const p = projectById(id);
  const [mode, setMode] = useMapMode();
  const camera = useMemo(() => (p ? { center: p.lngLat, zoom: 17, bearing: 0, pitch: 0 } : null), [p]);
  const markers = useMemo(() => (p ? [{ id: p.id, kind: "project", lngLat: p.lngLat, label: p.title, selected: true, ariaLabel: `${p.title} location` }] : []), [p]);

  if (!p) {
    return (
      <NotFound title="We couldn't find that project">
        There's no project at this address. It may have been renamed, or the link may be incomplete.
      </NotFound>
    );
  }
  const live = projectById("alder-8th");

  return (
    <>
      <main id="main" tabIndex={-1} className="pv">
        <div className="wrap">
          <nav className="crumbs pv-crumbs" aria-label="Breadcrumb">
            <Link to="/projects">Projects</Link>
            <Icon name="chevronRight" />
            <span>{p.area}</span>
            <Icon name="chevronRight" />
            <span className="crumbs__current" aria-current="page">{p.title}</span>
          </nav>
        </div>

        <section className="wrap pv-grid" aria-labelledby="pv-title">
          <div className="pv-copy">
            <div className="pv-badges">
              <StatusBadge tone={p.statusTone}>{p.status}</StatusBadge>
              <span className="badge badge--outline badge--plain">Preview</span>
            </div>
            <h1 id="pv-title" className="t-h1">{p.title}</h1>
            <p className="pv-meta"><Icon name="pin" />{p.area}, Portland · {p.topic}</p>
            <p className="t-body t-muted">{p.summary}</p>
            <dl className="pv-facts">
              <div><dt>Dates</dt><dd>{p.dates}</dd></div>
              <div><dt>Other ways in</dt><dd>{p.access}</dd></div>
              <div><dt>Location</dt><dd className="t-mono">{formatCoord(p.lngLat)}</dd></div>
            </dl>

            <div className="pv-notice" role="note">
              <div className="pv-notice__thumb"><PlanThumb id={live.id} /></div>
              <div className="pv-notice__body">
                <p className="pv-notice__title"><Icon name="info" />This demo project is a preview. Only Alder &amp; 8th is fully built.</p>
                <p className="t-compact t-muted">There are no options, comments or decisions here. Alder &amp; 8th has all of them: a live map, three options, a guided tour and a published decision.</p>
                <Link to={`/projects/${live.id}`} className="btn btn--accent btn--sm">Open Alder &amp; 8th<Icon name="arrowRight" /></Link>
              </div>
            </div>
            <Link to="/projects" className="link"><Icon name="arrowLeft" />Back to all projects</Link>
          </div>

          <figure className="pv-map">
            <MapView
              mode={mode}
              onModeChange={setMode}
              initialCamera={camera}
              camera={camera}
              proposal={null}
              showProposal={false}
              showExisting={false}
              focusMask={false}
              markers={markers}
              clusterKinds={[]}
              hud={false}
              ariaLabel={`Map around ${p.title}, ${p.area}, Portland`}
              streetTarget={p.lngLat}
              streetContext="Street-level photos near this location. Nothing here is proposed."
            >
              <span className="pv-map__truth glass"><Truth kind="illustrative">Real location · fictional project</Truth></span>
            </MapView>
          </figure>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
