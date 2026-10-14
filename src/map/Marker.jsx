import Icon from "../components/Icon.jsx";

const KIND_ICON = { transit: "bus", bike: "bike", control: "flag", crossing: "walk", park: "tree", path: "walk", skate: "sparkle" };

// Accessible DOM markers placed over the map.
//   feature  — inspectable feature: dark ID chip with a label (X-01 · North crossing)
//   comment  — a resident comment: small grey speech pin
//   change   — a revision change: accent ring with number
//   project  — a project in the directory
export default function Marker({ m, onClick }) {
  const style = { transform: `translate(${m.x}px, ${m.y}px)` };
  const cls = ["mk", `mk--${m.kind}`, m.tone && `mk--${m.tone}`, m.featured && "is-featured", m.hover && "is-hover", m.selected && "is-selected", m.dim && "is-dim", m.mine && "is-mine"].filter(Boolean).join(" ");

  if (m.kind === "comment") {
    return (
      <button type="button" className={cls} style={style} onClick={onClick} aria-pressed={!!m.selected} aria-label={m.ariaLabel || `Comment: ${m.label}`}>
        <span className="mk__bubble"><Icon name="comment" /></span>
      </button>
    );
  }

  if (m.kind === "change") {
    return (
      <button type="button" className={cls} style={style} onClick={onClick} aria-pressed={!!m.selected} aria-label={m.ariaLabel || m.label}>
        <span className="mk__ring">{m.index}</span>
      </button>
    );
  }

  if (m.kind === "project") {
    return (
      <button type="button" className={cls} style={style} onClick={onClick} aria-pressed={!!m.selected} aria-label={m.ariaLabel || m.label}>
        <span className="mk__dot" />
        <span className="mk__label" aria-hidden="true">{m.label}</span>
      </button>
    );
  }

  // feature
  return (
    <button type="button" className={cls} style={style} onClick={onClick} aria-pressed={!!m.selected} aria-label={m.ariaLabel || `${m.fid} ${m.label}`}>
      <span className="mk__chip">
        {m.fid && <span className="fid">{m.fid}</span>}
        {KIND_ICON[m.featureKind] && !m.fid && <Icon name={KIND_ICON[m.featureKind]} />}
        {m.showLabel !== false && <span className="mk__text">{m.label}</span>}
      </span>
      <span className="mk__stem" aria-hidden="true" />
    </button>
  );
}
