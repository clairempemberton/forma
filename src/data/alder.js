// SE Alder St & SE 8th Ave, Buckman / Central Eastside, Portland, Oregon.
//
// Truth labels used throughout the app:
//   "osm"          — real, from OpenStreetMap (© OpenStreetMap contributors, ODbL), see osm-existing.json
//   "estimate"     — derived from OSM geometry with a stated assumption, not surveyed
//   "illustrative" — part of the fictional Forma demo project (proposals, comments, decisions, numbers)
//
// The place is real. The project, its options, the comments and every outcome are fictional.

import { makeFrame, polygon, rect, circle, line, point, collection, mirror } from "../lib/geo.js";

export const ORIGIN = [-122.65771, 45.51793];
export const F = makeFrame(ORIGIN);

// Assumed half-width of each roadway, curb to centreline. Estimated from the OSM sidewalk
// and crossing nodes (sidewalk centrelines sit 6–8 m from the street centreline).
const HALF = 5;
const BULB = 2.1; // how far a curb extension reaches into the roadway
const NARROW = HALF - BULB;

export const CAMERA = {
  home: { center: ORIGIN, zoom: 18.6, bearing: 0, pitch: 0 },
  overview: { center: F.toLngLat([0, -12]), zoom: 17.4, bearing: 0, pitch: 0 },
  three: { center: ORIGIN, zoom: 18.2, bearing: -28, pitch: 62 },
};

export const PLACE = {
  name: "SE Alder St & SE 8th Ave",
  short: "Alder & 8th",
  neighborhood: "Buckman · Central Eastside",
  city: "Portland, Oregon",
  coordinates: ORIGIN,
  source: "© OpenStreetMap contributors",
};

// ——— Existing conditions: inspectable features. Facts come from OSM tags. ———
export const EXISTING_FEATURES = [
  {
    id: "X-01", kind: "crossing", name: "North crossing", xy: [-0.3, 8.35], osm: "node/13181201885",
    summary: "Unmarked crossing of 8th Ave",
    facts: ["Mapped as an unmarked crossing, no painted markings (OSM)", "8th Ave has no stop sign here; Alder traffic stops (OSM)", "Crossing length about 10 m curb to curb (estimate)"],
  },
  {
    id: "X-02", kind: "crossing", name: "West crossing", xy: [-6.64, 0.1], osm: "node/13181202040",
    summary: "Unmarked crossing of Alder St",
    facts: ["Mapped as an unmarked crossing (OSM)", "Sits beside the westbound stop sign on Alder (OSM)", "Curb ramp type is not recorded in OSM"],
  },
  {
    id: "X-03", kind: "crossing", name: "South crossing", xy: [-0.34, -5.98], osm: "node/13181201951",
    summary: "Unmarked crossing of 8th Ave",
    facts: ["Mapped as an unmarked crossing (OSM)", "Leads toward the SE Morrison bus stops one block south (OSM)"],
  },
  {
    id: "X-04", kind: "crossing", name: "East crossing", xy: [6.33, 0.03], osm: "node/13181155709",
    summary: "Unmarked crossing of Alder St",
    facts: ["Mapped as an unmarked crossing (OSM)", "Beside the eastbound stop sign on Alder (OSM)"],
  },
  {
    id: "S-01", kind: "control", name: "Stop signs on Alder", xy: [10, 0.0], osm: "node/5067638976",
    summary: "Two-way stop; 8th Ave does not stop",
    facts: ["Stop signs on both Alder approaches (OSM nodes 5067638976, 5067638977)", "No traffic signal at this corner (OSM)"],
  },
  {
    id: "B-01", kind: "bike", name: "Bike route on Alder", xy: [-26, -1.6], osm: "way/48665495",
    summary: "No bike facility mapped on Alder",
    facts: ["Alder St carries no cycleway tag here (OSM)", "SE 7th Ave, one block west, has painted bike lanes (OSM)"],
  },
  {
    id: "T-01", kind: "transit", name: "SE Morrison & 9th bus stop", lngLat: [-122.6565854, 45.5173274], osm: "node/4101381208",
    summary: "Bench, no shelter",
    facts: ["Bus stop with a bench and no shelter (OSM)", "About 85 m from the corner (estimate)"],
  },
].map((f) => ({ ...f, lngLat: f.lngLat || F.toLngLat(f.xy), truth: "osm" }));

// ——— Proposal geometry, in local metres. All illustrative. ———
const L_CORNER = [[NARROW, 13], [HALF, 13], [HALF, HALF], [13, HALF], [13, NARROW], [NARROW, NARROW]];
const QUAD = { ne: [1, 1], nw: [-1, 1], se: [1, -1], sw: [-1, -1] };

const bulb = (q, id) => polygon(F, mirror(L_CORNER, ...QUAD[q]), { kind: "curb-extension", id, label: "Curb extension" });
const raised = (leg, id) => {
  const s = leg === "n" || leg === "e" ? 1 : -1;
  const ns = leg === "n" || leg === "s";
  return ns
    ? rect(F, -NARROW, s * 6.2, NARROW, s * 9.6, { kind: "raised-crossing", id, label: "Raised crossing" })
    : rect(F, s * 6.2, -NARROW, s * 9.6, NARROW, { kind: "raised-crossing", id, label: "Raised crossing" });
};
const tree = (xy, id) => point(F, xy, { kind: "tree-new", id, label: "New street tree" });
const treeCanopy = (xy) => circle(F, xy[0], xy[1], 2.4, { kind: "tree-canopy" }, 16);
const ramp = (xy, id) => point(F, xy, { kind: "curb-ramp", id, label: "Directional curb ramp" });
const bikeLane = (side, x0, x1, id) => {
  const s = side === "n" ? 1 : -1;
  return rect(F, x0, s * 3.2, x1, s * HALF, { kind: "bike-lane", id, label: "Protected bike lane" });
};
const separator = (side, x0, x1) => line(F, [[x0, (side === "n" ? 1 : -1) * 3.2], [x1, (side === "n" ? 1 : -1) * 3.2]], { kind: "separator" });
const bench = (x, y, rot = false) => (rot ? rect(F, x - 0.3, y - 0.9, x + 0.3, y + 0.9, { kind: "seating", label: "Bench" }) : rect(F, x - 0.9, y - 0.3, x + 0.9, y + 0.3, { kind: "seating", label: "Bench" }));

const NEW_TREES_A = [[16, 7], [24, 7], [-16, 7], [-24, 7], [16, -7], [-16, -7], [7, 18], [-7, -18]];
const NEW_TREES_B = [[18, 7.2], [-18, -7.2]];
const NEW_TREES_C = [[16, 7], [-16, 7], [16, -7], [7, 18]];

const shelterLocal = F.toLocal([-122.6565854, 45.5173274]);
const shelter = rect(F, shelterLocal[0] - 3, shelterLocal[1] + 0.6, shelterLocal[0] + 3, shelterLocal[1] + 2.1, { kind: "bus-shelter", id: "T-02", label: "Bus shelter" });

function optionA() {
  return collection([
    bulb("ne", "C-01"), bulb("nw", "C-02"), bulb("se", "C-03"), bulb("sw", "C-04"),
    raised("n", "X-11"), raised("s", "X-13"), raised("e", "X-14"), raised("w", "X-12"),
    NEW_TREES_A.map(treeCanopy), NEW_TREES_A.map((xy, i) => tree(xy, `G-${String(i + 1).padStart(2, "0")}`)),
    bench(9.5, 10.5), bench(10.5, 8.6, true),
    [[-2.2, 6.2], [2.2, 6.2], [-2.2, -6.2], [2.2, -6.2], [6.2, 2.2], [6.2, -2.2], [-6.2, 2.2], [-6.2, -2.2]].map((xy, i) => ramp(xy, `R-${i + 1}`)),
  ]);
}

function optionB() {
  return collection([
    bikeLane("n", 6.4, 60, "B-11"), bikeLane("n", -60, -6.4, "B-12"), bikeLane("s", 6.4, 60, "B-13"), bikeLane("s", -60, -6.4, "B-14"),
    separator("n", 6.4, 60), separator("n", -60, -6.4), separator("s", 6.4, 60), separator("s", -60, -6.4),
    rect(F, -HALF, 3.2, HALF, HALF, { kind: "crossbike", id: "B-15", label: "Bike crossing markings" }),
    rect(F, -HALF, -HALF, HALF, -3.2, { kind: "crossbike", id: "B-16", label: "Bike crossing markings" }),
    circle(F, 0, 0, 2.6, { kind: "traffic-circle", id: "K-01", label: "Mini traffic circle" }),
    raised("n", "X-11"), raised("s", "X-13"),
    NEW_TREES_B.map(treeCanopy), NEW_TREES_B.map((xy, i) => tree(xy, `G-${i + 1}`)),
    [[-2.2, 6.2], [2.2, 6.2], [-2.2, -6.2], [2.2, -6.2]].map((xy, i) => ramp(xy, `R-${i + 1}`)),
  ]);
}

function optionC(version = 2) {
  return collection([
    bulb("ne", "C-01"), bulb("sw", "C-04"),
    raised("n", "X-11"),
    version >= 2 && raised("s", "X-13"),
    bikeLane("s", 6.4, 60, "B-13"), bikeLane("s", -60, -6.4, "B-14"), separator("s", 6.4, 60), separator("s", -60, -6.4),
    rect(F, -HALF, -HALF, HALF, -3.2, { kind: "crossbike", id: "B-16", label: "Bike crossing markings" }),
    shelter,
    NEW_TREES_C.map(treeCanopy), NEW_TREES_C.map((xy, i) => tree(xy, `G-${i + 1}`)),
    version >= 2
      ? [ramp([-6.2, -2.2], "R-7"), ramp([-2.2, -6.2], "R-3")]
      : [point(F, [-5.6, -5.6], { kind: "curb-ramp", id: "R-0", label: "Diagonal curb ramp (v1)" })],
    version >= 2 && rect(F, -HALF, 18, -3.0, 30, { kind: "loading", id: "L-11", label: "Loading zone kept" }),
  ]);
}

// Project area: the block faces around the corner and the bus stop one block south.
export const BOUNDARY = collection([
  polygon(F, [[-48, 30], [48, 30], [48, -78], [-48, -78]], { kind: "boundary", label: "Project area" }),
]);

export const STREET_LABELS = collection([
  point(F, [-34, 0], { label: "SE ALDER ST", rotate: 0 }),
  point(F, [0, 34], { label: "SE 8TH AVE", rotate: 90 }),
]);

export const OPTIONS = [
  {
    id: "A", name: "Pedestrian priority", short: "Safer crossings",
    summary: "Curb extensions on all four corners shorten every crossing, and each crossing is raised to sidewalk height.",
    changes: ["Curb extensions on all four corners", "Four raised crossings", "Eight new street trees", "Directional curb ramps at every crossing", "Two benches on the northeast corner"],
    benefits: ["Crossing distance drops from about 10 m to about 6 m (estimate)", "Drivers slow at every leg, not just on Alder", "More shade on the north sidewalk"],
    tradeoffs: ["Removes roughly six on-street parking spaces near the corner (estimate)", "No dedicated space for bikes on Alder", "Larger delivery trucks turn more slowly"],
    geojson: optionA(),
  },
  {
    id: "B", name: "Cycling priority", short: "Protected bike lanes",
    summary: "Alder becomes a protected east–west bike route linking to the 7th Ave bike lanes, with a mini traffic circle to calm the corner.",
    changes: ["Protected bike lanes on both sides of Alder", "Bike crossing markings through the intersection", "Mini traffic circle at the centre", "Raised crossings on 8th Ave", "Two new street trees"],
    benefits: ["Continuous separated bike route across 8th", "Traffic circle slows turns from every direction", "Connects with existing bike lanes one block west (OSM)"],
    tradeoffs: ["Removes most on-street parking on Alder in the project area", "Crossings of Alder stay about 10 m long", "Large vehicles must drive around the circle"],
    geojson: optionB(),
  },
  {
    id: "C", name: "Balanced mobility", short: "Balanced",
    summary: "A mix: two curb extensions, raised crossings on 8th, an eastbound protected bike lane, and a sheltered bus stop on Morrison.",
    changes: ["Curb extensions on the northeast and southwest corners", "Raised crossings on the north and south legs", "Eastbound protected bike lane", "Shelter at the SE Morrison & 9th stop", "Loading zone on 8th kept"],
    benefits: ["Shorter crossings where people cross most", "Keeps loading access for businesses on 8th", "Adds the shelter the stop lacks today (OSM: no shelter)"],
    tradeoffs: ["Westbound cyclists still share the lane", "Two corners keep today's longer crossings", "Some parking removed on the south side of Alder"],
    geojson: optionC(2),
  },
];

export const OPTION_BY_ID = Object.fromEntries(OPTIONS.map((o) => [o.id, o]));

// Two versions of Option C, for the revision view.
export const VERSIONS = [
  { id: "v1", label: "Version 1", date: "2026-08-04", geojson: optionC(1), note: "Draft shared for comment." },
  { id: "v2", label: "Version 2", date: "2026-10-02", geojson: optionC(2), note: "Revised after the first comment period." },
];

export const REVISION_CHANGES = [
  { id: "RC-1", title: "Southwest curb ramp re-aimed", before: "One diagonal ramp pointing into the middle of the intersection", after: "Two directional ramps, one aligned with each crossing", themes: ["T-ACCESS"], lngLat: F.toLngLat([-5.6, -5.6]), status: "changed" },
  { id: "RC-2", title: "South crossing raised", before: "Painted crossing only", after: "Raised to sidewalk height, like the north crossing", themes: ["T-CROSS"], lngLat: F.toLngLat([0, -7.9]), status: "changed" },
  { id: "RC-3", title: "Loading zone on 8th kept", before: "Loading zone removed for a tree well", after: "Loading zone kept; tree moved 6 m south", themes: ["T-LOADING"], lngLat: F.toLngLat([-4, 24]), status: "changed" },
  { id: "RC-4", title: "Westbound protected lane", before: "Not included", after: "Still not included — the street is too narrow for both directions plus loading", themes: ["T-BIKE"], lngLat: F.toLngLat([-30, 4]), status: "not-changed" },
];

// The guided story. Each step names a camera and the layers it shows.
export const STORY = [
  { id: "today", title: "Explore the corner as it is", body: "Four unmarked crossings, stop signs on Alder only, and no bike space. Every fact here comes from OpenStreetMap.", camera: { center: ORIGIN, zoom: 18.7, bearing: 0, pitch: 0 }, show: { existing: true } },
  { id: "problem", title: "Understand the problem", body: "Traffic on 8th Ave does not stop, and nothing marks where people cross. The north crossing is the one people mentioned most.", camera: { center: F.toLngLat([0, 6]), zoom: 19.4, bearing: 0, pitch: 30 }, focus: "X-01", show: { existing: true, comments: true } },
  { id: "proposal", title: "See the proposed changes", body: "Option C, as revised, shortens two crossings, raises both crossings of 8th, and adds an eastbound protected bike lane.", camera: { center: ORIGIN, zoom: 18.5, bearing: -20, pitch: 50 }, option: "C", show: { proposal: true } },
  { id: "compare", title: "Compare the alternatives", body: "Options A and B make different trades between walking, cycling, parking and loading. Same corner, same camera.", camera: { center: ORIGIN, zoom: 18.4, bearing: 0, pitch: 0 }, option: "A", show: { proposal: true } },
  { id: "feedback", title: "Tell the team what matters", body: "Drop a pin on the exact spot. Your comment stays private until you choose to publish it.", camera: { center: ORIGIN, zoom: 18.2, bearing: 0, pitch: 0 }, show: { comments: true } },
];

// ——— Themes and sample resident comments (fictional). ———
export const THEMES = [
  { id: "T-CROSS", name: "Crossing 8th feels unsafe", count: 41, color: "accent", response: "Both crossings of 8th are now raised in version 2.", status: "addressed" },
  { id: "T-ACCESS", name: "Curb ramps and wheelchair access", count: 23, color: "accent", response: "The southwest ramp now points along each crossing.", status: "addressed" },
  { id: "T-BIKE", name: "Bike connection to 7th Ave", count: 31, color: "accent", response: "Eastbound lane added; westbound is not possible without removing loading.", status: "partly" },
  { id: "T-LOADING", name: "Deliveries and loading", count: 18, color: "accent", response: "Loading zone on 8th kept.", status: "addressed" },
  { id: "T-SHADE", name: "Shade and street trees", count: 14, color: "accent", response: "Four new trees in Option C; the team is checking utility lines before adding more.", status: "open" },
  { id: "T-TRANSIT", name: "Waiting at the Morrison bus stop", count: 11, color: "accent", response: "Shelter included at SE Morrison & 9th.", status: "addressed" },
];
export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]));

const C = (id, xy, theme, text, extra = {}) => ({ id, lngLat: F.toLngLat(xy), theme, text, sentiment: "concern", option: null, date: "2026-08-20", author: "Resident", ...extra });

export const SAMPLE_COMMENTS = [
  C("c01", [-0.5, 8.6], "T-CROSS", "Cars on 8th don't slow down here. I wait a long time to cross with my kids.", { date: "2026-08-07" }),
  C("c02", [0.8, 8.2], "T-CROSS", "Nothing tells drivers this is a crossing. Paint at least, please.", { date: "2026-08-09" }),
  C("c03", [-1.2, 9.1], "T-CROSS", "Raised crossing would help a lot — the north side is where the café line spills out.", { option: "A", sentiment: "support", date: "2026-08-11" }),
  C("c04", [-5.8, -5.8], "T-ACCESS", "The ramp on this corner points into the middle of the intersection. My chair rolls toward traffic.", { date: "2026-08-12", author: "Resident · uses a wheelchair" }),
  C("c05", [-5.2, -6.3], "T-ACCESS", "Please make sure both ramps line up with the crossings.", { date: "2026-08-14" }),
  C("c06", [-25, 4], "T-BIKE", "Westbound on Alder I have to merge with cars. A lane both ways would connect me to 7th.", { option: "B", sentiment: "support", date: "2026-08-15" }),
  C("c07", [-32, -3.5], "T-BIKE", "Option B is the only one that actually links to the 7th Ave lanes.", { option: "B", sentiment: "support", date: "2026-08-16" }),
  C("c08", [22, -3.8], "T-BIKE", "Eastbound lane is great. Don't let it end in a door zone.", { option: "C", date: "2026-08-17" }),
  C("c09", [-4.2, 22], "T-LOADING", "We get two deliveries a day on 8th. Without the loading zone trucks will double-park.", { date: "2026-08-18", author: "Business owner" }),
  C("c10", [-3.6, 26], "T-LOADING", "Keep loading, move the tree a bit — both can fit.", { date: "2026-08-19" }),
  C("c11", [16, 7.5], "T-SHADE", "This block is baking in August. More trees, please.", { option: "A", sentiment: "support", date: "2026-08-21" }),
  C("c12", [-16, 7.5], "T-SHADE", "Check for the overhead lines before planting here.", { date: "2026-08-22" }),
  C("c13", [...F.toLocal([-122.6565854, 45.5173274])].map((v, i) => v + (i ? 1.5 : 0)), "T-TRANSIT", "No shelter at this stop. It's miserable in the rain.", { date: "2026-08-23" }),
  C("c14", [...F.toLocal([-122.6565854, 45.5173274])].map((v, i) => v + (i ? -1 : 2)), "T-TRANSIT", "A shelter here would be the single most useful change for me.", { option: "C", sentiment: "support", date: "2026-08-24" }),
  C("c15", [6.6, 0.4], "T-CROSS", "Crossing Alder is fine — it's 8th that's the problem.", { sentiment: "neutral", date: "2026-08-25" }),
  C("c16", [0.2, -6.4], "T-CROSS", "South crossing needs the same treatment as the north one.", { date: "2026-08-26" }),
  C("c17", [0.0, 0.0], "T-BIKE", "A traffic circle here would slow everyone down. Like it.", { option: "B", sentiment: "support", date: "2026-08-27" }),
  C("c18", [9.8, 10.8], "T-SHADE", "Benches would be nice if they're in the shade.", { option: "A", sentiment: "support", date: "2026-08-28" }),
  C("c19", [-6.8, -0.4], "T-ACCESS", "Tactile paving on every ramp, please.", { date: "2026-08-29" }),
  C("c20", [12, -4.6], "T-LOADING", "Parking loss on the south side worries me for the shops.", { option: "C", date: "2026-08-30" }),
  C("c21", [2.2, 12], "T-CROSS", "Visibility around parked cars on the northeast corner is poor.", { date: "2026-08-31" }),
  C("c22", [-2.5, -12], "T-SHADE", "Good to see trees, but keep sight lines clear at the corner.", { sentiment: "neutral", date: "2026-09-01" }),
].map((c) => ({ ...c, truth: "illustrative", public: true }));

export const DECISION = {
  status: "Round 1 decision published",
  date: "2026-09-30",
  chosen: "C",
  version: "v2",
  body: "After round 1, the (fictional) Eastside Streets Committee chose to take Option C forward, revised as version 2. It shortens the crossings people raised most, keeps loading on 8th, and adds the bus shelter. Version 2 is open for a second round of comments before final design.",
  notAdopted: [{ title: "Westbound protected bike lane", reason: "With loading kept on 8th, there is not enough width for a second protected lane. The team will revisit this when the block is repaved." }, { title: "Option B's traffic circle", reason: "Fire and freight access tests showed large vehicles could not turn around it without mounting the curb." }],
  unresolved: ["Whether overhead utility lines allow more trees on the north side", "Signal timing at SE Morrison & 7th, outside this project"],
};

export const TIMELINE = [
  { date: "2026-07-14", title: "Project announced", body: "Initial walk audit with neighbours.", status: "done" },
  { date: "2026-08-04", title: "Round 1 opened", body: "Three options and version 1 of Option C opened for comment.", status: "done" },
  { date: "2026-09-12", title: "Round 1 closed", body: "138 comments grouped into six themes and answered in public.", status: "done" },
  { date: "2026-09-30", title: "Round 1 decision", body: "Option C chosen to take forward, revised as version 2.", status: "done" },
  { date: "2026-10-02", title: "Round 2 opened", body: "Version 2: three changes made in response to comments, one request not adopted.", status: "current" },
  { date: "2026-11-15", title: "Round 2 closes", body: "Final comments on version 2.", status: "upcoming" },
  { date: "2027-04-01", title: "Construction (planned)", body: "Timing depends on the repaving schedule.", status: "upcoming" },
];

export const EVIDENCE = [
  { title: "Why shorter crossings help", body: "A shorter crossing means less time in the roadway. Curb extensions also make people waiting to cross easier for drivers to see.", source: "General planning practice; not a study of this corner." },
  { title: "Why raise a crossing", body: "A raised crossing works like a speed table: drivers slow to go over it, and people crossing stay at sidewalk level.", source: "General planning practice; not a study of this corner." },
  { title: "What we know about this corner", body: "OpenStreetMap shows four unmarked crossings, stop signs on Alder only and no bike facility. Traffic counts and crash records for this corner are not part of this demo.", source: "OpenStreetMap; fictional project." },
];

export const PROJECT = {
  id: "alder-8th",
  title: "Alder & 8th: Safer Crossings",
  status: "Feedback open",
  statusTone: "accent",
  round: "Round 2 of 2",
  place: PLACE,
  summary: "Three options to shorten crossings and connect a bike route at a busy Central Eastside corner. Real streets, fictional project.",
  team: "Eastside Streets team (fictional)",
  closes: "2026-11-15",
};
