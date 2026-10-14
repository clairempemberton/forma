import { FULL_PROJECTS, loadProject, useActiveProjectId } from "../data/featured.js";

// Picks which fully built project a screen outside the project routes (/me, /staff) shows.
export default function ProjectSwitch({ label = "Project", counts }) {
  const active = useActiveProjectId();
  if (FULL_PROJECTS.length < 2) return null;
  return (
    <div className="seg" role="radiogroup" aria-label={label} style={{ width: "100%", flexWrap: "wrap" }}>
      {FULL_PROJECTS.map((p) => (
        <button key={p.id} type="button" role="radio" aria-checked={active === p.id} className="seg__btn" onClick={() => loadProject(p.id)}
          style={active === p.id ? { background: "var(--surface)", boxShadow: "0 1px 2px rgba(14,17,22,.08), 0 0 0 1px var(--hairline)" } : undefined}>
          {p.short}{counts?.[p.id] ? ` · ${counts[p.id]}` : ""}
        </button>
      ))}
    </div>
  );
}
