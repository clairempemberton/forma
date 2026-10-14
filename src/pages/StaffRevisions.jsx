import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StaffShell from "../components/StaffShell.jsx";
import CompareMap from "../map/CompareMap.jsx";
import Icon from "../components/Icon.jsx";
import { Truth, fmtDate } from "../components/ui.jsx";
import { VERSIONS, REVISION_CHANGES, THEMES, THEME_BY_ID, CAMERA } from "../data/alder.js";
import { useParam } from "../lib/useMapMode.js";
import { useStaffData, evidenceFor, NEAR_M, DECISIONS, DECISION_BY_ID, setThemeDecision } from "./staffData.js";
import "./staff.css";

const [V1, V2] = VERSIONS;
const MAP_STATUS = { changed: { label: "Changed in v2", cls: "badge--accent" }, "not-changed": { label: "Not changed", cls: "badge--outline" } };

// R23 · Revision mapping: each change between v1 and v2, the themes and comments behind it,
// and the team's decision on every theme.
export default function StaffRevisions() {
  const { comments, decisions } = useStaffData();
  const [cid, setCid] = useParam("rc", REVISION_CHANGES[0].id);
  const change = REVISION_CHANGES.find((r) => r.id === cid) || REVISION_CHANGES[0];
  const [pos, setPos] = useState(50);

  const evidence = useMemo(() => Object.fromEntries(REVISION_CHANGES.map((r) => [r.id, evidenceFor(r, comments)])), [comments]);
  const ev = evidence[change.id];
  const near = ev.filter((c) => c.dist <= NEAR_M);

  const markers = useMemo(() => [
    ...REVISION_CHANGES.map((r, i) => ({ id: r.id, kind: "change", index: i + 1, lngLat: r.lngLat, label: r.title, selected: r.id === change.id, dim: r.id !== change.id, ariaLabel: `Change ${i + 1}: ${r.title}` })),
    ...near.map((c) => ({ id: c.id, kind: "comment", lngLat: c.lngLat, label: c.text, ariaLabel: `${c.ref}: ${c.text}` })),
  ], [change, near]);

  // Fly the compare view to the selected change (skipped on first render so the overview shows).
  const [camera, setCamera] = useState(null);
  const pick = (id) => { setCid(id); const r = REVISION_CHANGES.find((x) => x.id === id); if (r) setCamera({ center: r.lngLat, zoom: 19.3, bearing: 0, pitch: 0 }); };

  const unlinked = THEMES.filter((t) => !REVISION_CHANGES.some((r) => r.themes.includes(t.id)));
  const idx = REVISION_CHANGES.indexOf(change);

  return (
    <StaffShell title="Revisions" actions={<Truth kind="illustrative" />}>
      <div className="sr">
        <nav className="staff-card sr-list" aria-label="Changes from version 1 to version 2">
          <div>
            <h2 className="sf-sub">{V1.label} → {V2.label}</h2>
            <p className="t-caption t-muted">{fmtDate(V1.date, { month: "short", day: "numeric" })} → {fmtDate(V2.date, { month: "short", day: "numeric" })} · Option C</p>
          </div>
          <ol>
            {REVISION_CHANGES.map((r, i) => (
              <li key={r.id}>
                <button type="button" className="sr-item" aria-current={r.id === change.id ? "true" : undefined} onClick={() => pick(r.id)}>
                  <span className={`sr-num ${r.status === "changed" ? "" : "sr-num--off"}`}>{i + 1}</span>
                  <span className="sr-item__main">
                    <span className="sr-item__title">{r.title}</span>
                    <span className={`badge badge--plain ${MAP_STATUS[r.status].cls}`}>{MAP_STATUS[r.status].label}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <div className="sf-mapbox sr-map">
          <CompareMap
            left={{ label: `${V1.label} · ${fmtDate(V1.date, { month: "short", day: "numeric" })}`, proposal: V1.geojson, markers }}
            right={{ label: `${V2.label} · ${fmtDate(V2.date, { month: "short", day: "numeric" })}`, proposal: V2.geojson }}
            initialCamera={{ ...CAMERA.home, zoom: 18.3 }}
            position={pos}
            onPosition={setPos}
            markers={markers}
            onMarkerClick={(m) => { if (m.kind === "change") pick(m.id); }}
            camera={camera}
            label="Compare version 1 and version 2"
          />
        </div>

        <section className="staff-card sr-detail" aria-labelledby="sr-h" aria-live="polite">
          <div className="row" style={{ alignItems: "flex-start" }}>
            <span className="sr-num sr-num--lg">{idx + 1}</span>
            <div>
              <h2 id="sr-h" className="t-h3">{change.title}</h2>
              <span className={`badge badge--plain ${MAP_STATUS[change.status].cls}`}>{MAP_STATUS[change.status].label}</span>
            </div>
          </div>
          <dl className="sr-ba">
            <div><dt className="sf-label">{V1.label}</dt><dd>{change.before}</dd></div>
            <div><dt className="sf-label">{V2.label}</dt><dd>{change.after}</dd></div>
          </dl>

          <div className="sth-block">
            <h3 className="sf-label">Comments behind this change</h3>
            <p className="t-caption t-muted">Same theme and within {NEAR_M} m of the change: {near.length} of {ev.length}.</p>
            {near.length ? (
              <ul className="rows">
                {near.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link className="rowbtn sr-ev" to={`/staff/triage?c=${c.id}`}>
                      <span className="t-mono t-caption">{c.ref}</span>
                      <span className="rowbtn__main"><span className="t-compact">{c.text}</span></span>
                      <span className="t-caption t-muted t-num">{Math.round(c.dist)} m</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="t-compact t-muted">No comments in this theme sit near this change; it answers the theme as a whole.</p>}
          </div>

          {change.themes.map((id) => <DecisionEditor key={id} theme={THEME_BY_ID[id]} value={decisions[id]} count={comments.filter((c) => c.themeEff === id && c.status !== "hidden").length} />)}
        </section>

        <section className="staff-card sr-track" aria-labelledby="sr-track-h">
          <div className="sd-card__head">
            <h2 id="sr-track-h">Revision tracking</h2>
            <span className="t-caption t-muted">{THEMES.filter((t) => decisions[t.id]?.status).length} of {THEMES.length} themes decided</span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>#</th><th>Change</th><th className="sr-col-ba">{V1.label} → {V2.label}</th><th>Theme</th><th>Comments</th><th>Decision</th></tr>
              </thead>
              <tbody>
                {REVISION_CHANGES.map((r, i) => {
                  const e = evidence[r.id];
                  return (
                    <tr key={r.id} aria-selected={r.id === change.id}>
                      <td><span className={`sr-num ${r.status === "changed" ? "" : "sr-num--off"}`}>{i + 1}</span></td>
                      <td><button type="button" className="link" onClick={() => pick(r.id)}>{r.title}</button><br /><span className={`badge badge--plain ${MAP_STATUS[r.status].cls}`}>{MAP_STATUS[r.status].label}</span></td>
                      <td className="sr-track__ba sr-col-ba"><span className="t-muted">{r.before}</span><Icon name="arrowRight" /><span>{r.after}</span></td>
                      <td>{r.themes.map((id) => THEME_BY_ID[id].name).join(", ")}</td>
                      <td className="t-num">{e.filter((c) => c.dist <= NEAR_M).length} near · {e.length} in theme</td>
                      <td>{r.themes.map((id) => <DecisionBadge key={id} d={decisions[id]} />)}</td>
                    </tr>
                  );
                })}
                {unlinked.map((t) => (
                  <tr key={t.id}>
                    <td><span className="sr-num sr-num--off">–</span></td>
                    <td><span className="t-muted">No mapped change</span></td>
                    <td className="t-muted sr-col-ba">—</td>
                    <td>{t.name}</td>
                    <td className="t-num">{comments.filter((c) => c.themeEff === t.id && c.status !== "hidden").length} in theme</td>
                    <td><DecisionBadge d={decisions[t.id]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {unlinked.length > 0 && (
            <div className="sr-unlinked">
              <p className="sf-sub">Themes without a mapped change</p>
              <p className="t-caption t-muted">Record a decision here so the public page can say what happened to them.</p>
              <div className="sr-unlinked__grid">
                {unlinked.map((t) => <DecisionEditor key={t.id} theme={t} value={decisions[t.id]} count={comments.filter((c) => c.themeEff === t.id && c.status !== "hidden").length} />)}
              </div>
            </div>
          )}
        </section>
      </div>
    </StaffShell>
  );
}

function DecisionBadge({ d }) {
  if (!d?.status) return <span className="badge badge--warning badge--plain">Not decided</span>;
  const x = DECISION_BY_ID[d.status];
  return <span className={`badge ${x.tone === "positive" ? "badge--positive" : x.tone === "accent" ? "badge--accent" : ""}`}>{x.label}</span>;
}

function DecisionEditor({ theme, value = {}, count }) {
  const [reason, setReason] = useState(value.reason || "");
  const [msg, setMsg] = useState("");
  const name = `sr-dec-${theme.id}`;
  return (
    <fieldset className="sth-block sr-dec">
      <legend className="sr-dec__legend"><span className="sf-label">Decision on theme</span><span className="sr-dec__theme">{theme.name} <span className="t-muted t-num">· {count}</span></span></legend>
      <div className="seg sr-seg" role="radiogroup" aria-label={`Decision on ${theme.name}`}>
        {DECISIONS.map((d) => (
          <button key={d.id} type="button" role="radio" aria-checked={value.status === d.id} className="seg__btn" name={name}
            onClick={() => { setThemeDecision(theme.id, { status: d.id }); setMsg(`Marked ${d.label.toLowerCase()}`); }}>
            {d.label}
          </button>
        ))}
      </div>
      <label className="field">
        <span className="field__hint">Reason, shown to the public with the decision</span>
        <textarea className="textarea sr-reason" value={reason} onChange={(e) => setReason(e.target.value)}
          onBlur={() => { if (reason !== (value.reason || "")) { setThemeDecision(theme.id, { reason: reason.trim() }); setMsg("Reason saved"); } }}
          placeholder={`e.g. ${theme.response}`} aria-label={`Reason for the decision on ${theme.name}`} />
      </label>
      <p className="sf-saved" role="status" aria-live="polite">{msg && <><Icon name="check" />{msg} · saved in this browser</>}</p>
    </fieldset>
  );
}
