// Project directory. Locations are real Portland intersections (OpenStreetMap);
// every project, status and number is fictional demo content.
import { PROJECT } from "./alder.js";

export const PROJECTS = [
  {
    ...PROJECT,
    lngLat: PROJECT.place.coordinates,
    area: "Buckman",
    topic: "Streets and crossings",
    dates: "Round 2 closes Nov 15, 2026",
    access: "Text-only version · 3 languages",
    live: true,
  },
  {
    id: "belmont-12th",
    title: "Belmont & 12th Bus Stop",
    status: "Decision published",
    statusTone: "ink",
    area: "Buckman",
    topic: "Transit",
    summary: "A stop rebuilt with a shelter and level boarding. See what changed after round 1.",
    lngLat: [-122.6536639, 45.5165004],
    dates: "Decided Jun 2026",
    access: "Text-only version · 4 languages",
  },
  {
    id: "laurelhurst-north",
    title: "Laurelhurst Park North Entrance",
    status: "Exploring",
    statusTone: "neutral",
    area: "Laurelhurst",
    topic: "Parks and public space",
    summary: "Early ideas for a path, lighting and seating. Tell the team what you use it for.",
    lngLat: [-122.6268523, 45.5211348],
    dates: "Ideas open to Dec 4",
    access: "Printed packet at the library",
  },
  {
    id: "broadway-7th",
    title: "Broadway & 7th Signal Timing",
    status: "Feedback open",
    statusTone: "accent",
    area: "Irvington",
    topic: "Streets and crossings",
    summary: "Longer walk signals and a leading pedestrian interval at a wide crossing.",
    lngLat: [-122.6586074, 45.5350585],
    dates: "Closes Dec 1, 2026",
    access: "Text-only version",
  },
  {
    id: "division-50th",
    title: "Division & 50th Crossing",
    status: "In review",
    statusTone: "warning",
    area: "Richmond",
    topic: "Streets and crossings",
    summary: "Comments are being grouped into themes. Answers are published here first.",
    lngLat: [-122.6111176, 45.5053071],
    dates: "Review until Nov 20",
    access: "Text-only version · 2 languages",
  },
].map((p) => ({ ...p, truth: "illustrative" }));

export const projectById = (id) => PROJECTS.find((p) => p.id === id);
