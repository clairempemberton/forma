import { useLayoutEffect, useRef, useState } from "react";
import { MODES } from "./engine.js";
import Icon from "../components/Icon.jsx";

// MAP | SATELLITE | 3D — a radiogroup with a sliding thumb.
export default function ModeSwitch({ value, onChange, modes = MODES, label = "Map view" }) {
  const refs = useRef({});
  const [thumb, setThumb] = useState(null);

  useLayoutEffect(() => {
    const el = refs.current[value];
    if (el) setThumb({ x: el.offsetLeft, w: el.offsetWidth });
  }, [value, modes]);

  const onKey = (e) => {
    const i = modes.findIndex((m) => m.id === value);
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (e.key === "Home" || e.key === "End" || d) {
      e.preventDefault();
      const next = e.key === "Home" ? 0 : e.key === "End" ? modes.length - 1 : (i + d + modes.length) % modes.length;
      onChange(modes[next].id);
      refs.current[modes[next].id]?.focus();
    }
  };

  return (
    <div className="seg seg--glass seg--mono mode-switch" role="radiogroup" aria-label={label} onKeyDown={onKey}>
      {thumb && <span className="seg__thumb" style={{ width: thumb.w, transform: `translateX(${thumb.x - 3}px)`, left: 3 }} aria-hidden="true" />}
      {modes.map((m) => (
        <button
          key={m.id}
          ref={(el) => (refs.current[m.id] = el)}
          type="button"
          role="radio"
          aria-checked={value === m.id}
          tabIndex={value === m.id ? 0 : -1}
          className="seg__btn"
          onClick={() => onChange(m.id)}
        >
          <Icon name={m.icon} />
          <span className="mode-switch__label">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
