import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { Logo } from "./ui.jsx";
import { useStore } from "../lib/store.js";

export default function AppHeader() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const mine = useStore((s) => s.mine.length);
  const [menu, setMenu] = useState(false);

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Logo />
        <nav className="app-header__nav" aria-label="Main">
          <NavLink to="/projects" className="navlink">Explore projects</NavLink>
          <NavLink to="/how-it-works" className="navlink">How it works</NavLink>
        </nav>
        <form className="search app-header__search" role="search" onSubmit={(e) => { e.preventDefault(); navigate(`/projects?q=${encodeURIComponent(q)}`); }}>
          <Icon name="search" />
          <label className="sr-only" htmlFor="global-search">Search a neighborhood, street or project</label>
          <input id="global-search" className="input" placeholder="Search a neighborhood, street or project" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <div className="spacer" />
        <span className="badge badge--warning app-header__demo" title="The place is real. The project, comments and outcomes are fictional.">Fictional demo · Portland</span>
        <Link to="/projects/alder-8th/text" className="btn btn--ghost btn--icon app-header__icon" aria-label="Accessible text-only version"><Icon name="a11y" /></Link>
        <Link to="/me" className="btn btn--secondary btn--sm app-header__me">
          My comments{mine > 0 && <span className="count-dot t-num">{mine}</span>}
        </Link>
        <button type="button" className="btn btn--ghost btn--icon app-header__menu" aria-expanded={menu} aria-controls="mobile-nav" onClick={() => setMenu((v) => !v)} aria-label="Menu"><Icon name={menu ? "close" : "menu"} /></button>
      </div>
      {menu && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Main" onClick={() => setMenu(false)}>
          <NavLink to="/projects" className="rowbtn">Explore projects</NavLink>
          <NavLink to="/how-it-works" className="rowbtn">How it works</NavLink>
          <NavLink to="/me" className="rowbtn">My comments</NavLink>
          <NavLink to="/projects/alder-8th/text" className="rowbtn">Text-only version</NavLink>
          <NavLink to="/staff" className="rowbtn">Staff workspace (demo)</NavLink>
        </nav>
      )}
    </header>
  );
}
