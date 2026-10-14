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

// Directory projects that aren't built out in Forma: the official facts, a map and a link to the agency's page.
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
  const live = projectById("hawthorne");

  return (
    <>
      <main id="main" tabIndex={-1} className="pv">
        <div className="wrap">
          <nav className="crumbs pv-crumbs" aria-label="Breadcrumb">
            <Link to="/">Projects</Link>
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
              <div><dt>Agency</dt><dd>{p.agency}</dd></div>
              <div><dt>Dates</dt><dd>{p.dates}</dd></div>
              <div><dt>Location</dt><dd className="t-mono">{formatCoord(p.lngLat)} · approximate</dd></div>
            </dl>
            {p.facts?.length > 0 && (
              <ul className="pv-factlist t-compact">
                {p.facts.map((f) => <li key={f}>{f}</li>)}
              </ul>
            )}
            <p className="row">
              <Truth kind="source">Source: {p.agency}</Truth>
              {p.url && <a className="link" href={p.url} target="_blank" rel="noreferrer">Official project page<Icon name="external" /></a>}
            </p>

            <div className="pv-notice" role="note">
              <div className="pv-notice__thumb"><PlanThumb id={live.id} /></div>
              <div className="pv-notice__body">
                <p className="pv-notice__title"><Icon name="info" />This project is a preview in Forma. Only SE Hawthorne is fully built.</p>
                <p className="t-compact t-muted">Forma shows only the official facts here. SE Hawthorne has the full story: a live map, PBOT's four alternatives, a guided tour and the published decision.</p>
                <Link to={`/projects/${live.id}`} className="btn btn--accent btn--sm">Open SE Hawthorne<Icon name="arrowRight" /></Link>
              </div>
            </div>
            <Link to="/" className="link"><Icon name="arrowLeft" />Back to all projects</Link>
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
              streetContext="Street-level photos near this location. They may predate the project."
            >
              <span className="pv-map__truth glass"><Truth kind="osm">Approximate location · OpenStreetMap</Truth></span>
            </MapView>
          </figure>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
