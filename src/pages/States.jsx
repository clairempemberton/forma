import Icon from "../components/Icon.jsx";
import { Empty, Notice, Truth } from "../components/ui.jsx";
import { HAS_MAPBOX } from "../lib/env.js";
import { useReducedMotion } from "../lib/motion.js";
import "../map/map.css";
import "./outcomes.css";

// Each specimen is rendered with the same markup and classes the live component uses,
// made inert so the gallery can't trigger real actions.
function Specimen({ title, tag, when, recovery, tall, wide, pattern, children }) {
  return (
    <figure className="sts__card" data-wide={wide || undefined}>
      <div className="sts__card-head">
        <h3 className="sts__card-title">{title}</h3>
        <span className="sts__tag">{tag}</span>
      </div>
      <div className="sts__stage" data-tall={tall || undefined} inert="">
        {children}
      </div>
      <figcaption className="sts__cap">
        <p><strong>When:</strong> {when}</p>
        <p><strong>Way back:</strong> {recovery}</p>
        {pattern && <p className="sts__pattern"><Icon name="info" />Prototype has no server: this is the state a live service shows.</p>}
      </figcaption>
    </figure>
  );
}

const MapShell = ({ children, status = "ready" }) => (
  <div className="mv sts__mv" data-status={status}>{children}</div>
);

// R25 · System states — every state the prototype can land in, beyond the happy path.
export default function States() {
  const reduced = useReducedMotion();

  return (
    <main id="main" tabIndex={-1} className="sts">
      <div className="wrap page page--tight">
        <header className="sts__head">
          <div className="stack" style={{ "--stack": "12px" }}>
            <p className="t-eyebrow">System states and edge cases</p>
            <h1 className="t-h1">Beyond the happy path</h1>
            <p className="t-body t-muted measure">Every screen in Forma has a loading, empty, error and setup state. Each specimen below is the real interface, shown as it appears, with when it happens and the way back.</p>
          </div>
          <Truth kind="sample">Examples use sample data</Truth>
        </header>

        <section className="sts__group" aria-labelledby="sts-map">
          <div className="sts__group-head">
            <h2 id="sts-map" className="t-h3">The map</h2>
            <p className="t-compact t-muted">Map, 3D and Satellite share one surface. Everything on it is also available as a list and in the text-only version.</p>
          </div>
          <div className="sts__grid">
            <Specimen title="Loading the map" tag="Loading" when="The map engine and tiles are still downloading, usually under a second on a good connection." recovery="Panels and lists are usable straight away; the map fades in when ready.">
              <MapShell status="loading">
                <div className="mv__loading" role="status">
                  <div className="mv__loading-grid" aria-hidden="true" />
                  <span className="mv__loading-label"><span className="mv__spinner" aria-hidden="true" />Loading the map</span>
                </div>
              </MapShell>
            </Specimen>

            <Specimen title="Map token refused" tag="Error" when="Mapbox rejects the access token (401 or 403), for example when its URL restrictions don't include this site." recovery="The text-only version describes everything on the map.">
              <MapShell status="error">
                <div className="mv__state">
                  <div className="empty">
                    <div className="empty__icon"><Icon name="key" /></div>
                    <h3 className="t-h3">The map token was refused</h3>
                    <p className="t-compact t-muted measure">Check VITE_MAPBOX_ACCESS_TOKEN in .env.local and that its URL restrictions allow this site.</p>
                    <span className="btn btn--secondary btn--sm">Open the text-only version</span>
                  </div>
                </div>
              </MapShell>
            </Specimen>

            <Specimen title="WebGL unavailable" tag="Error" when="The browser or device can't create a WebGL context, so no map can be drawn." recovery="Same text-only route; nothing in Forma depends on seeing the map.">
              <MapShell status="error">
                <div className="mv__state">
                  <div className="empty">
                    <div className="empty__icon"><Icon name="alert" /></div>
                    <h3 className="t-h3">This browser can't draw the map</h3>
                    <p className="t-compact t-muted measure">Everything on the map is also described in words.</p>
                    <span className="btn btn--secondary btn--sm">Open the text-only version</span>
                  </div>
                </div>
              </MapShell>
            </Specimen>

            <Specimen title="Satellite needs setup" tag="Setup" tall when={`Someone picks Satellite without a Mapbox token configured${HAS_MAPBOX ? "" : " (the case in this build)"}. Forma only shows licensed aerial imagery.`} recovery="Back to Map; Map and 3D keep working on OpenStreetMap tiles.">
              <MapShell>
                <div className="mv__loading-grid sts__fake-map" aria-hidden="true" />
                <div className="mv__state mv__state--glass">
                  <div className="mv__setup panel-float">
                    <span className="badge badge--warning">Setup needed</span>
                    <h3 className="t-h3">Satellite imagery needs a Mapbox token</h3>
                    <p className="t-compact t-muted">Forma only shows licensed aerial imagery. Add a public token and rebuild:</p>
                    <pre className="mv__code">VITE_MAPBOX_ACCESS_TOKEN=pk.…</pre>
                    <span className="btn btn--secondary btn--sm"><Icon name="map" />Back to Map</span>
                  </div>
                </div>
              </MapShell>
            </Specimen>

          </div>
        </section>

        <section className="sts__group" aria-labelledby="sts-comments">
          <div className="sts__group-head">
            <h2 id="sts-comments" className="t-h3">Comments</h2>
            <p className="t-compact t-muted">Comments are saved in this browser in the prototype. Drafts survive reloads and lost connections.</p>
          </div>
          <div className="sts__grid sts__grid--four">
            <Specimen title="No comments yet" tag="Empty" when="A place, theme or filter has no comments, or you haven't written any yet." recovery="The primary action is the next step.">
              <div className="sts__pad sts__center">
                <Empty icon="comment" title="Nobody has commented here yet" action={<span className="btn btn--accent btn--sm"><Icon name="pin" />Add a comment</span>}>
                  Be the first. You don't need an account.
                </Empty>
              </div>
            </Specimen>

            <Specimen title="Missing details" tag="Validation" when="Submitting without a location or without any text." recovery="Errors sit next to the field they belong to; nothing typed is lost.">
              <div className="sts__pad sts__form">
                <div className="field">
                  <span className="field__label">Where is this about?</span>
                  <div className="input sts__fake-input" aria-invalid="true">No location chosen</div>
                  <span className="field__error"><Icon name="alert" />Drop a pin on the map or pick a feature from the list.</span>
                </div>
                <div className="field">
                  <span className="field__label">Your comment</span>
                  <div className="textarea sts__fake-input sts__fake-textarea" aria-invalid="true" />
                  <span className="field__error"><Icon name="alert" />A location and a comment are required.</span>
                </div>
              </div>
            </Specimen>

            <Specimen title="Comment not sent" tag="Error" pattern when="Sending a comment to the project team fails." recovery="The draft stays on screen; try again, or copy the text.">
              <div className="sts__pad sts__form">
                <Notice tone="danger" icon="alert"><strong>Your comment wasn't sent.</strong> It's still here, exactly as you wrote it.</Notice>
                <div className="textarea sts__fake-input sts__quote">The ramp at 36th points into the middle of the intersection…</div>
                <div className="row"><span className="btn btn--primary btn--sm"><Icon name="rotate" />Try again</span><span className="btn btn--ghost btn--sm">Copy text</span></div>
              </div>
            </Specimen>

            <Specimen title="Lost connection" tag="Offline" pattern when="The device goes offline while browsing or writing." recovery="The draft is kept in this browser; sending waits until the connection is back.">
              <div className="sts__pad sts__form">
                <div className="sts__offline" role="status"><Icon name="wifiOff" /><span>You're offline. Your draft is saved on this device.</span></div>
                <div className="textarea sts__fake-input sts__quote">Please make sure both ramps line up with the crossings.</div>
                <div className="row"><span className="spacer" /><span className="btn btn--accent btn--sm" aria-disabled="true"><Icon name="send" />Send when online</span></div>
              </div>
            </Specimen>
          </div>
        </section>

        <section className="sts__motion card" aria-labelledby="sts-motion">
          <div className="sts__motion-icon"><Icon name="sparkle" /></div>
          <div className="stack" style={{ "--stack": "8px" }}>
            <h2 id="sts-motion" className="t-h3">Reduced motion</h2>
            <p className="t-compact t-muted measure">When the system asks for reduced motion, camera flights become instant cuts, map fades are switched off, and transitions and spinners stop animating. Nothing is hidden behind motion: every state above reads the same without it.</p>
            <p className="t-caption" aria-live="polite">
              <span className={`badge ${reduced ? "badge--accent" : "badge--outline"}`}>{reduced ? "Reduced motion is on for you" : "Reduced motion is off for you"}</span>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
