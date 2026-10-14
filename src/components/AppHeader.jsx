import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";
import { Logo } from "./ui.jsx";

export default function AppHeader() {
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  const menuRef = useRef(null);
  useEffect(() => { setMenu(false); }, [pathname]);
  useEffect(() => {
    if (!menu) return undefined;
    const close = (e) => { if (e.key === "Escape" || (e.type === "pointerdown" && !menuRef.current?.contains(e.target))) setMenu(false); };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", close); };
  }, [menu]);

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Logo />
        <div className="spacer" />
        <span className="badge badge--outline app-header__demo" title="Not affiliated with the City of Portland. Project facts are cited to their official pages; resident comments are samples.">Unofficial concept · Portland</span>
        <div className="app-header__more" ref={menuRef}>
          <button type="button" className="btn btn--ghost btn--icon" aria-expanded={menu} aria-controls="site-menu" onClick={() => setMenu((v) => !v)} aria-label="Menu"><Icon name={menu ? "close" : "menu"} /></button>
          {menu && (
            <nav id="site-menu" className="site-menu panel-float" aria-label="Site">
              <NavLink to="/" end className="rowbtn"><Icon name="map" />Projects map</NavLink>
              <NavLink to="/projects/hawthorne" className="rowbtn"><Icon name="layers" />SE Hawthorne project</NavLink>
              <NavLink to="/me" className="rowbtn"><Icon name="comment" />My comments</NavLink>
              <NavLink to="/projects/hawthorne/text" className="rowbtn"><Icon name="a11y" />Text-only version</NavLink>
              <NavLink to="/staff" className="rowbtn"><Icon name="users" />Staff workspace</NavLink>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
