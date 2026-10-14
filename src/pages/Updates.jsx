import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { StatusBadge, Truth, fmtDate } from "../components/ui.jsx";
import { DECISION, PROJECT, REVISION_CHANGES, TIMELINE, VERSIONS } from "../data/alder.js";
import { setState, useStore } from "../lib/store.js";
import "./outcomes.css";

// Where each timeline entry leads.
const LINKS = {
  "Project announced": { to: "..", label: "Project overview", icon: "doc" },
  "Round 1 opened": { to: "../compare", label: "The three options", icon: "layers" },
  "Round 1 closed": { to: "../themes", label: "What we heard", icon: "comment" },
  "Round 1 decision": { to: "../decision", label: "Decision report", icon: "doc" },
  "Round 2 opened": { to: "../revision", label: "What changed in version 2", icon: "swap" },
  "Round 2 closes": { to: "../feedback", label: "Comment on version 2", icon: "pin" },
};

const STATE = {
  done: { label: "Done", tone: "neutral" },
  current: { label: "Happening now", tone: "accent" },
  upcoming: { label: "Planned", tone: "neutral" },
};

const ITEMS = [...TIMELINE].reverse();
const LAST = [...TIMELINE].filter((t) => t.status !== "upcoming").pop();
const CURRENT = TIMELINE.find((t) => t.status === "current");
const UPCOMING = TIMELINE.filter((t) => t.status === "upcoming");

const toggleFollow = (id) => setState((s) => ({ followed: s.followed.includes(id) ? s.followed.filter((x) => x !== id) : [...s.followed, id] }));

// R18 · Updates — the public timeline of the project.
export default function Updates() {
  const following = useStore((s) => s.followed.includes(PROJECT.id));

  return (
    <main id="main" tabIndex={-1} className="upd">
      <div className="wrap page page--tight upd__layout">
        <div className="upd__main">
          <header className="stack" style={{ "--stack": "12px" }}>
            <p className="t-eyebrow">Updates</p>
            <h1 className="t-h1">Everything that has happened, in order</h1>
            <p className="upd__updated t-compact t-muted"><Icon name="clock" />Last updated {fmtDate(LAST.date)}. Updates are posted by the project team, not generated live.</p>
          </header>

          <ol className="upd__tl" aria-label="Project timeline, newest first">
            {ITEMS.map((t) => {
              const link = LINKS[t.title];
              const st = STATE[t.status];
              return (
                <li key={t.title} className="upd__item" data-status={t.status}>
                  <span className="upd__node" aria-hidden="true" />
                  <article className="upd__card" aria-labelledby={`upd-${t.date}`}>
                    <div className="upd__card-meta">
                      <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                      <time className="t-caption t-muted t-num" dateTime={t.date}>{fmtDate(t.date)}</time>
                    </div>
                    <h2 id={`upd-${t.date}`} className="upd__card-title">{t.title}</h2>
                    <p className="t-compact t-muted">{t.body}</p>
                    {link && (
                      <Link className="link upd__card-link" to={link.to}><Icon name={link.icon} />{link.label}<Icon name="arrowRight" /></Link>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
          <p className="upd__foot"><Truth kind="illustrative">Dates and events belong to a fictional project</Truth></p>
        </div>

        <aside className="upd__aside" aria-label="Follow and what's next">
          <section className="card card--pad upd__follow" aria-labelledby="upd-follow-h">
            <h2 id="upd-follow-h" className="t-h3">Follow this project</h2>
            <p className="t-compact t-muted">Get a notice in Forma when something on this page changes. Nothing else.</p>
            <button type="button" className={`btn btn--block ${following ? "btn--secondary" : "btn--accent"}`} aria-pressed={following} onClick={() => toggleFollow(PROJECT.id)}>
              <Icon name={following ? "check" : "bell"} />{following ? "Following" : "Follow updates"}
            </button>
            <p className="t-caption t-muted" aria-live="polite">{following ? "You're following Alder & 8th. Select again to stop." : "You're not following this project."}</p>
            <Truth kind="yours">Demo: saved in this browser only, no messages are sent</Truth>
          </section>

          <section className="card card--pad upd__next" aria-labelledby="upd-next-h">
            <p className="t-eyebrow">What's next</p>
            <h2 id="upd-next-h" className="t-h3">Comments are open on version 2 until {fmtDate(UPCOMING[0].date, { month: "short", day: "numeric" })}</h2>
            <p className="t-compact t-muted">{CURRENT.title} on {fmtDate(CURRENT.date, { month: "short", day: "numeric" })}: {CURRENT.body.charAt(0).toLowerCase() + CURRENT.body.slice(1)} {DECISION.status} on {fmtDate(DECISION.date, { month: "short", day: "numeric" })}.</p>
            <ul className="upd__next-list">
              {UPCOMING.map((u) => (
                <li key={u.title}><span className="t-num">{fmtDate(u.date, { month: "short", day: "numeric", year: "numeric" })}</span><span>{u.title}</span></li>
              ))}
            </ul>
            <Link className="btn btn--primary btn--block" to="../feedback"><Icon name="pin" />Comment on version 2</Link>
          </section>

          <section className="card card--pad upd__versions" aria-labelledby="upd-ver-h">
            <h2 id="upd-ver-h" className="t-h3">Proposal version history</h2>
            <ol>
              {[...VERSIONS].reverse().map((v, i) => (
                <li key={v.id}>
                  <Link to="../revision" className="upd__ver">
                    <span className="upd__ver-id">{v.id}</span>
                    <span className="upd__ver-main">
                      <span className="upd__ver-title">Option C · {v.label}{i === 0 && <span className="badge badge--accent">Current</span>}</span>
                      <span className="t-caption t-muted">{fmtDate(v.date)} · {v.note}{i === 0 && ` ${REVISION_CHANGES.filter((c) => c.status === "changed").length} changes.`}</span>
                    </span>
                    <Icon name="chevronRight" />
                  </Link>
                </li>
              ))}
            </ol>
            <Link className="link" to="../revision">Compare version 1 and version 2<Icon name="arrowRight" /></Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
