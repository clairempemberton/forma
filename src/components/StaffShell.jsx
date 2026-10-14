import { NavLink, Link } from "react-router-dom";
import Icon from "./Icon.jsx";
import { Logo } from "./ui.jsx";
import { SAMPLE_COMMENTS, PROJECT } from "../data/alder.js";
import { useStore } from "../lib/store.js";

const NAV = [
  { to: "/staff", label: "Overview", icon: "grid", end: true },
  { to: "/staff/triage", label: "Feedback", icon: "inbox", badge: true },
  { to: "/staff/themes", label: "Themes", icon: "sparkle" },
  { to: "/staff/revisions", label: "Revisions", icon: "edit" },
  { to: "/staff/publish", label: "Publish & QA", icon: "doc" },
];

export default function StaffShell({ children, title, actions }) {
  const { triage, mine } = useStore((s) => s);
  const untriaged = [...SAMPLE_COMMENTS, ...mine].filter((c) => !triage[c.id]?.theme && !triage[c.id]?.status).length;

  return (
    <div className="staff">
      <aside className="staff__side" aria-label="Staff workspace">
        <div className="staff__brand"><Logo to="/staff" /></div>
        <nav className="staff__nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="staff__link">
              <Icon name={n.icon} />
              <span>{n.label}</span>
              {n.badge && untriaged > 0 && <span className="staff__count t-num">{untriaged}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="spacer" />
        <div className="notice"><Icon name="shield" /><div>Private comments stay in this workspace. Public pages only receive what passes the publish check.</div></div>
        <Link to="/" className="staff__link"><Icon name="arrowLeft" /><span>Public site</span></Link>
      </aside>
      <div className="staff__main">
        <header className="staff__top">
          <span className="badge badge--ink badge--plain">Staff workspace</span>
          <span className="t-compact t-muted staff__crumb">Eastside Streets <Icon name="chevronRight" /> <strong>{PROJECT.title}</strong></span>
          <div className="spacer" />
          <span className="badge badge--warning">Demo data</span>
          <span className="staff__user"><span className="avatar" aria-hidden="true">JR</span><span className="t-caption"><strong>J. Rivera</strong><br /><span className="t-muted">Planner · Editor (fictional)</span></span></span>
        </header>
        <main id="main" className="staff__content">
          {(title || actions) && (
            <div className="staff__head">
              <div>
                <p className="t-caption t-muted t-mono">ES-2026-014 · Buckman</p>
                <h1 className="t-h1">{title}</h1>
              </div>
              <div className="row">{actions}</div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
