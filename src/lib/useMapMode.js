import { useSearchParams } from "react-router-dom";

const VALID = ["map", "satellite", "3d", "street"];

// The map view lives in the URL (?view=3d) so it survives reloads and can be shared.
export function useMapMode(fallback = "map") {
  const [params, setParams] = useSearchParams();
  const v = params.get("view");
  const mode = VALID.includes(v) ? v : fallback;
  const setMode = (next) => {
    const p = new URLSearchParams(params);
    if (next === fallback) p.delete("view"); else p.set("view", next);
    setParams(p, { replace: true });
  };
  return [mode, setMode];
}

// Generic single search param, e.g. the selected feature or option.
export function useParam(name, fallback = null) {
  const [params, setParams] = useSearchParams();
  const value = params.get(name) ?? fallback;
  const set = (next) => {
    const p = new URLSearchParams(params);
    if (next == null || next === fallback) p.delete(name); else p.set(name, next);
    setParams(p, { replace: true });
  };
  return [value, set];
}
