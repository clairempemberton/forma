# Forma

A concept for planning streets in the open: see what's changing on Portland's streets and parks,
compare a project's alternatives on the real street, comment on the exact spot, and follow what
happened to what people said.

**Live demo:** https://clairempemberton.github.io/forma/

> Unofficial concept. Not affiliated with the City of Portland, PBOT, Portland Parks & Recreation or
> TriMet. Project facts are cited to their official pages; resident comments are samples.

## What's real

- **The projects.** Nine current and recent Portland projects with their real stage, figures and a
  link to the official page (`src/data/projects.js`).
- **SE Hawthorne Pave & Paint**, the fully built project. PBOT's four 2020 alternatives are drawn on
  the real street between SE 35th Pl and César E. Chávez Blvd from the lane and island widths in the
  [Decision Report](https://www.portland.gov/sites/default/files/2021/hawthorne-pave-and-paint-decision-final.pdf).
  The round 2 survey (1,002 respondents), the decision and its reasons, the timeline and the
  before/after results from the
  [Evaluation Report](https://www.portland.gov/transportation/vision-zero/documents/se-hawthorne-boulevard-projects-evaluation-report-2023-updated)
  are cited in `src/data/hawthorne.js`.
- **Existing conditions** come from OpenStreetMap (`src/data/osm-existing.json`, refresh with `npm run osm`).

## What's sample

Individual resident comments, the staff triage queue and anything you submit. The commenting flow is a
replay of round 2 (September–November 2020). There is no server: drafts and comments stay in your
browser's local storage.

## Run it

```bash
npm install
npm run dev        # http://localhost:5191
npm test           # search, geocoding, geometry and project data
npm run build      # static build in dist/
npm run mockups    # portfolio screenshots in mockups/ (raw and device-framed)
```

Routes use the hash (`#/projects/hawthorne/compare`), so any static host works without rewrites.

## Map tokens

Optional. Create `.env.local` (gitignored):

```
VITE_MAPBOX_ACCESS_TOKEN=pk.your-public-token
```

| View | With tokens | Without |
| --- | --- | --- |
| Map | Mapbox Standard | MapLibre + OpenFreeMap Liberty |
| Satellite | Mapbox Standard Satellite | Setup message |
| 3D | Mapbox 3D buildings and terrain | MapLibre with OSM building heights |

Search falls back from project text to place lookup (Mapbox Geocoding, or Photon without a token).
Use a URL-restricted public Mapbox token for anything you deploy: Vite inlines `VITE_*` values into the build.

## Deploy

`.github/workflows/pages.yml` builds and publishes to GitHub Pages on every push to `main`.
Add `VITE_MAPBOX_ACCESS_TOKEN` as a repository secret, and set
Pages → Source to "GitHub Actions".

## Data credits

Map data © OpenStreetMap contributors (ODbL).
Project facts © their publishers, linked from each project.
