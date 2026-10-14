import { useEffect, useRef, useState } from "react";
import { MAPILLARY_TOKEN, HAS_MAPILLARY } from "../lib/env.js";
import { distanceMeters } from "../lib/geo.js";
import Icon from "../components/Icon.jsx";

// Street-level imagery from Mapillary (CC BY-SA 4.0, credit the creator).
// Search API: graph.mapillary.com/images with a bbox under 0.01° square.
// Never substitutes unrelated imagery: if nothing is close enough, it says so.

const MAX_DISTANCE_M = 60;

async function nearestImage(lngLat, signal) {
  const [lng, lat] = lngLat;
  const d = 0.0007;
  const url = new URL("https://graph.mapillary.com/images");
  url.searchParams.set("access_token", MAPILLARY_TOKEN);
  url.searchParams.set("fields", "id,computed_geometry,geometry,compass_angle,captured_at,is_pano,creator");
  url.searchParams.set("bbox", [lng - d, lat - d, lng + d, lat + d].join(","));
  url.searchParams.set("limit", "200");
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(res.status === 401 || res.status === 403 ? "token" : `http ${res.status}`);
  const { data = [] } = await res.json();
  const scored = data
    .map((img) => {
      const c = (img.computed_geometry || img.geometry)?.coordinates;
      return c ? { ...img, lngLat: c, dist: distanceMeters(lngLat, c) } : null;
    })
    .filter(Boolean)
    // Prefer close, then recent, then panoramas.
    .sort((a, b) => a.dist - b.dist + (b.is_pano - a.is_pano) * 4 + (new Date(b.captured_at) - new Date(a.captured_at)) / 3.15e11);
  return scored[0] && scored[0].dist <= MAX_DISTANCE_M ? scored[0] : null;
}

export default function StreetView({ lngLat, onBack, context }) {
  const ref = useRef(null);
  const viewerRef = useRef(null);
  const [state, setState] = useState(HAS_MAPILLARY ? "searching" : "setup"); // setup | searching | ready | none | error
  const [image, setImage] = useState(null);
  const [bearing, setBearing] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!HAS_MAPILLARY || !lngLat) return;
    const ctl = new AbortController();
    setState("searching");
    nearestImage(lngLat, ctl.signal)
      .then((img) => {
        if (!img) { setState("none"); return; }
        setImage(img);
        setBearing(img.compass_angle || 0);
        setState("ready");
      })
      .catch((e) => { if (e.name !== "AbortError") { setErr(e.message); setState("error"); } });
    return () => ctl.abort();
  }, [lngLat?.[0], lngLat?.[1]]);

  useEffect(() => {
    if (state !== "ready" || !image || !ref.current) return;
    let viewer;
    let cancelled = false;
    Promise.all([import("mapillary-js"), import("mapillary-js/dist/mapillary.css")]).then(([mod]) => {
      if (cancelled) return;
      const { Viewer } = mod;
      viewer = new Viewer({ accessToken: MAPILLARY_TOKEN, container: ref.current, imageId: image.id, component: { cover: false, attribution: true } });
      viewerRef.current = viewer;
      viewer.on("image", (ev) => {
        const img = ev.image;
        setImage((prev) => ({ ...prev, id: img.id, captured_at: img.capturedAt, creator: { username: img.creatorUsername }, lngLat: [img.lngLat.lng, img.lngLat.lat] }));
      });
      viewer.on("bearing", (ev) => setBearing(ev.bearing));
    });
    return () => { cancelled = true; viewer?.remove(); viewerRef.current = null; };
    // The viewer is created when a starting image is found; navigation inside it updates `image` without recreating it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const mapillaryLink = lngLat ? `https://www.mapillary.com/app/?lat=${lngLat[1]}&lng=${lngLat[0]}&z=18${image ? `&pKey=${image.id}` : ""}` : "https://www.mapillary.com/app/";

  return (
    <div className="sv">
      {state === "ready" && <div ref={ref} className="sv__viewer" aria-label="Street-level photo viewer. Use arrow keys to look around and move." />}

      {state !== "ready" && (
        <div className="sv__state">
          <div className="sv__card panel-float">
            {state === "setup" && (
              <>
                <span className="badge badge--warning">Setup needed</span>
                <h3 className="t-h3">Street-level imagery needs a Mapillary token</h3>
                <p className="t-compact t-muted">Forma uses real photos from Mapillary, licensed CC BY-SA 4.0. Create a free client token in the Mapillary developer dashboard and add it to <span className="t-mono">.env.local</span>:</p>
                <pre className="mv__code">VITE_MAPILLARY_ACCESS_TOKEN=MLY|…</pre>
              </>
            )}
            {state === "searching" && (<><span className="mv__spinner" aria-hidden="true" /><p className="t-compact" role="status">Looking for street-level photos within {MAX_DISTANCE_M} m…</p></>)}
            {state === "none" && (
              <>
                <span className="badge badge--outline badge--plain">Unavailable</span>
                <h3 className="t-h3">No street-level photos here yet</h3>
                <p className="t-compact t-muted">Mapillary has no image within {MAX_DISTANCE_M} m of this spot. Forma won't show a photo of somewhere else instead.</p>
              </>
            )}
            {state === "error" && (
              <>
                <span className="badge badge--warning">Couldn't load</span>
                <h3 className="t-h3">{err === "token" ? "The Mapillary token was refused" : "Street-level photos didn't load"}</h3>
                <p className="t-compact t-muted">Try again later, or open the spot on Mapillary directly.</p>
              </>
            )}
            <div className="row" style={{ marginTop: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn btn--secondary btn--sm" onClick={onBack}><Icon name="arrowLeft" />Back to map</button>
              <a className="btn btn--ghost btn--sm" href={mapillaryLink} target="_blank" rel="noreferrer">Open on Mapillary<Icon name="external" /></a>
            </div>
          </div>
        </div>
      )}

      {state === "ready" && (
        <>
          <div className="sv__top">
            <button type="button" className="btn btn--secondary btn--sm glass" onClick={onBack}><Icon name="arrowLeft" />Return to map</button>
            <div className="sv__compass glass" role="img" aria-label={`Facing ${Math.round(bearing)} degrees`}>
              <span className="sv__needle" style={{ transform: `rotate(${bearing}deg)` }} />
              <span className="t-mono">{String(Math.round(((bearing % 360) + 360) % 360)).padStart(3, "0")}°</span>
            </div>
          </div>
          <div className="sv__bottom glass">
            <span className="badge badge--positive">Today · real photo</span>
            {context && <span className="t-caption">{context}</span>}
            <span className="t-caption t-muted">
              {image?.captured_at && `Captured ${new Date(image.captured_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })} · `}
              Photo by {image?.creator?.username || "a Mapillary contributor"} on <a className="link" href={mapillaryLink} target="_blank" rel="noreferrer">Mapillary</a> · CC BY-SA 4.0
            </span>
          </div>
        </>
      )}
    </div>
  );
}
