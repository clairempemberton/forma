# Urban scenes

Street-level visualisations for Forma's before/after views. Every variant of a scene
shares one camera, one set of buildings and street geometry, and one lighting setup;
only the proposed interventions change.

```
existing/      today, rendered or photographed from the scene camera
proposed/      the selected option, same camera
alternatives/  other options, same camera
metadata/      one JSON file per scene (+ index.json listing them)
```

Metadata fields: `camera` (lngLat, heightMeters, headingDegrees, pitchDegrees, fovDegrees),
`variants.existing|proposed` (`status`: pending | ready, `src`, `classification`: real | simulated,
`basis`, `attribution`), `alternatives`, `version`, `project`.

Renders: 2400×1350 WebP, quality 82, sRGB. A variant only appears in the app once its
`status` is `ready` and both sides of a comparison exist. Simulated renders are always
labelled as such in the interface.
