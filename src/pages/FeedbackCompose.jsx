import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { Notice } from "../components/ui.jsx";
import { ORIGIN, THEMES } from "../data/alder.js";
import { updateDraft, clearDraft, useStore } from "../lib/store.js";
import { FlowSteps, MiniMap, OPTION_CHOICES, SENTIMENTS, THEME_ICON, THEME_SHORT, describePlace, nearestFeature, fmtMeters } from "./participate-shared.jsx";
import "./participate.css";

const MAX = 1000;
const MIN = 10;

const timeOf = (ts) => new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

// R11 · Feedback composer — private draft (step 2 of 3).
export default function FeedbackCompose() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const draft = useStore((s) => s.draft) || {};
  const describing = params.get("describe") === "1" || draft.locMode === "describe";
  // In the describe path the location is written in this form, so it always counts as chosen.
  const hasPlace = describing || !!draft.lngLat;
  const [tried, setTried] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const refs = { describe: useRef(null), theme: useRef(null), option: useRef(null), text: useRef(null), sentiment: useRef(null) };

  // Every change autosaves to this browser.
  const save = (patch) => updateDraft({ ...patch, savedAt: Date.now() });

  // Links from other screens: ?describe=1 (no map) and ?option=A|B|C preselect.
  useEffect(() => {
    const patch = {};
    if (params.get("describe") === "1") Object.assign(patch, { locMode: "describe", lngLat: ORIGIN, placeLabel: "Described in words", featureId: null });
    const o = params.get("option");
    if (["A", "B", "C", "today"].includes(o)) patch.option = o;
    if (o === "general") patch.option = null;
    if (Object.keys(patch).length) updateDraft(patch);
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const text = draft.text || "";
  const errors = {};
  if (describing && (draft.describe || "").trim().length < 5) errors.describe = "Describe where your comment is about, for example “the curb ramp on the southwest corner”.";
  if (!draft.theme) errors.theme = "Choose what your comment is about, or “Something else”.";
  if (text.trim().length < MIN) errors.text = text.trim().length === 0 ? "Write your comment." : `Add a little more — at least ${MIN} characters.`;
  if (!draft.sentiment) errors.sentiment = "Choose whether this is a concern, support or an idea.";
  const shown = tried ? errors : {};
  const errorList = Object.entries(shown);

  const next = () => {
    setTried(true);
    if (!hasPlace) return;
    const first = ["describe", "theme", "text", "sentiment"].find((k) => errors[k]);
    if (first) { (refs[first].current?.querySelector?.("input") || refs[first].current)?.focus(); return; }
    navigate(`/projects/alder-8th/feedback/review${describing ? "?describe=1" : ""}`);
  };

  const near = draft.lngLat && !describing ? nearestFeature(draft.lngLat) : null;
  const placeLabel = describing ? "Described in words" : draft.placeLabel || describePlace(draft.lngLat);

  return (
    <main id="main" tabIndex={-1} className="pt-flow">
      <div className="wrap pt-flow__wrap">
        <div className="pt-flow__head">
          <FlowSteps step={2} label="Your comment" />
          <h1 className="t-h1">What should the team know?</h1>
          <p className="t-body t-muted measure">Be specific about what happens to you here. Particular moments help the team more than ratings do.</p>
        </div>

        <div className="pt-compose">
          <form className="pt-form stack" style={{ "--stack": "28px" }} noValidate onSubmit={(e) => { e.preventDefault(); next(); }} aria-describedby="draft-status">
            {errorList.length > 0 && (
              <div className="notice notice--danger pt-errsum" role="alert">
                <Icon name="alert" />
                <div>
                  <p><strong>{errorList.length === 1 ? "One thing needs fixing" : `${errorList.length} things need fixing`}</strong></p>
                  <ul>{errorList.map(([k, msg]) => <li key={k}><a href={`#f-${k}`} onClick={(e) => { e.preventDefault(); (refs[k].current?.querySelector?.("input") || refs[k].current)?.focus(); }}>{msg}</a></li>)}</ul>
                </div>
              </div>
            )}

            {describing && (
              <div className="field" id="f-describe">
                <label className="field__label" htmlFor="describe-text">Where is it?</label>
                <textarea
                  id="describe-text" ref={refs.describe} className="textarea pt-describe" rows={3} maxLength={300}
                  value={draft.describe || ""} onChange={(e) => save({ describe: e.target.value, locMode: "describe", lngLat: draft.lngLat || ORIGIN })}
                  aria-invalid={!!shown.describe} aria-describedby={`describe-hint${shown.describe ? " err-describe" : ""}`}
                  placeholder="e.g. the curb ramp on the southwest corner, facing Alder"
                />
                <p id="describe-hint" className="field__hint">No map needed. The team places the pin for you; your words are only used to find the spot. <Link className="link" to="/projects/alder-8th/feedback">Use the map instead</Link></p>
                {shown.describe && <p id="err-describe" className="field__error"><Icon name="alert" />{shown.describe}</p>}
              </div>
            )}

            <fieldset className="pt-fieldset" ref={refs.theme} id="f-theme" aria-invalid={!!shown.theme} aria-describedby={shown.theme ? "err-theme" : undefined}>
              <legend className="field__label">What is it about?</legend>
              <div className="pt-chips">
                {THEMES.map((t) => (
                  <label key={t.id} className="chip pt-radio">
                    <input type="radio" name="theme" className="sr-only" checked={draft.theme === t.id} onChange={() => save({ theme: t.id })} />
                    <Icon name={draft.theme === t.id ? "check" : THEME_ICON[t.id]} />{THEME_SHORT[t.id]}
                  </label>
                ))}
                <label className="chip pt-radio">
                  <input type="radio" name="theme" className="sr-only" checked={draft.theme === "other"} onChange={() => save({ theme: "other" })} />
                  <Icon name={draft.theme === "other" ? "check" : "more"} />Something else
                </label>
              </div>
              {shown.theme && <p id="err-theme" className="field__error"><Icon name="alert" />{shown.theme}</p>}
            </fieldset>

            <fieldset className="pt-fieldset" ref={refs.option} id="f-option">
              <legend className="field__label">Which design is it about?</legend>
              <div className="seg pt-seg pt-seg--radio">
                {OPTION_CHOICES.map((o) => (
                  <label key={o.id} className="seg__btn pt-segradio">
                    <input type="radio" name="option" className="sr-only" checked={(draft.option || "general") === o.id} onChange={() => save({ option: o.id === "general" ? null : o.id })} />
                    {o.label}
                  </label>
                ))}
              </div>
              <p className="field__hint">“General” if it's about the corner as a whole. <Link className="link" to="/projects/alder-8th/compare">Compare the options</Link></p>
            </fieldset>

            <div className="field" id="f-text">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                <label className="field__label" htmlFor="comment-text">What works, or worries you, here?</label>
                <span className={`t-caption t-num ${text.length > MAX - 50 ? "pt-count--near" : "t-muted"}`} id="text-count" aria-live="polite" aria-atomic="true">
                  {text.length.toLocaleString("en-US")} / {MAX.toLocaleString("en-US")}
                </span>
              </div>
              <textarea
                id="comment-text" ref={refs.text} className="textarea" rows={6} maxLength={MAX}
                value={text} onChange={(e) => save({ text: e.target.value })}
                aria-invalid={!!shown.text} aria-describedby={`text-hint text-count${shown.text ? " err-text" : ""}`}
                placeholder="e.g. When I cross 8th here with a stroller, drivers don't see me until I'm in the road."
              />
              <p id="text-hint" className="field__hint">Please leave out names, addresses and phone numbers. If any slip in, we remove them before anything is public.</p>
              {shown.text && <p id="err-text" className="field__error"><Icon name="alert" />{shown.text}</p>}
            </div>

            <fieldset className="pt-fieldset" ref={refs.sentiment} id="f-sentiment" aria-invalid={!!shown.sentiment} aria-describedby={shown.sentiment ? "err-sentiment" : undefined}>
              <legend className="field__label">Is this a…</legend>
              <div className="pt-sentiments">
                {SENTIMENTS.map((s) => (
                  <label key={s.id} className="choice pt-sentiment">
                    <input type="radio" name="sentiment" checked={draft.sentiment === s.id} onChange={() => save({ sentiment: s.id })} />
                    <span className="stack" style={{ "--stack": "2px" }}>
                      <span className="pt-method__title">{s.label}</span>
                      <span className="t-caption t-muted">{s.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
              {shown.sentiment && <p id="err-sentiment" className="field__error"><Icon name="alert" />{shown.sentiment}</p>}
            </fieldset>

            <div className="field">
              <label className="field__label" htmlFor="comment-name">First name <span className="t-muted" style={{ fontWeight: 400 }}>Optional</span></label>
              <input id="comment-name" className="input pt-name" autoComplete="given-name" maxLength={40} value={draft.name || ""} onChange={(e) => save({ name: e.target.value })} aria-describedby="name-hint" />
              <p id="name-hint" className="field__hint">Shown only if you make the comment public. Leave it blank to appear as “Resident”.</p>
            </div>

            <div className="pt-formfoot">
              <p id="draft-status" className="pt-saved t-caption" aria-live="polite">
                <Icon name={draft.savedAt ? "check" : "lock"} />
                {draft.savedAt ? `Draft saved in this browser · ${timeOf(draft.savedAt)}` : "Your draft stays in this browser"}
              </p>
              <span className="spacer" />
              <Link className="btn btn--secondary" to="/projects/alder-8th/feedback"><Icon name="arrowLeft" />Back</Link>
              <button type="submit" className="btn btn--accent">Continue<Icon name="arrowRight" /></button>
            </div>
          </form>

          <aside className="pt-aside" aria-label="Your draft">
            {hasPlace ? (
              <div className="card pt-placecard">
                {!describing && <MiniMap lngLat={draft.lngLat} />}
                <div className="pt-placecard__body">
                  <div className="row" style={{ alignItems: "flex-start", gap: 10 }}>
                    <Icon name={describing ? "text" : "pin"} className="pt-placecard__icon" />
                    <div className="stack" style={{ "--stack": "2px", minWidth: 0, flex: 1 }}>
                      <p className="pt-picked__title">{placeLabel}</p>
                      {describing
                        ? <p className="t-caption t-muted">{draft.describe?.trim() ? `“${draft.describe.trim()}”` : "Write where it is in the form."}</p>
                        : near && !draft.featureId && <p className="t-caption t-muted">Near {near.feature.id} · {near.feature.name} · {fmtMeters(near.distance)}</p>}
                    </div>
                    {describing
                      ? <button type="button" className="btn btn--ghost btn--sm" onClick={() => refs.describe.current?.focus()}><Icon name="edit" />Edit</button>
                      : <Link className="btn btn--ghost btn--sm" to="/projects/alder-8th/feedback"><Icon name="pin" />Move pin</Link>}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`card pt-placecard pt-placecard--empty ${tried ? "is-error" : ""}`} role={tried ? "alert" : undefined}>
                <div className="empty__icon"><Icon name="pin" /></div>
                <p className="pt-picked__title">Choose a location first</p>
                <p className="t-caption t-muted">Comments are tied to a spot so the team knows exactly what you mean. You can also describe it in words.</p>
                <Link className="btn btn--accent btn--sm" to="/projects/alder-8th/feedback">Choose a location</Link>
              </div>
            )}

            <div className="pt-privnote">
              <p className="pt-privnote__title"><Icon name="lock" />Private until you choose</p>
              <ul>
                <li>Your draft stays in this browser. Nothing is sent until step 3.</li>
                <li>No account, email or address needed.</li>
                <li>You'll see exactly what becomes public before you send.</li>
              </ul>
              {discarding ? (
                <div className="row" role="group" aria-label="Confirm discarding the draft">
                  <span className="t-caption">Delete this draft?</span>
                  <button type="button" className="link pt-discard pt-discard--yes" onClick={() => { clearDraft(); navigate("/projects/alder-8th/perspectives"); }}>Delete</button>
                  <button type="button" className="link pt-discard" onClick={() => setDiscarding(false)}>Keep it</button>
                </div>
              ) : (
                <button type="button" className="link pt-discard" onClick={() => setDiscarding(true)}>Discard draft</button>
              )}
            </div>
            {draft.theme === "other" && <Notice icon="info">The team will group “something else” comments into a theme, or start a new one.</Notice>}
          </aside>
        </div>
      </div>
    </main>
  );
}
