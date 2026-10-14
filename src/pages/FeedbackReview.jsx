import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { Empty, Truth, fmtDate } from "../components/ui.jsx";
import { THEME_BY_ID, PROJECT_BASE } from "../data/featured.js";
import { submitDraft, updateDraft, setState, useStore } from "../lib/store.js";
import { FlowSteps, MiniMap, themeIcon, describePlace, optionLabel, sentimentLabel, themeName } from "./participate-shared.jsx";
import "./participate.css";

// R12 · Privacy and submission preview (step 3 of 3).
export default function FeedbackReview() {
  const navigate = useNavigate();
  const draft = useStore((s) => s.draft);
  const [consent, setConsent] = useState(false);
  const [tried, setTried] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | error
  const [error, setError] = useState(null);
  const consentRef = useRef(null);

  if (!draft || !draft.text?.trim() || !draft.lngLat) {
    return (
      <main id="main" tabIndex={-1} className="pt-flow">
        <div className="wrap pt-flow__wrap">
          <Empty level={1} icon="comment" title="There's nothing to check yet" action={<Link className="btn btn--accent" to={`${PROJECT_BASE}/feedback`}>Start a comment<Icon name="arrowRight" /></Link>}>
            Your draft is empty — it may have been sent already, or cleared. Drafts live only in this browser.
          </Empty>
        </div>
      </main>
    );
  }

  const isPublic = (draft.visibility || "public") === "public";
  const describing = draft.locMode === "describe";
  const displayName = draft.name?.trim() || "Resident";
  const theme = THEME_BY_ID[draft.theme];
  const place = describing ? "Location described in words" : draft.placeLabel || describePlace(draft.lngLat);
  const today = new Date().toISOString().slice(0, 10);

  const send = () => {
    setTried(true);
    if (!consent) { consentRef.current?.focus(); return; }
    setStatus("sending");
    setError(null);
    // A short pause so the sending state is perceivable; storage is synchronous.
    setTimeout(() => {
      try {
        const extra = { placeLabel: place, describe: describing ? draft.describe : null, locMode: draft.locMode || "map" };
        const c = submitDraft();
        setState((s) => ({ mine: s.mine.map((m) => (m.id === c.id ? { ...m, ...extra } : m)) }));
        navigate(`${PROJECT_BASE}/feedback/receipt/${c.ref}`);
      } catch (e) {
        setStatus("error");
        setError(e?.message || "Something went wrong while saving your comment.");
      }
    }, 450);
  };

  return (
    <main id="main" tabIndex={-1} className="pt-flow">
      <div className="pt-review">
        <section className="pt-review__preview" aria-labelledby="review-title">
          <div className="pt-review__inner stack" style={{ "--stack": "20px" }}>
            <FlowSteps step={3} label="Check and send" />
            <div className="stack" style={{ "--stack": "8px" }}>
              <h1 id="review-title" className="t-h1">Check your comment</h1>
              <p className="t-body t-muted">
                {isPublic ? "This is exactly what other people will see on the comment map." : "Only the project team will see this. It never appears in public views."}
              </p>
            </div>

            <article className={`pt-preview ${isPublic ? "" : "is-private"}`} aria-label={isPublic ? "Public preview" : "Private preview"}>
              {!describing && <MiniMap lngLat={draft.lngLat} zoom={19.2} className="pt-preview__map" />}
              <div className="pt-preview__body">
                <div className="pt-badges">
                  <span className="badge badge--voice">{theme && <Icon name={themeIcon(theme.id)} />}{themeName(draft.theme)}</span>
                  <span className="badge badge--outline badge--plain">{place}</span>
                  <span className="badge badge--outline badge--plain">{optionLabel(draft.option).split(" · ")[0]}</span>
                  <span className="badge badge--outline badge--plain">{sentimentLabel(draft.sentiment)}</span>
                </div>
                <blockquote className="pt-quote pt-quote--lg">“{draft.text.trim()}”</blockquote>
                <p className="pt-preview__by t-caption t-muted">
                  <Icon name={isPublic ? "users" : "lock"} />
                  {isPublic ? displayName : "Private to the project team"} · <time dateTime={today}>{fmtDate(today)}</time>
                </p>
              </div>
              {!isPublic && <span className="pt-preview__lock badge badge--ink badge--plain"><Icon name="lock" />Team only</span>}
            </article>

            <div className="pt-hidden">
              <p className="pt-filter__label">Never shown publicly</p>
              <ul>
                <li><Icon name="check" />Your browser, device or IP address</li>
                <li><Icon name="check" />{draft.name?.trim() ? (isPublic ? "Anything beyond your first name" : `Your name (${draft.name.trim()})`) : "A name — you'll appear as “Resident”"}</li>
                <li><Icon name="check" />{describing ? "Your description is used only to place the pin" : "Any location other than this pin"}</li>
              </ul>
            </div>
            <Link className="btn btn--ghost pt-edit" to={`${PROJECT_BASE}/feedback/compose${describing ? "?describe=1" : ""}`}><Icon name="edit" />Edit comment</Link>
          </div>
        </section>

        <section className="pt-review__side" aria-labelledby="who-title">
          <div className="pt-review__inner stack" style={{ "--stack": "24px" }}>
            <fieldset className="pt-fieldset">
              <legend id="who-title" className="t-h3">Who can see this?</legend>
              <div className="stack" style={{ "--stack": "10px", marginTop: 14 }}>
                <label className="choice">
                  <input type="radio" name="visibility" checked={isPublic} onChange={() => updateDraft({ visibility: "public" })} />
                  <span className="stack" style={{ "--stack": "2px" }}>
                    <span className="pt-method__title"><Icon name="eye" className="pt-inline-icon" />Public, as “{displayName}”</span>
                    <span className="t-caption t-muted">The comment and its pin appear on the comment map after a quick check. {draft.name?.trim() ? "Only your first name is shown." : "No name is shown."}</span>
                  </span>
                </label>
                <label className="choice">
                  <input type="radio" name="visibility" checked={!isPublic} onChange={() => updateDraft({ visibility: "private" })} />
                  <span className="stack" style={{ "--stack": "2px" }}>
                    <span className="pt-method__title"><Icon name="lock" className="pt-inline-icon" />Private to the project team</span>
                    <span className="t-caption t-muted">Planners read it and count it in the themes. It never appears in public views.</span>
                  </span>
                </label>
              </div>
            </fieldset>

            <div className="pt-explainer">
              <p className="pt-privnote__title"><Icon name="shield" />How your comment is handled</p>
              <dl>
                <div><dt>No account</dt><dd>Forma doesn't ask who you are. This demo keeps your comment in this browser only.</dd></div>
                <div><dt>Location</dt><dd>{describing ? "Your words are used to place a pin; then only the pin is kept." : "Only the pin is kept — never your address or where you are now."}</dd></div>
                <div><dt>Moderation</dt><dd>Comments with personal details, threats or abuse are edited or held back. Disagreeing with the plan is never a reason to remove a comment.</dd></div>
              </dl>
            </div>

            <div className="field">
              <label className={`pt-consent ${tried && !consent ? "is-error" : ""}`}>
                <input ref={consentRef} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={tried && !consent} aria-describedby={tried && !consent ? "consent-error" : undefined} />
                <span>I understand how my comment will be used and shown.</span>
              </label>
              {tried && !consent && <p id="consent-error" className="field__error"><Icon name="alert" />Tick the box to confirm before sending.</p>}
            </div>

            {status === "error" && (
              <div className="notice notice--danger" role="alert">
                <Icon name="alert" />
                <div>
                  <p><strong>Your comment wasn't sent.</strong> {error}</p>
                  <p>Your draft is still saved in this browser. <Link className="link" to={`${PROJECT_BASE}/feedback`}>Check the location</Link> or try again.</p>
                </div>
              </div>
            )}

            <div className="pt-formfoot pt-formfoot--review">
              <Link className="btn btn--secondary" to={`${PROJECT_BASE}/feedback/compose${describing ? "?describe=1" : ""}`}><Icon name="arrowLeft" />Back</Link>
              <button type="button" className="btn btn--accent btn--lg" onClick={send} aria-disabled={status === "sending"} disabled={status === "sending"}>
                {status === "sending" ? <><span className="mv__spinner pt-spin" aria-hidden="true" />Sending…</> : <><Icon name="send" />Send my comment</>}
              </button>
            </div>
            <p className="sr-only" aria-live="polite">{status === "sending" ? "Sending your comment" : ""}</p>
            <Truth kind="yours">Demo: saved in this browser only, not sent to a server</Truth>
          </div>
        </section>
      </div>
    </main>
  );
}
