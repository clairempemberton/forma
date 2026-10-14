import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { StatusBadge } from "./ui.jsx";
import { PROJECT } from "../data/alder.js";

const TABS = [
  { to: "", label: "Overview", match: (p) => p === "" },
  { to: "explore", label: "Proposal", match: (p) => /^(explore|inspect|evidence)/.test(p) },
  { to: "compare", label: "Compare options", match: (p) => /^(compare|alternatives)/.test(p) },
  { to: "perspectives", label: "Community perspectives", match: (p) => /^(perspectives|themes|feedback)/.test(p) },
  { to: "updates", label: "Updates", match: (p) => /^(updates|revision|decision)/.test(p) },
];

// Breadcrumb + project tabs, shared by every public project screen.
export default function ProjectHeader({ project = PROJECT }) {
  const { pathname } = useLocation();
  const base = `/projects/${project.id}`;
  const rest = pathname.startsWith(base) ? pathname.slice(base.length).replace(/^\//, "") : "";
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  // Map pages fill the viewport below this header, whose height changes when the tabs wrap.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty("--project-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => { ro.disconnect(); document.documentElement.style.removeProperty("--project-h"); };
  }, []);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: project.title, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="project-header" ref={ref}>
      <div className="project-header__inner">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/projects">Projects</Link>
          <Icon name="chevronRight" />
          <span className="crumbs__muted">{project.place.neighborhood.split(" · ")[0]}</span>
          <Icon name="chevronRight" />
          <Link to={base} aria-current={rest === "" ? "page" : undefined} className="crumbs__current">{project.title}</Link>
          <StatusBadge tone={project.statusTone}>{project.status}</StatusBadge>
        </nav>
        <nav className="tabs project-header__tabs" aria-label="Project sections">
          {TABS.map((t) => (
            <NavLink key={t.label} end to={t.to ? `${base}/${t.to}` : base} className="tab" aria-current={t.match(rest) ? "page" : undefined}>{t.label}</NavLink>
          ))}
        </nav>
        <button type="button" className="btn btn--ghost btn--sm project-header__share" onClick={share}>
          <Icon name={copied ? "check" : "share"} />{copied ? "Link copied" : "Share"}
        </button>
      </div>
    </div>
  );
}
