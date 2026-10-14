import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { Empty, StatusBadge, Truth, fmtDate } from "../components/ui.jsx";
import { PROJECT, REVISION_CHANGES, THEME_BY_ID } from "../data/alder.js";
import { resetDemo, setState, useStore } from "../lib/store.js";
import { PROJECT_BASE, Switch, THEME_ICON, describePlace, optionLabel, themeName, trackComment } from "./participate-shared.jsx";
import "./participate.css";

const SHORT_STEPS = { received: "Sent", read: "Read", grouped: "Joined a theme", answered: "Answered" };

// R14 · My contributions — tracking. Route /me.
export default function MyContributions() {
  const mine = useStore((s) => s.mine);
  const triage = useStore((s) => s.triage);
  const published = useStore((s) => s.published);
  const draft = useStore((s) => s.draft);
  const following = useStore((s) => s.followed.includes(PROJECT.id));
  const [confirming, setConfirming] = useState(false);
  const [announce, setAnnounce] = useState("");
  const confirmRef = useRef(null);
  const resetRef = useRef(null);

  useEffect(() => { if (confirming) confirmRef.current?.focus(); }, [confirming]);

  const toggleFollow = (on) => setState((s) => ({ followed: on ? [...new Set([...s.followed, PROJECT.id])] : s.followed.filter((id) => id !== PROJECT.id) }));
  const doReset = () => { resetDemo(); setConfirming(false); setAnnounce("Demo reset. Your comments and draft were removed from this browser."); };
  const hasDraft = !!(draft && (draft.text?.trim() || draft.lngLat));

  return (
    <main id="main" tabIndex={-1} className="pt-me pt-flow--tint">
      <div className="wrap pt-me__wrap">
        <aside className="pt-me__side stack" style={{ "--stack": "16px" }} aria-labelledby="me-title">
          <div className="stack" style={{ "--stack": "8px" }}>
            <p className="t-eyebrow">Saved in this browser</p>
            <h1 id="me-title" className="t-h1">Your comments</h1>
            <p className="t-compact t-muted">No account needed. Forma keeps these on this device only — another browser, or clearing site data, won't show them.</p>
          </div>

          <Link to={PROJECT_BASE} className="card card--interactive pt-me__project">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <StatusBadge tone={PROJECT.statusTone}>{PROJECT.status}</StatusBadge>
              <span className="t-caption t-muted">{PROJECT.round}</span>
            </div>
            <p className="pt-method__title">{PROJECT.title}</p>
            <p className="t-caption t-muted">{PROJECT.place.name} · comments close {fmtDate(PROJECT.closes, { month: "short", day: "numeric" })}</p>
          </Link>

          <div className="card pt-follow">
            <div className="row" style={{ gap: 12 }}>
              <div className="stack" style={{ "--stack": "2px", flex: 1 }}>
                <p id="me-follow" className="pt-method__title">Follow this project</p>
                <p className="t-caption t-muted">Decisions and revisions show up here. No email in this demo.</p>
              </div>
              <Switch checked={following} onChange={toggleFollow} labelledBy="me-follow" />
            </div>
          </div>

          <div className="pt-me__reset">
            {!confirming ? (
              <button ref={resetRef} type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(true)}><Icon name="reset" />Reset demo</button>
            ) : (
              <div className="pt-confirm" role="group" aria-labelledby="confirm-title">
                <p id="confirm-title" className="t-compact"><strong>Delete everything saved by this demo?</strong> Your {mine.length === 1 ? "comment" : `${mine.length} comments`}, any draft and staff triage in this browser will be removed. This can't be undone.</p>
                <div className="row">
                  <button ref={confirmRef} type="button" className="btn btn--sm pt-danger" onClick={doReset}>Delete and reset</button>
                  <button type="button" className="btn btn--secondary btn--sm" onClick={() => { setConfirming(false); setTimeout(() => resetRef.current?.focus(), 0); }}>Cancel</button>
                </div>
              </div>
            )}
            <p className="sr-only" aria-live="polite">{announce}</p>
          </div>
        </aside>

        <section className="pt-me__main stack" style={{ "--stack": "14px" }} aria-label="Comment tracking">
          {hasDraft && (
            <div className="card pt-draftnote">
              <Icon name="edit" />
              <p className="t-compact"><strong>You have an unsent draft.</strong> {draft.text?.trim() ? `“${draft.text.trim().slice(0, 80)}${draft.text.trim().length > 80 ? "…" : ""}”` : "A location is chosen; the comment isn't written yet."}</p>
              <Link className="btn btn--secondary btn--sm" to={`${PROJECT_BASE}/feedback/${draft.lngLat ? "compose" : ""}`}>Continue</Link>
            </div>
          )}

          {mine.length === 0 ? (
            <div className="card pt-me__empty">
              <Empty icon="comment" title={announce ? "Demo reset" : "No comments yet"} action={<Link className="btn btn--accent" to={`${PROJECT_BASE}/feedback`}><Icon name="plus" />Add a comment</Link>}>
                When you comment on a project, you can follow it here: when the team reads it, which theme it joins, and how the design changed.
              </Empty>
            </div>
          ) : (
            <>
              <p className="t-caption t-muted">{mine.length} comment{mine.length === 1 ? "" : "s"} · newest first</p>
              <ul className="stack" style={{ "--stack": "14px" }}>
                {mine.map((c) => <CommentTrack key={c.id} c={c} track={trackComment(c, triage, published)} />)}
              </ul>
              <p className="t-caption t-muted pt-note"><Icon name="info" />Your comment is one of many that shape each theme. Forma never claims a single comment caused a change. Statuses and responses are part of the fictional demo.</p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function CommentTrack({ c, track }) {
  const theme = THEME_BY_ID[track.theme];
  const change = theme ? REVISION_CHANGES.find((r) => r.themes.includes(theme.id)) : null;
  const doneCount = track.steps.filter((s) => s.status === "done").length;
  return (
    <li className="card pt-track">
      <div className="pt-track__top">
        <span className="fid fid--line">{c.ref}</span>
        <span className="badge badge--voice">{theme && <Icon name={THEME_ICON[theme.id]} />}{themeName(track.theme)}</span>
        <span className="badge badge--outline badge--plain"><Icon name={c.public ? "eye" : "lock"} />{c.public ? `Public as ${c.author}` : "Team only"}</span>
        <span className="spacer" />
        <span className="t-caption t-muted"><time dateTime={c.date}>{fmtDate(c.date)}</time></span>
      </div>
      <p className="pt-quote pt-track__quote">“{c.text}”</p>
      <p className="t-caption t-muted pt-track__where"><Icon name="pin" />{c.locMode === "describe" ? `Described: “${c.describe || "in words"}”` : c.placeLabel || describePlace(c.lngLat)} · {optionLabel(c.option).split(" · ")[0]}</p>

      <ol className="pt-progress" aria-label={`Progress: ${doneCount} of ${track.steps.length} steps done`}>
        {track.steps.map((s) => (
          <li key={s.id} data-status={s.status}>
            <span className="pt-progress__dot" aria-hidden="true">{s.status === "done" && <Icon name="check" />}</span>
            <span className="pt-progress__label">{SHORT_STEPS[s.id]}</span>
            <span className="sr-only">{s.status === "done" ? "done" : s.status === "current" ? "in progress" : "not yet"}</span>
          </li>
        ))}
      </ol>

      <div className="pt-track__grid">
        <div className="pt-track__cell">
          <p className="t-eyebrow">{track.assignedByTeam ? "Theme the team assigned" : "Theme you chose"}</p>
          <p className="pt-method__title">{theme ? theme.name : "Something else"}</p>
          <p className="t-caption t-muted">
            {track.assignedByTeam ? "Planners grouped your comment with others describing the same thing." : "The team may move it to a different theme when they read it."}
          </p>
        </div>
        <div className="pt-track__cell">
          <p className="t-eyebrow">What happened</p>
          {theme ? (
            <>
              <p className="t-compact">{theme.response}</p>
              <div className="row" style={{ flexWrap: "wrap", gap: "4px 14px" }}>
                <Link className="link t-caption" to={change ? `${PROJECT_BASE}/revision` : `${PROJECT_BASE}/decision`}>{change ? "See what changed in version 2" : "Read the decision"}<Icon name="arrowRight" /></Link>
                <Truth kind="illustrative">Round 1 response · fictional</Truth>
              </div>
            </>
          ) : (
            <>
              <p className="t-compact t-muted">Nothing yet. Once the team groups your comment, its theme's response appears here.</p>
              <Link className="link t-caption" to={`${PROJECT_BASE}/decision`}>Read the latest decision<Icon name="arrowRight" /></Link>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
