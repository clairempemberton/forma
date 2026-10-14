import { Link } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { SiteFooter } from "./DiscoveryKit.jsx";
import "./discovery.css";

// A dead-end street, drawn in the map palette.
export function DeadEnd() {
  return (
    <svg className="nf-art" viewBox="0 0 360 160" aria-hidden="true" focusable="false">
      <rect width="360" height="160" rx="16" fill="#f4f6f8" />
      <rect x="0" y="62" width="250" height="36" fill="#e2e6eb" />
      <circle cx="262" cy="80" r="34" fill="#e2e6eb" />
      {Array.from({ length: 11 }, (_, i) => <rect key={i} x={10 + i * 20} y="79.25" width="10" height="1.5" fill="#fff" />)}
      <rect x="-4" y="-4" width="120" height="54" rx="3" fill="#fff" stroke="#d6dbe2" />
      <rect x="128" y="-4" width="110" height="54" rx="3" fill="#fff" stroke="#d6dbe2" />
      <rect x="-4" y="110" width="240" height="54" rx="3" fill="#fff" stroke="#d6dbe2" />
      <circle cx="320" cy="40" r="11" fill="#d1fae0" stroke="#4ade80" />
      <circle cx="326" cy="126" r="13" fill="#d1fae0" stroke="#4ade80" />
      <circle cx="262" cy="80" r="9" fill="#15803d" opacity="0.16" />
      <circle cx="262" cy="80" r="4.5" fill="#15803d" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

export default function NotFound({ title = "This street doesn't go anywhere", children }) {
  return (
    <>
      <main id="main" tabIndex={-1} className="wrap nf">
        <DeadEnd />
        <p className="t-eyebrow">Page not found · 404</p>
        <h1 className="t-h1">{title}</h1>
        <p className="t-body t-muted nf__lead">{children || "The link may be old, or the page may have moved. Projects and their maps are all reachable from the directory."}</p>
        <div className="nf__actions">
          <Link to="/" className="btn btn--accent btn--lg">Explore projects<Icon name="arrowRight" /></Link>
          <Link to="/" className="btn btn--secondary btn--lg">Go home</Link>
        </div>
        <Link to="/projects/hawthorne" className="link nf__alt">Open the SE Hawthorne project<Icon name="arrowRight" /></Link>
      </main>
      <SiteFooter />
    </>
  );
}
