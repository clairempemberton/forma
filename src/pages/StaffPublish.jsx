import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import StaffShell from "../components/StaffShell.jsx";
import Icon from "../components/Icon.jsx";
import { Notice, Truth, fmtDate } from "../components/ui.jsx";
import { DECISION, PROJECT, VERSIONS, REVISION_CHANGES, THEMES, PROJECT_BASE, optName } from "../data/featured.js";
import { setState } from "../lib/store.js";
import { useStaffData, publishChecks, publicSet, setResponse, DECISION_BY_ID } from "./staffData.js";
import "./staff.css";

// R24 · Publish & QA: checks computed from the current state, a preview of exactly what
// goes public, and a simulated publish.
export default function StaffPublish() {
  const data = useStaffData();
  const { comments, responses, decisions, published, publishedAt } = data;
  const checks = publishChecks(data);
  const blocking = checks.filter((c) => c.blocking && !c.ok);
  const pub = publicSet(comments);
  const privateCount = comments.length - pub.length;
  const notes = comments.filter((c) => c.note).length;
  const answered = THEMES.filter((t) => (responses[t.id] || "").trim());
  const dlg = useRef(null);
  const [status, setStatus] = useState("");

  const fillFromPbot = () => {
    const empty = THEMES.filter((t) => !(responses[t.id] || "").trim());
    empty.forEach((t) => setResponse(t.id, t.response));
    setStatus(`${PROJECT.agency}'s published answers copied into ${empty.length} empty theme${empty.length === 1 ? "" : "s"}. Edit them on the Themes page.`);
  };
  const confirm = () => {
    setState({ published: true, publishedAt: new Date().toISOString() });
    dlg.current?.close();
    setStatus("");
  };
  const unpublish = () => { setState({ published: false, publishedAt: null }); setStatus("Marked as unpublished. The checks still apply if you publish again."); };

  return (
    <StaffShell
      title="Publish & QA"
      actions={published
        ? <button type="button" className="btn btn--secondary" onClick={unpublish}><Icon name="history" />Mark unpublished</button>
        : <button type="button" className={`btn ${blocking.length ? "btn--secondary" : "btn--accent"}`} aria-describedby="sp-checks-state" onClick={() => (blocking.length ? setStatus(`Fix ${blocking.length} blocking check${blocking.length === 1 ? "" : "s"} before publishing.`) : dlg.current?.showModal())}>
            <Icon name="send" />Publish update (demo)
          </button>}
    >
      <div className="sf-live" role="status" aria-live="polite">
        {published ? (
          <Notice tone="positive" icon="check">
            <strong>Update published {publishedAt ? fmtDate(publishedAt.slice(0, 10)) : ""} (demo).</strong> Nothing left this browser. In a real deployment, followers of {PROJECT.title} would get one email and the public page would show the responses below. <Link className="link" to={`${PROJECT_BASE}/updates`}>See the public Updates page</Link>
          </Notice>
        ) : status && <Notice tone="accent" icon="info">{status}</Notice>}
      </div>

      <div className="sp">
        <section className="sp-checks" aria-labelledby="sp-checks-h">
          <div className="sd-card__head">
            <h2 id="sp-checks-h" className="t-h3">Checks</h2>
            <span id="sp-checks-state" className={`badge ${blocking.length ? "badge--warning" : "badge--positive"}`}>{blocking.length ? `${blocking.length} blocking` : "Ready to publish"}</span>
          </div>
          <p className="t-compact t-muted">Every blocking check must pass before anything goes public. They re-run as you work.</p>
          <ul className="sp-list">
            {checks.map((c) => (
              <li key={c.id} className={`sp-check ${c.ok ? "is-ok" : c.blocking ? "is-block" : "is-soft"}`}>
                <span className="sp-check__icon" aria-hidden="true"><Icon name={c.icon} /></span>
                <div className="sp-check__main">
                  <p className="sp-check__title">{c.title}</p>
                  <p className="t-caption t-muted">{c.detail}</p>
                  {!c.ok && c.items?.length > 0 && (
                    <ul className="sp-check__items">
                      {c.items.slice(0, 3).map((x) => <li key={x.id}><Link className="link t-caption" to={`/staff/triage?c=${x.id}`}><span className="t-mono">{x.ref}</span> {x.flags[0]?.label}</Link></li>)}
                    </ul>
                  )}
                  {!c.ok && (
                    <div className="row sp-check__fix">
                      {c.id === "responses" && <button type="button" className="btn btn--secondary btn--sm" onClick={fillFromPbot}>Copy {PROJECT.agency}'s answers into empty themes</button>}
                      {c.fix && <Link className="btn btn--ghost btn--sm" to={c.fix.to}>{c.fix.label}<Icon name="arrowRight" /></Link>}
                    </div>
                  )}
                </div>
                <span className="sp-check__state">
                  {c.ok ? <span className="sd-tick is-ok" role="img" aria-label="Passed"><Icon name="check" /></span>
                    : c.blocking ? <span className="badge badge--warning badge--plain">Blocking</span>
                      : <span className="badge badge--outline badge--plain">Not blocking</span>}
                </span>
              </li>
            ))}
          </ul>
          <Notice icon="info">Publishing is simulated in this prototype. It only sets a flag in this browser's storage; no email is sent and no public page changes for anyone else.</Notice>
        </section>

        <section className="sp-preview" aria-labelledby="sp-prev-h">
          <div className="sd-card__head">
            <h2 id="sp-prev-h" className="sf-sub">What will go public</h2>
            <Truth kind="illustrative" />
          </div>
          <div className="sp-split">
            <div className="sp-split__box"><p className="sp-split__h"><Icon name="eye" />Goes public</p><p className="t-caption t-muted">{REVISION_CHANGES.length} revision items, {answered.length} theme responses, {pub.length} comment excerpts without names or contact details</p></div>
            <div className="sp-split__box"><p className="sp-split__h"><Icon name="lock" />Stays private</p><p className="t-caption t-muted">{privateCount} private or hidden comment{privateCount === 1 ? "" : "s"}, {notes} internal note{notes === 1 ? "" : "s"}, exact pin locations, staff names</p></div>
          </div>

          <article className="sp-page" aria-label="Preview of the public update">
            <p className="t-eyebrow">Update · {PROJECT.round}</p>
            <h3 className="t-h2">How {optName(DECISION.chosen)} was refined</h3>
            <p className="t-compact t-muted">{VERSIONS[1].note} Posted when published.</p>
            <ol className="sp-page__changes">
              {REVISION_CHANGES.map((r, i) => (
                <li key={r.id}>
                  <span className={`sr-num ${r.status === "changed" ? "" : "sr-num--off"}`}>{i + 1}</span>
                  <div><p className="sp-page__t">{r.title}</p><p className="t-caption t-muted">{r.after}</p></div>
                </li>
              ))}
            </ol>
            <h4 className="sf-label">What you told us, and our response</h4>
            <ul className="sp-page__themes">
              {THEMES.map((t) => {
                const text = (responses[t.id] || "").trim();
                const d = decisions[t.id];
                return (
                  <li key={t.id}>
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                      <p className="sp-page__t">{t.name}</p>
                      {d?.status && <span className="badge badge--plain badge--outline">{DECISION_BY_ID[d.status].label}</span>}
                    </div>
                    {text ? <p className="t-compact">{text}</p> : <p className="t-compact sp-missing"><Icon name="alert" />No response yet — this theme would appear unanswered.</p>}
                    {d?.reason && <p className="t-caption t-muted">Why: {d.reason}</p>}
                  </li>
                );
              })}
            </ul>
          </article>
        </section>
      </div>

      <dialog ref={dlg} className="sp-dialog" aria-labelledby="sp-dlg-h">
        <div className="sp-dialog__icon" aria-hidden="true"><Icon name="send" /></div>
        <h2 id="sp-dlg-h" className="t-h3">Publish this update?</h2>
        <p className="t-compact t-muted">Followers would get one email, and the public page would show {answered.length} responses and {REVISION_CHANGES.length} revision items. In this prototype nothing is sent; the update is marked as published in this browser only.</p>
        <div className="row sp-dialog__actions">
          <button type="button" className="btn btn--secondary" onClick={() => dlg.current?.close()}>Cancel</button>
          <button type="button" className="btn btn--accent" onClick={confirm} autoFocus>Publish (demo)</button>
        </div>
      </dialog>
    </StaffShell>
  );
}
