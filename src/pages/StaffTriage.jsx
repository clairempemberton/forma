import { useEffect, useMemo, useRef, useState } from "react";
import StaffShell from "../components/StaffShell.jsx";
import MapView from "../map/MapView.jsx";
import Icon from "../components/Icon.jsx";
import { Truth, Empty, fmtDate } from "../components/ui.jsx";
import { CAMERA, F, optTag } from "../data/featured.js";
import { circle } from "../lib/geo.js";
import { setTriage } from "../lib/store.js";
import { useParam } from "../lib/useMapMode.js";
import {
  useStaffData, STATUSES, THEMES, THEME_BY_ID, OPTIONS, spatialFeatures, themeName, optionLabel, metres, cameraFor, StatusPill,
} from "./staffData.js";
import "./staff.css";

const NEAR_SELECTED_M = 15;
const RADII = [5, 10, 15, 25, 50];
const SORTS = {
  date: (a, b) => a.date.localeCompare(b.date) || a.ref.localeCompare(b.ref),
  theme: (a, b) => themeName(a.themeEff).localeCompare(themeName(b.themeEff)) || a.date.localeCompare(b.date),
  status: (a, b) => STATUSES.findIndex((s) => s.id === a.status) - STATUSES.findIndex((s) => s.id === b.status) || a.date.localeCompare(b.date),
};

// R21 · Feedback triage: a precise table and the map, side by side, kept in sync.
export default function StaffTriage() {
  const { comments } = useStaffData();
  const [sel, setSel] = useParam("c");
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState("all");
  const [option, setOption] = useState("all");
  const [status, setStatus] = useState("all");
  const [nearId, setNearId] = useState("");
  const [radius, setRadius] = useState(10);
  const [sort, setSort] = useState({ key: "date", dir: "desc" });
  const [camera, setCamera] = useState(null);
  const tableRef = useRef(null);

  const near = spatialFeatures().find((f) => f.id === nearId);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = comments.filter((c) =>
      (theme === "all" || (theme === "none" ? !c.themeEff : c.themeEff === theme))
      && (option === "all" || (option === "none" ? !c.option : c.option === option))
      && (status === "all" || c.status === status)
      && (!near || metres(c.lngLat, near.lngLat) <= radius)
      && (!needle || c.text.toLowerCase().includes(needle) || c.ref.toLowerCase().includes(needle)));
    const cmp = SORTS[sort.key];
    return list.sort((a, b) => (sort.dir === "asc" ? cmp(a, b) : -cmp(a, b)));
  }, [comments, q, theme, option, status, near, radius, sort]);

  const selected = comments.find((c) => c.id === sel) || null;
  const counts = useMemo(() => Object.fromEntries(STATUSES.map((s) => [s.id, comments.filter((c) => c.status === s.id).length])), [comments]);
  const filtered = q || theme !== "all" || option !== "all" || status !== "all" || near;

  const select = (c, { fly = true, focusRow = false } = {}) => {
    setSel(c ? c.id : null);
    if (c && fly) setCamera({ center: c.lngLat, zoom: 19.8, bearing: 0, pitch: 0 });
    if (!c) return;
    const tr = tableRef.current?.querySelector(`[data-id="${c.id}"]`);
    if (focusRow) tr?.focus({ preventScroll: true });
    tr?.scrollIntoView({ block: "nearest" });
  };

  // Deep links (?c=…) from the overview fly to the comment once.
  const first = useRef(true);
  useEffect(() => {
    if (first.current && selected) setCamera({ center: selected.lngLat, zoom: 19.8, bearing: 0, pitch: 0 });
    first.current = false;
  }, [selected]);

  const markers = useMemo(() => {
    const list = rows.map((c) => ({
      id: c.id, kind: "comment", lngLat: c.lngLat, label: c.text, mine: !!c.mine,
      selected: c.id === sel, dim: !!sel && c.id !== sel, ariaLabel: `${c.ref}, ${themeName(c.themeEff)}: ${c.text}`,
    }));
    if (selected && !rows.includes(selected)) list.push({ id: selected.id, kind: "comment", lngLat: selected.lngLat, label: selected.text, selected: true, ariaLabel: `${selected.ref} (outside the current filter)` });
    if (near) list.push({ id: `ref-${near.id}`, kind: "feature", fid: near.id, label: near.label.split(" · ")[1], lngLat: near.lngLat, showLabel: false });
    return list;
  }, [rows, sel, selected, near]);

  const focus = useMemo(() => (near ? circle(F, ...F.toLocal(near.lngLat), radius, { kind: "radius" }, 48) : null), [near, radius]);

  const onMarkerClick = (m) => {
    if (m.kind === "cluster") {
      const cam = cameraFor(m.members, 20.6);
      const spread = Math.max(...m.members.map((p) => metres(cam.center, p.lngLat)));
      if (spread < 3) select(comments.find((c) => c.id === m.members[0].id), { fly: false });
      setCamera({ ...cam, zoom: spread < 3 ? 20.6 : Math.max(cam.zoom, 19.6) });
      return;
    }
    const c = comments.find((x) => x.id === m.id);
    if (c) select(sel === c.id ? null : c, { fly: false });
  };

  const onTableKey = (e) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key) || !rows.length) return;
    e.preventDefault();
    const from = e.target.closest?.("tr[data-id]")?.dataset.id || sel;
    const i = rows.findIndex((r) => r.id === from);
    const next = e.key === "Home" ? 0 : e.key === "End" ? rows.length - 1 : e.key === "ArrowDown" ? Math.min(rows.length - 1, i + 1) : Math.max(0, i - 1);
    select(rows[next], { focusRow: true });
  };

  const sortHead = (key, label, cls = "") => {
    const active = sort.key === key;
    return (
      <th className={cls} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
        <button type="button" className="st-sort" onClick={() => setSort({ key, dir: active && sort.dir === "desc" ? "asc" : active ? "desc" : key === "date" ? "desc" : "asc" })}>
          {label}<Icon name="chevronDown" className={active ? `is-${sort.dir}` : "is-idle"} />
        </button>
      </th>
    );
  };

  const nearby = useMemo(() => (selected
    ? comments.filter((c) => c.id !== selected.id).map((c) => ({ ...c, d: metres(c.lngLat, selected.lngLat) })).filter((c) => c.d <= NEAR_SELECTED_M).sort((a, b) => a.d - b.d)
    : []), [comments, selected]);

  const clear = () => { setQ(""); setTheme("all"); setOption("all"); setStatus("all"); setNearId(""); };

  return (
    <StaffShell title="Feedback" actions={<Truth kind="sample">Sample comments · not real residents, plus any sent from this browser</Truth>}>
      <div className="st">
        <div className="st-status" role="group" aria-label="Filter by status">
          <button type="button" className="chip" aria-pressed={status === "all"} onClick={() => setStatus("all")}>All <span className="count">{comments.length}</span></button>
          {STATUSES.map((s) => (
            <button key={s.id} type="button" className="chip" aria-pressed={status === s.id} onClick={() => setStatus(status === s.id ? "all" : s.id)}>
              {s.label} <span className="count">{counts[s.id]}</span>
            </button>
          ))}
        </div>

        <div className="st-filters" role="search" aria-label="Filter comments">
          <label className="search st-search">
            <span className="sr-only">Search comments</span>
            <Icon name="search" />
            <input className="input sf-select" type="search" placeholder="Search text or reference" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <label className="st-filter"><span className="sf-label">Theme</span>
            <select className="select sf-select" value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="all">All themes</option>
              {THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              <option value="none">No theme yet</option>
            </select>
          </label>
          <label className="st-filter"><span className="sf-label">Alternative</span>
            <select className="select sf-select" value={option} onChange={(e) => setOption(e.target.value)}>
              <option value="all">Any alternative</option>
              {OPTIONS.map((o) => <option key={o.id} value={o.id}>{optTag(o.id)} · {o.short}</option>)}
              <option value="none">No alternative named</option>
            </select>
          </label>
          <div className="st-filter st-filter--near">
            <span className="sf-label" id="st-near-l">Within</span>
            <div className="row" style={{ gap: 6 }}>
              <select className="select sf-select st-radius" aria-label="Distance" value={radius} onChange={(e) => setRadius(+e.target.value)} disabled={!nearId}>
                {RADII.map((r) => <option key={r} value={r}>{r} m</option>)}
              </select>
              <select className="select sf-select" aria-label="of feature" value={nearId} onChange={(e) => setNearId(e.target.value)}>
                <option value="">of any feature</option>
                {spatialFeatures().map((f) => <option key={f.id} value={f.id}>of {f.label}</option>)}
              </select>
            </div>
          </div>
          {filtered && <button type="button" className="btn btn--ghost btn--sm st-clear" onClick={clear}><Icon name="close" />Clear</button>}
        </div>

        <div className="st-body">
          <div className="st-tablecol">
            <p className="t-caption t-muted st-count" aria-live="polite">
              Showing <strong className="t-num">{rows.length}</strong> of {comments.length}{near ? ` · within ${radius} m of ${near.id}` : ""}. Arrow keys move between rows.
            </p>
            {rows.length ? (
              <div className="table-wrap st-tablewrap" ref={tableRef}>
                <table className="table st-table" aria-label="Comments" onKeyDown={onTableKey}>
                  <thead>
                    <tr>
                      <th className="st-col-ref">Ref</th>
                      <th>Comment</th>
                      {sortHead("theme", "Theme", "st-col-theme")}
                      <th className="st-col-opt">Alt</th>
                      {sortHead("date", "Date", "st-col-date")}
                      {sortHead("status", "Status", "st-col-status")}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c, i) => {
                      const isSel = c.id === sel;
                      return (
                        <tr
                          key={c.id}
                          data-id={c.id}
                          aria-selected={isSel}
                          tabIndex={isSel || (!sel && i === 0) || (sel && !rows.some((r) => r.id === sel) && i === 0) ? 0 : -1}
                          onClick={() => select(isSel ? null : c)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(c); } }}
                          className={c.status === "hidden" ? "is-hidden" : ""}
                        >
                          <td className="st-col-ref"><span className="t-mono">{c.ref}</span></td>
                          <td className="st-col-text">
                            <span className="st-text">{c.status === "hidden" ? <em className="t-muted">Hidden from public views</em> : c.text}</span>
                            <span className="st-mobmeta t-caption t-muted">{c.ref} · {c.themeEff ? themeName(c.themeEff) : "No theme"} · {fmtDate(c.date, { month: "short", day: "numeric" })}</span>
                            <span className="st-meta">
                              {c.mine && <span className="badge badge--voice badge--plain">This browser</span>}
                              {!c.public && <span className="badge badge--outline badge--plain"><Icon name="lock" />Private</span>}
                              {c.flags.map((f) => <span key={f.id} className={`badge badge--plain ${f.pii ? "badge--warning" : "badge--outline"}`}><Icon name={f.icon} />{f.label}</span>)}
                              {c.note && <span className="badge badge--outline badge--plain"><Icon name="edit" />Note</span>}
                            </span>
                          </td>
                          <td className="st-col-theme">{c.themeEff ? themeName(c.themeEff) : <span className="t-muted">—</span>}{c.themeChanged && <span className="sr-only"> (reassigned)</span>}</td>
                          <td className="st-col-opt">{optionLabel(c.option)}</td>
                          <td className="st-col-date t-num">{fmtDate(c.date, { month: "short", day: "numeric" })}</td>
                          <td className="st-col-status"><StatusPill id={c.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="staff-card"><Empty icon="filter" title="No comments match" action={<button type="button" className="btn btn--secondary btn--sm" onClick={clear}>Clear filters</button>}>Try a wider distance or another theme.</Empty></div>
            )}
          </div>

          <aside className="st-side" aria-label="Map and selected comment">
            <div className="sf-mapbox st-map">
              <MapView
                initialCamera={{ ...CAMERA.overview, zoom: 18.2 }}
                camera={camera}
                markers={markers}
                onMarkerClick={onMarkerClick}
                focus={focus}
                modeSwitch={false}
                hud={false}
                ariaLabel="Map of the filtered comments. Clusters group nearby comments."
              />
            </div>
            {selected ? <Detail key={selected.id} c={selected} nearby={nearby} onPick={(c) => select(c)} onClose={() => setSel(null)} /> : (
              <div className="staff-card st-hint">
                <p className="sf-sub">Select a comment</p>
                <p className="t-compact t-muted">Choose a row or a pin to assign a theme, set a status and leave an internal note. Clusters zoom in when selected.</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </StaffShell>
  );
}

function Detail({ c, nearby, onPick, onClose }) {
  const [note, setNote] = useState(c.note);
  const [saved, setSaved] = useState("");
  const save = (patch, msg) => { setTriage(c.id, patch); setSaved(msg); };
  const dirty = note !== c.note;

  return (
    <section className="staff-card st-detail" aria-labelledby="st-detail-h">
      <div className="st-detail__head">
        <div>
          <h2 id="st-detail-h" className="t-mono st-ref">{c.ref}</h2>
          <p className="t-caption t-muted">{fmtDate(c.date)} · {c.author}{c.option ? ` · Alt ${c.option}` : ""}</p>
        </div>
        <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={onClose} aria-label="Close comment"><Icon name="close" /></button>
      </div>
      <blockquote className="st-quote"><span className="sf-voice" aria-hidden="true" />{c.text}</blockquote>
      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        <Truth kind={c.mine ? "yours" : "sample"} />
        <span className="badge badge--outline badge--plain">{c.public ? <><Icon name="eye" />Public excerpt allowed</> : <><Icon name="lock" />Private to the team</>}</span>
      </div>
      {c.flags.length > 0 && (
        <div className={`notice ${c.flags.some((f) => f.pii) ? "notice--warning" : ""}`}>
          <Icon name="flag" />
          <div><strong>Flagged:</strong> {c.flags.map((f) => f.label).join(" · ")}. {c.flags.some((f) => f.pii) ? "Hide it, or keep it private, before anything is published." : "Give it a status once you've read it."}</div>
        </div>
      )}

      <label className="field">
        <span className="field__label">Theme</span>
        <select className="select sf-select" value={c.themeEff || ""} onChange={(e) => save({ theme: e.target.value || null }, `Theme set to ${e.target.value ? THEME_BY_ID[e.target.value].name : "none"}`)}>
          <option value="">No theme</option>
          {THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>

      <fieldset className="field st-fieldset">
        <legend className="field__label">Status</legend>
        <div className="st-statuses" role="radiogroup" aria-label="Status">
          {STATUSES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={c.status === s.id} className="st-statusbtn" onClick={() => save({ status: s.id }, `Status set to ${s.label}`)}>
              {s.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span className="field__label">Internal note</span>
        <textarea className="textarea st-note" value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => { if (dirty) save({ note }, "Note saved"); }} placeholder="Only staff see this. Who to follow up with, what to check…" />
        <span className="field__hint">Never published. Saved when you leave the box.</span>
      </label>

      <label className="row st-flag">
        <input type="checkbox" checked={c.manualFlag} onChange={(e) => save({ flag: e.target.checked }, e.target.checked ? "Flagged for moderation" : "Flag removed")} />
        <span className="t-compact">Flag for moderation</span>
      </label>
      <p className="sf-saved" role="status" aria-live="polite">{saved && <><Icon name="check" />{saved} · saved in this browser</>}</p>

      <div className="st-near">
        <p className="sf-label">Near this comment · {NEAR_SELECTED_M} m</p>
        {nearby.length ? (
          <ul className="rows">
            {nearby.slice(0, 6).map((n) => (
              <li key={n.id}>
                <button type="button" className="rowbtn st-nearbtn" onClick={() => onPick(n)}>
                  <span className="t-mono t-caption">{n.ref}</span>
                  <span className="rowbtn__main"><span className="st-neartext">{n.text}</span><span className="rowbtn__sub">{themeName(n.themeEff)}</span></span>
                  <span className="t-caption t-muted t-num">{n.d < 1 ? "<1" : Math.round(n.d)} m</span>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="t-caption t-muted">No other comments within {NEAR_SELECTED_M} m.</p>}
      </div>
    </section>
  );
}
