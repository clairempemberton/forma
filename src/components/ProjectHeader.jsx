import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { StatusBadge } from "./ui.jsx";
import { PROJECT } from "../data/featured.js";

const TABS = [
  { to: "", label: "Overview", icon: "doc", match: (p) => p === "" },
  { to: "explore", label: "Proposal", icon: "map", match: (p) => /^(explore|inspect|evidence)/.test(p) },
  { to: "compare", label: "Compare options", icon: "swap", match: (p) => /^(compare|alternatives)/.test(p) },
  { to: "perspectives", label: "Community perspectives", icon: "users", match: (p) => /^(perspectives|themes|feedback)/.test(p) },
  { to: "updates", label: "Updates", icon: "history", match: (p) => /^(updates|revision|decision)/.test(p) },
];

// Sidebar on wide screens, top bar on narrow ones. Matches the breakpoint in shell.css.
const SIDEBAR_MQ = "(min-width: 1181px)";

// Project identity + section nav, shared by every public project screen.
export default function ProjectHeader({ project = PROJECT }) {
  const { pathname } = useLocation();
  const base = `/projects/${project.id}`;
  const rest = pathname.startsWith(base) ? pathname.slice(base.length).replace(/^\//, "") : "";
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  // Map pages fill the viewport below the top bar; as a sidebar it takes no vertical space.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia(SIDEBAR_MQ);
    const sync = () => document.documentElement.style.setProperty("--project-h", mq.matches ? "0px" : `${el.offsetHeight}px`);
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    mq.addEventListener("change", sync);
    return () => { ro.disconnect(); mq.removeEventListener("change", sync); document.documentElement.style.removeProperty("--project-h"); };
  }, []);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: project.title, url });
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    } catch { /* cancelled */ }
  };

  return (
    <aside className="project-header" ref={ref} aria-label="Project">
      <Link to="/" className="project-header__back"><Icon name="arrowLeft" />All projects</Link>
      <div className="project-header__id">
        <span className="project-header__place">{project.place.neighborhood.split(" · ")[0]}</span>
        <Link to={base} className="project-header__title">{project.title}</Link>
        <StatusBadge tone={project.statusTone}>{project.status}</StatusBadge>
      </div>
      <nav className="project-header__nav" aria-label="Project sections">
        {TABS.map((t) => (
          <NavLink key={t.label} end to={t.to ? `${base}/${t.to}` : base} className="project-header__link" aria-current={t.match(rest) ? "page" : undefined}>
            <Icon name={t.icon} />{t.label}
          </NavLink>
        ))}
      </nav>
      <button type="button" className="btn btn--ghost btn--sm project-header__share" onClick={share}>
        <Icon name={copied ? "check" : "share"} />{copied ? "Link copied" : "Share"}
      </button>
    </aside>
  );
}
