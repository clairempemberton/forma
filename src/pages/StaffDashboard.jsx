import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StaffShell from "../components/StaffShell.jsx";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { Truth, fmtDate } from "../components/ui.jsx";
import { DECISION, PROJECT, SURVEY, TIMELINE, CAMERA, EXISTING_FEATURES, PROJECT_BASE, COPY, cap, optName } from "../data/featured.js";
import {
  useStaffData, stages, currentStage, currentStep, daysUntil, weeklyCounts, moderationQueue, themeStats, publishChecks, metres,
} from "./staffData.js";
import "./staff.css";

// R20 · Staff overview: where the project is, what is due, and what needs a person next.
export default function StaffDashboard() {
  const data = useStaffData();
  const { comments, responses } = data;
  const navigate = useNavigate();

  const stage = currentStage();
  const step = currentStep();
  const days = daysUntil(PROJECT.closes);
  const opened = step?.date || TIMELINE[0].date;
  const total = Math.max(1, (new Date(`${PROJECT.closes}T12:00:00`) - new Date(`${opened}T12:00:00`)) / 86400000);
  const elapsed = Math.min(1, Math.max(0, 1 - days / total));

  const weeks = useMemo(() => weeklyCounts(comments), [comments]);
  const queue = useMemo(() => moderationQueue(comments), [comments]);
  const themes = useMemo(() => themeStats(comments), [comments]);
  const unanswered = themes.filter((t) => !(responses[t.id] || "").trim());
  const checks = publishChecks(data);

  // Where feedback concentrates: each comment counted once, at its nearest mapped feature.
  const hotspots = useMemo(() => {
    const n = Object.fromEntries(EXISTING_FEATURES.map((f) => [f.id, 0]));
    let elsewhere = 0;
    comments.filter((c) => c.status !== "hidden").forEach((c) => {
      const best = EXISTING_FEATURES.map((f) => [f, metres(c.lngLat, f.lngLat)]).sort((a, b) => a[1] - b[1])[0];
      if (best[1] <= 15) n[best[0].id]++; else elsewhere++;
    });
    return { list: EXISTING_FEATURES.map((f) => ({ ...f, n: n[f.id] })).filter((f) => f.n > 0).sort((a, b) => b.n - a.n), elsewhere };
  }, [comments]);
  const [hot, setHot] = useState(null);
  const camera = useMemo(() => (hot ? { center: hot.lngLat, zoom: 19.4, bearing: 0, pitch: 0 } : null), [hot]);
  const markers = useMemo(() => comments.filter((c) => c.status !== "hidden").map((c) => ({
    id: c.id, kind: "comment", lngLat: c.lngLat, label: c.text, mine: !!c.mine, ariaLabel: `${c.ref}: ${c.text}`,
  })), [comments]);

  return (
    <StaffShell
      title={PROJECT.title}
      actions={<>
        <Link className="btn btn--secondary" to={`${PROJECT_BASE}`}><Icon name="eye" />View public page</Link>
        <Link className="btn btn--primary" to="/staff/triage"><Icon name="inbox" />Open feedback</Link>
      </>}
    >
      <div className="staff-grid">
        {/* Stage */}
        <section className="staff-card sd-card sf-span-5" aria-labelledby="sd-stage">
          <div className="sd-card__head"><h2 id="sd-stage">Stage</h2><span className="t-caption t-muted">{PROJECT.round}</span></div>
          <ol className="sd-stages" aria-label="Project stages">
            {stages().map((s, i) => (
              <li key={s} data-state={i < stage ? "done" : i === stage ? "current" : "todo"} aria-current={i === stage ? "step" : undefined}>
                <span className="sd-stages__bar" aria-hidden="true" />
                <span className="sd-stages__label">{s}</span>
              </li>
            ))}
          </ol>
          <p className="t-compact">
            {step ? <>{step.title} in <strong>{fmtDate(step.date, { month: "short", year: "numeric" })}</strong>. </> : null}
            This workspace replays {COPY.round} ({SURVEY.window}) with sample comments. The real project is {PROJECT.status.toLowerCase()}.
          </p>
          <Link className="link t-compact" to="/staff/revisions">Review the refinements to {optName(DECISION.chosen)}<Icon name="arrowRight" /></Link>
        </section>

        {/* Next deadline */}
        <section className="staff-card sd-card sf-span-3" aria-labelledby="sd-deadline">
          <div className="sd-card__head"><h2 id="sd-deadline">Next deadline</h2></div>
          <p className="sd-big t-num">{days > 0 ? <>{days} <span>day{days === 1 ? "" : "s"}</span></> : days === 0 ? "Today" : "Closed"}</p>
          <p className="t-compact t-muted">{cap(COPY.round)} {days >= 0 ? "closes" : "closed"} {fmtDate(PROJECT.closes, { month: "short", day: "numeric", year: "numeric" })}. In this replay, triage stays open.</p>
          <div className="sd-progress" role="img" aria-label={`${Math.round(elapsed * 100)}% of the comment period has passed`}><span style={{ width: `${elapsed * 100}%` }} /></div>
          <p className="t-caption t-muted">{themes.length - unanswered.length} of {themes.length} themes have a draft response</p>
        </section>

        {/* Submissions per week */}
        <section className="staff-card sd-card sf-span-4" aria-labelledby="sd-weekly">
          <div className="sd-card__head"><h2 id="sd-weekly">Comments per week</h2><span className="t-caption t-muted">{comments.length} total · weeks from Monday</span></div>
          <WeeklyChart weeks={weeks} />
          <div className="row sd-foot"><Truth kind="sample" /></div>
        </section>

        {/* Moderation queue */}
        <section className="staff-card sd-card sf-span-5" aria-labelledby="sd-queue">
          <div className="sd-card__head">
            <h2 id="sd-queue">Moderation queue</h2>
            <span className={`badge ${queue.length ? "badge--warning" : "badge--positive"}`}>{queue.length ? `${queue.length} waiting` : "Clear"}</span>
          </div>
          {queue.length ? (
            <ul className="sd-list">
              {queue.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <span className={`sd-ico ${c.flags.some((f) => f.pii) ? "sd-ico--warn" : ""}`} aria-hidden="true"><Icon name={c.flags[0].icon} /></span>
                  <span className="sd-list__main">
                    <span className="sd-list__title">{c.flags.map((f) => f.label).join(" · ")}</span>
                    <span className="t-caption t-muted"><span className="t-mono">{c.ref}</span> · “{c.text.length > 54 ? `${c.text.slice(0, 54)}…` : c.text}”</span>
                  </span>
                  <Link className="btn btn--ghost btn--sm" to={`/staff/triage?c=${c.id}`} aria-label={`Review ${c.ref}`}>Review</Link>
                </li>
              ))}
            </ul>
          ) : <p className="t-compact t-muted">Nothing flagged. Every comment that matched a rule has been given a status.</p>}
          <p className="t-caption t-muted sd-foot">Flagged automatically for phone numbers, email addresses, links, capitals, very short text and near-duplicates at the same spot.</p>
        </section>

        {/* Themes without a response */}
        <section className="staff-card sd-card sf-span-3" aria-labelledby="sd-themes">
          <div className="sd-card__head">
            <h2 id="sd-themes">Themes without a response</h2>
            <span className="badge badge--outline badge--plain t-num">{unanswered.length} of {themes.length}</span>
          </div>
          {unanswered.length ? (
            <ul className="sd-themes">
              {unanswered.slice(0, 3).map((t) => (
                <li key={t.id}>
                  <Link to={`/staff/themes?t=${t.id}`} className="sd-theme">
                    <span className="sd-theme__name">{t.name}</span>
                    <span className="t-num t-compact">{t.live}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="t-compact t-muted">Every theme has a draft response.</p>}
          <Link className="link t-compact sd-foot" to="/staff/themes">Open theme analysis<Icon name="arrowRight" /></Link>
        </section>

        {/* Before publishing */}
        <section className="staff-card sd-card sf-span-4" aria-labelledby="sd-checks">
          <div className="sd-card__head"><h2 id="sd-checks">Before publishing</h2><span className="t-caption t-muted">{checks.filter((c) => c.ok).length} of {checks.length}</span></div>
          <ul className="sd-checks">
            {checks.map((c) => (
              <li key={c.id}>
                <span className={`sd-tick ${c.ok ? "is-ok" : ""}`} aria-hidden="true">{c.ok && <Icon name="check" />}</span>
                <span className="sd-list__main">
                  <span className="sd-list__title">{c.title}<span className="sr-only">{c.ok ? " — done" : " — not yet"}</span></span>
                  <span className="t-caption t-muted">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link className="link t-compact sd-foot" to="/staff/publish">Go to Publish &amp; QA<Icon name="arrowRight" /></Link>
        </section>

        {/* Geographic overview */}
        <section className="staff-card sd-card sd-mapcard sf-span-12" aria-labelledby="sd-map">
          <div className="sd-mapcard__side">
            <div className="sd-card__head"><h2 id="sd-map">Where feedback is</h2></div>
            <p className="t-compact t-muted">Each comment counted at its nearest mapped feature, up to 15 m away. Select a row to centre the map.</p>
            <ul className="rows">
              {hotspots.list.slice(0, 5).map((f) => (
                <li key={f.id}>
                  <button type="button" className="rowbtn" aria-pressed={hot?.id === f.id} onClick={() => setHot(hot?.id === f.id ? null : f)}>
                    <span className="fid">{f.id}</span>
                    <span className="rowbtn__main"><span className="rowbtn__title">{f.name}</span></span>
                    <span className="t-num t-compact">{f.n}</span>
                  </button>
                </li>
              ))}
            </ul>
            {hotspots.elsewhere > 0 && <p className="t-caption t-muted">{hotspots.elsewhere} more are further than 15 m from any mapped feature.</p>}
            <div className="sd-foot"><Truth kind="sample" /></div>
          </div>
          <div className="sd-map">
            <MapView
              initialCamera={{ ...CAMERA.overview, zoom: 17.9 }}
              camera={camera}
              markers={markers}
              modeSwitch={false}
              hud={false}
              onMarkerClick={(m) => { if (m.kind !== "cluster") navigate(`/staff/triage?c=${m.id}`); else setHot({ id: m.id, lngLat: m.lngLat }); }}
              ariaLabel="Map of where comments were left"
            />
          </div>
        </section>
      </div>
    </StaffShell>
  );
}

// Weekly counts as simple bars. Single y-axis, labelled values, a table for screen readers.
function WeeklyChart({ weeks }) {
  const max = Math.max(1, ...weeks.map((w) => w.sample + w.yours));
  const hasYours = weeks.some((w) => w.yours);
  const label = (iso) => fmtDate(iso, { month: "short", day: "numeric" });
  return (
    <figure className="sd-chart">
      <div className="sd-chart__plot" aria-hidden="true">
        {weeks.map((w) => {
          const n = w.sample + w.yours;
          return (
            <div key={w.week} className="sd-chart__col" title={`Week of ${label(w.week)}: ${n} comment${n === 1 ? "" : "s"}`}>
              <span className="sd-chart__val t-num">{n || ""}</span>
              <span className="sd-chart__bar" style={{ height: `${(n / max) * 100}%` }}>
                {w.yours > 0 && <span className="sd-chart__mine" style={{ height: `${(w.yours / n) * 100}%` }} />}
              </span>
              <span className="sd-chart__x">{label(w.week)}</span>
            </div>
          );
        })}
      </div>
      {hasYours && <figcaption className="sd-chart__key t-caption t-muted"><span className="sd-chart__sw" />Sample <span className="sd-chart__sw sd-chart__sw--mine" />Sent from this browser</figcaption>}
      <table className="sr-only">
        <caption>Comments per week, by week starting</caption>
        <thead><tr><th>Week of</th><th>Comments</th></tr></thead>
        <tbody>{weeks.map((w) => <tr key={w.week}><td>{label(w.week)}</td><td>{w.sample + w.yours}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
