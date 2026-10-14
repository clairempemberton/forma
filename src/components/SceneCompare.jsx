import { useEffect, useState } from "react";
import Icon from "./Icon.jsx";

// Street-level before/after from matched renders in /urban-scenes. Only compares two
// variants of the same scene (same camera); otherwise shows what is still needed.
const BASE = "./urban-scenes/metadata/";

export function useScenes(project = "hawthorne") {
  const [scenes, setScenes] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch(`${BASE}index.json`)
      .then((r) => r.json())
      .then((idx) => Promise.all(idx.scenes.map((id) => fetch(`${BASE}${id}.json`).then((r) => r.json()))))
      .then((all) => alive && setScenes(all.filter((s) => s.project === project)))
      .catch(() => alive && setScenes([]));
    return () => { alive = false; };
  }, [project]);
  return scenes;
}

const resolve = (src) => new URL(src, new URL(BASE, window.location.href)).href;

export default function SceneCompare({ scene: sceneId, position = 50 }) {
  const scenes = useScenes();
  const [active, setActive] = useState(sceneId);
  if (!scenes) return <div className="scn scn--loading"><span className="mv__spinner" /></div>;
  // Only a scene listed in the metadata is shown; with none, there is nothing to compare.
  const scene = scenes.find((s) => s.id === (active || sceneId));
  if (!scene) return null;

  const ex = scene.variants.existing;
  const pr = scene.variants.proposed;
  const ready = ex.status === "ready" && pr.status === "ready";

  if (ready) {
    return (
      <div className="scn scn--ready">
        <img className="scn__img" src={resolve(ex.src)} alt={`Today: ${scene.title}`} />
        <img className="scn__img" src={resolve(pr.src)} alt={`Proposed, Alternative ${pr.option}: ${scene.title}`} style={{ clipPath: `inset(0 0 0 ${position}%)` }} />
        <div className="scn__note glass">
          <span className="badge badge--warning">Simulated render</span>
          <span className="t-caption">{scene.title} · camera {scene.camera.headingDegrees}° at {scene.camera.heightMeters} m</span>
        </div>
      </div>
    );
  }

  return (
    <div className="scn">
      <div className="scn__pending panel-float">
        <span className="badge badge--outline badge--plain">Renders in production</span>
        <h3 className="t-h3">Street-level before and after isn't ready yet</h3>
        <p className="t-compact t-muted">Each comparison needs two renders from one fixed camera, so only the proposal changes. Forma won't pair unrelated photos.</p>
        <div className="scn__scenes" role="radiogroup" aria-label="Scenes">
          {scenes.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={s.id === scene.id} className="rowbtn" onClick={() => setActive(s.id)}>
              <Icon name="eye" />
              <span className="rowbtn__main">
                <span className="rowbtn__title">{s.title}</span>
                <span className="rowbtn__sub t-mono">{s.camera.lngLat[1].toFixed(5)}, {s.camera.lngLat[0].toFixed(5)} · {s.camera.headingDegrees}° · {s.camera.heightMeters} m · {s.camera.fovDegrees}° FOV</span>
              </span>
            </button>
          ))}
        </div>
        <dl className="scn__status">
          <div><dt>Existing</dt><dd>{ex.status === "ready" ? "Ready" : "Pending"} · {ex.basis}</dd></div>
          <div><dt>Proposed</dt><dd>{pr.status === "ready" ? "Ready" : "Pending"} · Alternative {pr.option} {pr.proposalVersion}</dd></div>
        </dl>
      </div>
    </div>
  );
}
