# Forma

A participatory urban design prototype: explore a proposed street change on a real corner,
compare options, comment on the exact spot, and follow what happened to what you said.

**The place is real; the project is not.** The streets are SE Alder St & SE 8th Ave in Portland's
Central Eastside (Buckman), taken from OpenStreetMap. The project, its options, the comments, the
themes, the staff and every outcome are fictional and labelled that way in the interface.

## Run it

```bash
npm install
npm run dev           # http://localhost:5191
npm run build         # writes the static build to dist/
npm test              # unit tests (geometry, clustering)
```

Routes use the hash (`/forma/#/projects/alder-8th/compare`), so any static host works without rewrites.

## Map providers

| View | With tokens | Without tokens |
| --- | --- | --- |
| Map | Mapbox Standard, default (color) theme | MapLibre + OpenFreeMap Liberty (OSM data, no key) |
| Satellite | Mapbox Standard Satellite (licensed imagery) | Labelled setup state; no substitute imagery |
| 3D | Mapbox Standard with 3D buildings, terrain, lighting | MapLibre with OSM building heights extruded |
| Street | Mapillary photos nearest the spot (≤ 60 m) | Labelled setup state + link to Mapillary |

### Tokens

Create `.env.local` in this folder (it is gitignored):

```
VITE_MAPBOX_ACCESS_TOKEN=pk.your-public-token
VITE_MAPILLARY_ACCESS_TOKEN=MLY|your-client-token
```

- **Mapbox:** account.mapbox.com → Tokens → create a *public* token (`pk.`) with the default
  public scopes. Add URL restrictions for your domains (e.g. `https://yourdomain.com/forma/*` and
  `http://localhost:5191/*`). Never use a secret `sk.` token here.
- **Mapillary:** mapillary.com/dashboard/developers → register an application → copy the *client
  token*. Imagery is CC BY-SA 4.0; Forma credits each photo's creator under the viewer.

Vite inlines `VITE_*` values into the build, so a token used for `npm run build` ends up in `dist/`.
That is expected for public tokens; rely on URL restrictions, and rebuild without the variables if
you'd rather not publish one.

## Data

- `src/data/osm-existing.json` — real features within 260 m of the corner (sidewalks, crossings,
  stop signs, trees, bus stops). Refresh with `npm run osm`. © OpenStreetMap contributors, ODbL.
- `src/data/alder.js` — the fictional project: options A/B/C as GeoJSON authored in local metres on
  the real street grid, versions, comments, themes, decision, timeline. Each fact is tagged
  `osm`, `estimate` or `illustrative`.
- Layers stay separate: `f-osm` (existing), `f-proposal` (selected option), DOM markers (comments,
  features), `f-focus`/`f-mask` (spatial focus).

## Street-level renders

`public/urban-scenes/` holds the Blender pipeline: `metadata/*.json` fixes each scene's camera
(location, eye height, heading, pitch, FOV) and environment; renders go in `existing/`, `proposed/`
and `alternatives/` as 2400×1350 WebP. A comparison appears only when both sides of the same scene
are `ready`; until then the Street view in Compare shows what's pending. Renders are always labelled
"Simulated render".

## What's simulated

No server. Drafts, submitted comments, staff triage and "publish" live in this browser's
localStorage (Reset demo clears them).
