import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { StatusBadge, Truth, fmtDate } from "../components/ui.jsx";
import { COPY, DECISION, PROJECT, REVISION_CHANGES, SURVEY, TIMELINE, VERSIONS, cap, optName } from "../data/featured.js";
import { setState, useStore } from "../lib/store.js";
import "./outcomes.css";

// Where each timeline entry leads: COPY.timelineLinks, keyed by entry title.

const STATE = {
  done: { label: "Done", tone: "neutral" },
  current: { label: "Coming next", tone: "accent" },
  upcoming: { label: "Planned", tone: "neutral" },
};
// Timeline dates are approximate within the month, so they are shown as month and year.
const MONTH = { month: "short", year: "numeric" };


const toggleFollow = (id) => setState((s) => ({ followed: s.followed.includes(id) ? s.followed.filter((x) => x !== id) : [...s.followed, id] }));

// R18 · Updates — the project timeline, from the agency's reports.
export default function Updates() {
  const LINKS = COPY.timelineLinks;
  const ITEMS = [...TIMELINE].reverse();
  const LAST = [...TIMELINE].filter((t) => t.status === "done").pop();
  const CURRENT = TIMELINE.find((t) => t.status === "current");
  const UPCOMING = TIMELINE.filter((t) => t.status === "upcoming");
  const following = useStore((s) => s.followed.includes(PROJECT.id));

  return (
    <main id="main" tabIndex={-1} className="upd">
      <div className="wrap page page--tight upd__layout">
        <div className="upd__main">
          <header className="stack" style={{ "--stack": "12px" }}>
            <p className="t-eyebrow">Updates</p>
            <h1 className="t-h1">Everything that has happened, in order</h1>
            <p className="upd__updated t-compact t-muted"><Icon name="clock" />Latest: {LAST.title.toLowerCase()}, {fmtDate(LAST.date, MONTH)}. Events summarise {PROJECT.agency}'s reports and project page; days within a month are approximate.</p>
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
                      <time className="t-caption t-muted t-num" dateTime={t.date.slice(0, 7)}>{fmtDate(t.date, MONTH)}</time>
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
          <p className="upd__foot"><Truth kind="source">Source: {PROJECT.agency} · <a className="link" href={PROJECT.url} target="_blank" rel="noreferrer">project page<span className="sr-only"> (opens in a new tab)</span></a></Truth></p>
        </div>

        <aside className="upd__aside" aria-label="Follow and what's next">
          <section className="card card--pad upd__follow" aria-labelledby="upd-follow-h">
            <h2 id="upd-follow-h" className="t-h3">Follow this project</h2>
            <p className="t-compact t-muted">Get a notice in Forma when something on this page changes. Nothing else.</p>
            <button type="button" className={`btn btn--block ${following ? "btn--secondary" : "btn--accent"}`} aria-pressed={following} onClick={() => toggleFollow(PROJECT.id)}>
              <Icon name={following ? "check" : "bell"} />{following ? "Following" : "Follow updates"}
            </button>
            <p className="t-caption t-muted" aria-live="polite">{following ? `You're following ${COPY.placeShort}. Select again to stop.` : "You're not following this project."}</p>
            <Truth kind="yours">Demo: saved in this browser only, no messages are sent</Truth>
          </section>

          <section className="card card--pad upd__next" aria-labelledby="upd-next-h">
            <p className="t-eyebrow">What's next</p>
            <h2 id="upd-next-h" className="t-h3">{CURRENT ? `${CURRENT.title} · ${fmtDate(CURRENT.date, MONTH)}` : "The project is complete"}</h2>
            {CURRENT && <p className="t-compact t-muted">{CURRENT.body}</p>}
            {UPCOMING.length > 0 && (
              <ul className="upd__next-list">
                {UPCOMING.map((u) => (
                  <li key={u.title}><span className="t-num">{fmtDate(u.date, MONTH)}</span><span>{u.title}</span></li>
                ))}
              </ul>
            )}
            <p className="t-compact t-muted">{cap(COPY.round)} closed long ago, but you can replay it: try commenting as if it were {SURVEY.window}.</p>
            <Link className="btn btn--primary btn--block" to="../feedback"><Icon name="pin" />Replay {COPY.round}</Link>
          </section>

          <section className="card card--pad upd__versions" aria-labelledby="upd-ver-h">
            <h2 id="upd-ver-h" className="t-h3">{optName(DECISION.chosen)}, version history</h2>
            <ol>
              {[...VERSIONS].reverse().map((v) => (
                <li key={v.id}>
                  <Link to="../revision" className="upd__ver">
                    <span className="upd__ver-id">{v.id}</span>
                    <span className="upd__ver-main">
                      <span className="upd__ver-title">{optName(DECISION.chosen)} · {v.label}{v.id === DECISION.version && <span className="badge badge--accent">Chosen</span>}</span>
                      <span className="t-caption t-muted">{fmtDate(v.date, MONTH)} · {v.note}{v.id === DECISION.version && ` ${REVISION_CHANGES.filter((c) => c.status === "changed").length} changes.`}</span>
                    </span>
                    <Icon name="chevronRight" />
                  </Link>
                </li>
              ))}
            </ol>
            <Link className="link" to="../revision">Compare the {VERSIONS.map((v) => v.label.toLowerCase()).join(" and ")} versions<Icon name="arrowRight" /></Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
