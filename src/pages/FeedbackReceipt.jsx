import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { Empty, Truth, fmtDate } from "../components/ui.jsx";
import { PROJECT } from "../data/alder.js";
import { setState, useStore } from "../lib/store.js";
import { MiniMap, Switch, describePlace, themeName, trackComment } from "./participate-shared.jsx";
import "./participate.css";

const WHEN = {
  received: (c) => fmtDate(c.date, { month: "short", day: "numeric" }),
  read: () => "Usually within a week",
  grouped: () => `After ${fmtDate(PROJECT.closes, { month: "short", day: "numeric" })}`,
  answered: () => "With the round 2 decision",
};

// R13 · Submission receipt.
export default function FeedbackReceipt() {
  const { ref } = useParams();
  const comment = useStore((s) => s.mine.find((c) => c.ref === ref));
  const triage = useStore((s) => s.triage);
  const published = useStore((s) => s.published);
  const following = useStore((s) => s.followed.includes(PROJECT.id));
  const [copied, setCopied] = useState(null);

  if (!comment) {
    return (
      <main id="main" tabIndex={-1} className="pt-flow">
        <div className="wrap pt-flow__wrap">
          <Empty
            level={1}
            icon="search"
            title="We couldn't find that receipt"
            action={<div className="row" style={{ flexWrap: "wrap", justifyContent: "center" }}><Link className="btn btn--accent" to="/me">See my comments</Link><Link className="btn btn--secondary" to="/projects/alder-8th/perspectives">Back to the comment map</Link></div>}
          >
            Reference <span className="t-mono">{ref}</span> isn't saved in this browser. Receipts in this demo live only on the device where the comment was written, and “Reset demo” clears them.
          </Empty>
        </div>
      </main>
    );
  }

  const { steps } = trackComment(comment, triage, published);
  const place = comment.locMode === "describe" ? "the place you described" : (comment.placeLabel || describePlace(comment.lngLat)).replace(/^./, (m) => m.toLowerCase());
  const toggleFollow = (on) => setState((s) => ({ followed: on ? [...new Set([...s.followed, PROJECT.id])] : s.followed.filter((id) => id !== PROJECT.id) }));

  const copy = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied("Receipt link copied"); }
    catch { setCopied("Couldn't copy — the link is in your address bar"); }
    setTimeout(() => setCopied(null), 2400);
  };

  return (
    <main id="main" tabIndex={-1} className="pt-flow pt-flow--tint">
      <div className="wrap pt-receipt">
        <header className="pt-receipt__head">
          <span className="pt-receipt__check" aria-hidden="true"><Icon name="check" /></span>
          <div className="stack" style={{ "--stack": "6px" }}>
            <h1 className="t-h1">Your comment is in</h1>
            <p className="t-body t-muted">
              Thank you. It's pinned to {place}, {comment.public ? `public as “${comment.author}”` : "private to the project team"}.
            </p>
          </div>
        </header>

        <section className="pt-refcard card" aria-label="Your reference">
          <div className="pt-refcard__main">
            <p className="t-eyebrow">Reference</p>
            <p className="pt-ref t-num">{comment.ref}</p>
            <p className="t-caption t-muted">Keep it to find your comment later. Fictional reference — this demo has no server.</p>
          </div>
          <div className="pt-refcard__side">
            <button type="button" className="btn btn--secondary" onClick={copy}><Icon name={copied?.startsWith("Receipt") ? "check" : "share"} />Copy receipt link</button>
            <p className="t-caption t-muted" aria-live="polite">{copied || "Works without an account"}</p>
          </div>
        </section>

        <div className="pt-receipt__grid">
          <section aria-labelledby="next-title" className="stack" style={{ "--stack": "16px" }}>
            <h2 id="next-title" className="t-h3">What happens next</h2>
            <ol className="timeline">
              {steps.map((s) => (
                <li key={s.id} className="timeline__item" data-status={s.status}>
                  <span className="timeline__dot" aria-hidden="true" />
                  <div className="stack" style={{ "--stack": "2px" }}>
                    <p className="t-caption t-muted">{WHEN[s.id](comment)}{s.status === "done" ? " · done" : s.status === "current" ? " · next" : ""}</p>
                    <p className="pt-method__title">{s.title}</p>
                    <p className="t-compact t-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="pt-note t-caption t-muted"><Icon name="info" />The team reads every comment but can't promise an individual reply. Each theme gets a public answer, and you'll see which theme yours joined. Timings are illustrative.</p>
          </section>

          <aside className="stack" style={{ "--stack": "16px" }} aria-label="Your comment">
            <div className="card pt-placecard">
              {comment.locMode !== "describe" && <MiniMap lngLat={comment.lngLat} />}
              <div className="pt-placecard__body stack" style={{ "--stack": "8px" }}>
                <div className="pt-badges">
                  <span className="badge badge--voice">{themeName(comment.theme)}</span>
                  <span className="badge badge--outline badge--plain">{comment.public ? "Public" : "Team only"}</span>
                </div>
                <p className="t-compact pt-clamp">“{comment.text}”</p>
                <Truth kind="yours" />
              </div>
            </div>

            <div className="card pt-follow">
              <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
                <Icon name="bell" className="pt-follow__icon" />
                <div className="stack" style={{ "--stack": "2px", flex: 1 }}>
                  <p id="follow-label" className="pt-method__title">Follow updates</p>
                  <p className="t-caption t-muted" id="follow-hint">Show new decisions for {PROJECT.place.short} in My comments. No email in this demo.</p>
                </div>
                <Switch checked={following} onChange={toggleFollow} labelledBy="follow-label" />
              </div>
            </div>
          </aside>
        </div>

        <div className="pt-receipt__actions">
          <Link className="btn btn--accent" to="/me"><Icon name="list" />My comments</Link>
          <Link className="btn btn--secondary" to={comment.public ? `/projects/alder-8th/perspectives?c=${comment.id}` : "/projects/alder-8th/perspectives"}><Icon name="map" />{comment.public ? "See it on the comment map" : "Community perspectives"}</Link>
        </div>
      </div>
    </main>
  );
}
