import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StaffShell from "../components/StaffShell.jsx";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { Truth, fmtDate } from "../components/ui.jsx";
import { CAMERA, DECISION, VERSIONS, PROJECT, optName, optTag } from "../data/featured.js";
import { useParam } from "../lib/useMapMode.js";
import { useStaffData, themeStats, setResponse, OPTIONS, centreOf, cameraFor, metres, StatusPill } from "./staffData.js";
import "./staff.css";

// R22 · Theme analysis: what each theme says, where, for which alternative, and the public answer.
export default function StaffThemes() {
  const { comments, responses } = useStaffData();
  const stats = useMemo(() => themeStats(comments), [comments]);
  const [tid, setTid] = useParam("t", stats[0].id);
  const theme = stats.find((t) => t.id === tid) || stats[0];
  const max = Math.max(1, ...stats.map((t) => t.live));
  const unthemed = comments.filter((c) => !c.themeEff && c.status !== "hidden").length;

  const camera = useMemo(() => cameraFor(theme.list, 19.6), [theme]);
  const markers = useMemo(() => theme.list.map((c) => ({
    id: c.id, kind: "comment", lngLat: c.lngLat, label: c.text, mine: !!c.mine, ariaLabel: `${c.ref}: ${c.text}`,
  })), [theme]);

  return (
    <StaffShell title="Themes" actions={<Truth kind="sample">Counts are live from sample comments and your triage</Truth>}>
      <div className="sth">
        <nav className="staff-card sth-list" aria-label="Themes">
          <div className="sd-card__head"><h2 className="sf-sub">{stats.length} themes</h2><span className="t-caption t-muted">Comments</span></div>
          <ul>
            {stats.map((t) => {
              const answered = !!(responses[t.id] || "").trim();
              return (
                <li key={t.id}>
                  <button type="button" className="sth-item" aria-current={t.id === theme.id ? "true" : undefined} onClick={() => setTid(t.id)}>
                    <span className="sth-item__top">
                      <span className="sth-item__name">{t.name}</span>
                      <span className="t-num sth-item__n">{t.live}</span>
                    </span>
                    <span className="sth-item__bar" aria-hidden="true"><span style={{ width: `${(t.live / max) * 100}%` }} /></span>
                    <span className={`sth-item__state ${answered ? "is-ok" : ""}`}>{answered ? <><Icon name="check" />Response drafted</> : "No response yet"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {unthemed > 0 && <Link className="link t-compact sth-unthemed" to="/staff/triage">{unthemed} comment{unthemed === 1 ? "" : "s"} without a theme<Icon name="arrowRight" /></Link>}
        </nav>

        <div className="sf-mapbox sth-map">
          <MapView
            initialCamera={{ ...CAMERA.overview, zoom: 18.2 }}
            camera={camera}
            markers={markers}
            proposal={VERSIONS[0].geojson}
            modeSwitch={false}
            hud={false}
            ariaLabel={`Map of comments in the theme ${theme.name}`}
          />
          <div className="sth-maptag glass" aria-live="polite">
            <span className="sf-label">{theme.name}</span>
            <span className="t-caption t-muted">{theme.list.length} pins over {optName(DECISION.chosen)} as rated in {VERSIONS[0].label.toLowerCase()} · exact locations, staff only</span>
          </div>
        </div>

        <ThemeDetail key={theme.id} theme={theme} response={responses[theme.id] || ""} />
      </div>
    </StaffShell>
  );
}

function ThemeDetail({ theme, response }) {
  const [draft, setDraft] = useState(response);
  const [saved, setSaved] = useState("");
  const dirty = draft !== response;
  const save = () => { setResponse(theme.id, draft.trim()); setSaved(draft.trim() ? "Draft response saved in this browser" : "Response cleared"); };
  const total = theme.list.length;
  const reassigned = theme.list.filter((c) => c.themeChanged).length;
  const mine = theme.list.filter((c) => c.mine).length;

  // Representative: the comment closest to the centre of the theme's pins, then the next
  // closest one that names a different alternative (or none), as a counterpoint.
  const reps = useMemo(() => {
    const c = centreOf(theme.list);
    if (!c) return [];
    const ranked = [...theme.list].filter((x) => x.public).sort((a, b) => metres(a.lngLat, c) - metres(b.lngLat, c));
    const first = ranked[0];
    const second = ranked.find((x) => x !== first && (x.option !== first.option || x.sentiment !== first.sentiment));
    return [first && { c: first, why: "Closest to the centre of this theme's pins" }, second && { c: second, why: second.option !== first.option ? `A different view: ${second.option ? `Alternative ${second.option}` : "no alternative named"}` : "A different tone" }].filter(Boolean);
  }, [theme]);

  const options = [...OPTIONS.map((o) => ({ id: o.id, label: optTag(o.id) })), { id: "none", label: "None named" }];

  return (
    <section className="staff-card sth-detail" aria-labelledby="sth-h">
      <div>
        <h2 id="sth-h" className="t-h3">{theme.name}</h2>
        <p className="t-caption t-muted">
          {total} comment{total === 1 ? "" : "s"}{reassigned ? ` · ${reassigned} reassigned by staff` : ""}{mine ? ` · ${mine} from this browser` : ""} · sample total {theme.count}
        </p>
      </div>

      <div className="sth-block">
        <h3 className="sf-label">Which alternative comments name</h3>
        <div className="sth-bars">
          {options.map((o) => {
            const n = theme.byOption[o.id] || 0;
            return (
              <div key={o.id} className="sf-hbar">
                <span>{o.label}</span>
                <span className="sf-hbar__track"><span className="sf-hbar__fill" style={{ width: `${total ? (n / total) * 100 : 0}%` }} /></span>
                <span className="sf-hbar__n">{n}</span>
              </div>
            );
          })}
        </div>
        <p className="t-caption t-muted">Most comments don't name an alternative; read them as concerns about the place, not votes.</p>
      </div>

      <div className="sth-block">
        <div className="sth-resp-head">
          <label className="sf-label" htmlFor="sth-resp">Draft public response</label>
          {!draft && theme.response && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDraft(theme.response)}><Icon name="history" />Start from {PROJECT.agency}'s answer</button>
          )}
        </div>
        <textarea id="sth-resp" className="textarea sth-response" value={draft} onChange={(e) => { setDraft(e.target.value); setSaved(""); }} placeholder="What the team heard and what it will do about it. Plain language; no names." />
        <div className="sth-resp-row">
          <span className="t-caption t-muted t-num">{draft.length} characters</span>
          <div className="spacer" />
          <button type="button" className="btn btn--primary btn--sm" onClick={save} disabled={!dirty}>Save draft</button>
        </div>
        <p className="sf-saved" role="status" aria-live="polite">{saved && <><Icon name="check" />{saved}</>}{!saved && dirty && <span className="t-muted">Unsaved changes</span>}</p>
      </div>

      <div className="sth-block">
        <h3 className="sf-label">Representative comments</h3>
        {reps.length ? reps.map(({ c, why }) => (
          <figure key={c.id} className="sf-quote">
            <blockquote>“{c.text}”</blockquote>
            <figcaption className="sf-quote__meta"><Link className="t-mono link" to={`/staff/triage?c=${c.id}`}>{c.ref}</Link><span>{why}</span></figcaption>
          </figure>
        )) : <p className="t-compact t-muted">No public comments in this theme yet.</p>}
      </div>

      <details className="sth-all">
        <summary className="t-compact">All {total} comments in this theme</summary>
        <ul className="rows">
          {theme.list.map((c) => (
            <li key={c.id}>
              <Link className="rowbtn" to={`/staff/triage?c=${c.id}`}>
                <span className="t-mono t-caption">{c.ref}</span>
                <span className="rowbtn__main"><span className="t-compact">{c.text}</span><span className="rowbtn__sub">{fmtDate(c.date, { month: "short", day: "numeric" })}{c.option ? ` · Alt ${c.option}` : ""}</span></span>
                <StatusPill id={c.status} />
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
