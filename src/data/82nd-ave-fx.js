// 82nd Avenue Transit Project (Line 72 to FX), focus on SE 82nd Ave from SE Ash St to SE Morrison St, Portland, Oregon.
//
// Truth labels used throughout the app (see hawthorne.js):
//   "source"       — stated in a cited TriMet, Metro or PBOT document (see SOURCES)
//   "osm"          — real, from OpenStreetMap (© OpenStreetMap contributors, ODbL), see osm-82nd-ave-fx.json
//   "estimate"     — derived from PBOT's corridor-typical widths or OSM geometry with a stated assumption
//   "illustrative" — a concept drawing of a TriMet scenario; lane widths are PBOT's corridor-typical figures,
//                    not a published design for this block
//   "sample"       — sample resident comments; not real people
//
// TriMet presented the scenarios by name. The numbers 1–4 are Forma's, in the order TriMet listed them.
// Forma is an unofficial concept. It is not affiliated with TriMet, Metro, PBOT or the City of Portland.

import { makeFrame, rect, line, point, collection } from "../lib/geo.js";

// SE 82nd Ave & SE Stark St, on the centreline between 82nd's two carriageways (estimate from OSM node 40624085).
export const ORIGIN = [-122.57908, 45.519135];
export const F = makeFrame(ORIGIN);

export const SOURCES = {
  decision: { title: "Policy & Budget Committee notes: the bus lane decision", publisher: "TriMet", date: "February 13, 2026", url: "https://trimet.org/82nd/pdf/policybudget/2026-02-13/2026_02_13_notes.pdf" },
  lanedesign: { title: "Lane Design Proposal", publisher: "TriMet", date: "April 2025", url: "https://trimet.org/82nd/lanedesign.htm" },
  engagement: { title: "2025 Public Outreach and Engagement Summary Report", publisher: "TriMet", date: "November 2025", url: "https://trimet.org/82nd/pdf/2025-Community-Engagement-Report.pdf" },
  options: { title: "Policy & Budget Committee presentation: BAT lane options", publisher: "TriMet, with ODOT", date: "January 16, 2026", url: "https://trimet.org/82nd/pdf/policybudget/1-16-25/2026-1-16%20presentation.pdf" },
  scope: { title: "Policy & Budget Committee presentation: full scope confirmed", publisher: "TriMet", date: "August 10, 2026", url: "https://trimet.org/82nd/pdf/policybudget/2026-08-10/2026_08_10_presentation.pdf" },
  concept: { title: "Draft Concept Design, July 2026", publisher: "TriMet and PBOT", date: "July 2026", url: "https://trimet.org/82nd/pdf/82nd-Improvements-July2026.pdf" },
  project: { title: "82nd Avenue Transit Project", publisher: "TriMet", date: "fetched October 2026", url: "https://trimet.org/82nd/" },
  pbot: { title: "Building a Better 82nd: What's 82nd", publisher: "PBOT", date: "n.d.", url: "https://www.portland.gov/transportation/planning/82nd-avenue/building-better-82nd-avenue-online-open-house/3-whats-82nd" },
  osm: { title: "OpenStreetMap", publisher: "OpenStreetMap contributors (ODbL)", date: "fetched October 2026", url: "https://www.openstreetmap.org/#map=18/45.51914/-122.57902" },
};

// ——— Street geometry, in local metres: x east, y north along 82nd. ———
// PBOT: 82nd is typically 56–60 ft curb to curb, two 11–12 ft lanes each way and a 10 ft center turn lane.
// Drawn here at 56 ft: four 11.5 ft lanes and a 10 ft center lane (estimate; this block's width isn't published).
const FT = 0.3048;
const HALF = 28 * FT;
const LANE = 11.5 * FT;
const CTR = 5 * FT;
const Y0 = -258;
const Y1 = 232;

// Cross streets, from OSM nodes shared with 82nd (metres north of Stark). Stark and Washington are a one-way couplet.
export const CROSS_STREETS = [
  { name: "Ash St", y: 219, half: 5 },
  { name: "Pine St", y: 146, half: 5 },
  { name: "Oak St", y: 75, half: 5 },
  { name: "Stark St", y: 0, half: 8 },
  { name: "Washington St", y: -82, half: 8 },
  { name: "Alder St", y: -164, half: 5 },
  { name: "Morrison St", y: -246, half: 5 },
];
const STARK = 0, WASH = -82, ALDER = -164, MORRISON = -246;

// Split [a, b] around intersections so lanes stop at cross streets.
function spans(a, b) {
  const out = [];
  let s = a;
  for (const c of [...CROSS_STREETS].sort((p, q) => p.y - q.y)) {
    if (c.y + c.half <= s || c.y - c.half >= b) continue;
    if (c.y - c.half > s) out.push([s, c.y - c.half]);
    s = Math.max(s, c.y + c.half);
  }
  if (s < b) out.push([s, b]);
  return out;
}
const band = (x0, x1, props, a = Y0, b = Y1) => spans(a, b).map(([s, e]) => rect(F, x0, s, x1, e, props));
const stripe = (x, props, a = Y0, b = Y1) => spans(a, b).map(([s, e]) => line(F, [[x, s], [x, e]], props));
const minus = (ranges, holes) => ranges.flatMap(([a, b]) => {
  let out = [[a, b]];
  for (const [h0, h1] of holes) out = out.flatMap(([s, e]) => (h1 <= s || h0 >= e ? [[s, e]] : [[s, Math.max(s, h0)], [Math.min(e, h1), e]].filter(([p, q]) => q - p > 0.5)));
  return out;
});

// FX station pair "SE Stark St": platforms on both curbs just north of Stark (read off the not-to-scale
// July 2026 concept map, position approximate).
const platforms = () => [
  rect(F, -HALF - 2.6, 20, -HALF, 45, { kind: "bus-shelter", id: "FX-1", label: "FX station platform, southbound (position approximate)" }),
  rect(F, HALF, 20, HALF + 2.6, 45, { kind: "bus-shelter", id: "FX-2", label: "FX station platform, northbound (position approximate)" }),
];
// Curb ramps at Stark, Washington, Alder and Morrison (July 2026 concept map).
const ramps = () => [STARK, WASH, ALDER, MORRISON].flatMap((y, i) => {
  const c = CROSS_STREETS.find((s) => s.y === y);
  return [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy], j) => point(F, [sx * (HALF + 0.6), y + sy * (c.half + 1)], { kind: "curb-ramp", id: `R-${i * 4 + j + 1}`, label: "ADA curb ramp" }));
});
const lanesLines = () => [
  stripe(-HALF + LANE, { kind: "lane-line", label: "Two lanes each way" }), stripe(HALF - LANE, { kind: "lane-line" }),
  stripe(-CTR, { kind: "center-line" }), stripe(CTR, { kind: "center-line" }),
];
const centreLane = (holes = []) => minus(spans(Y0, Y1), holes).map(([a, b]) => rect(F, -CTR, a, CTR, b, { kind: "turn-lane", id: "CT-1", label: "Center turn lane" }));

// Scenario 1, the current project design: stations, signal priority and curb ramps; lanes as today.
function current() {
  return collection([lanesLines(), centreLane(), platforms(), ramps()]);
}

// Scenario 3, More BAT: the outer lane each way becomes a bus-and-turn lane, and between Stark and Washington the
// street is widened slightly for side-by-side left-turn lanes (amount of widening not published).
function moreBat({ medianThroughAlder = false, alderPocket = true } = {}) {
  const pocket = [WASH + 9, STARK - 9];
  const median = medianThroughAlder ? [MORRISON + 12, WASH - 14] : [MORRISON + 12, ALDER - 8];
  const alder = alderPocket ? [[ALDER + 6, ALDER + 40]] : [];
  return collection([
    band(-HALF, -HALF + LANE, { kind: "bus-lane", id: "BAT-1", label: "Bus and turn (BAT) lane, southbound" }),
    band(HALF - LANE, HALF, { kind: "bus-lane", id: "BAT-2", label: "Bus and turn (BAT) lane, northbound" }),
    stripe(-HALF + 2 * LANE - 0.2, { kind: "lane-line" }), stripe(HALF - 2 * LANE + 0.2, { kind: "lane-line" }),
    centreLane([pocket, median, ...alder]),
    rect(F, -CTR - 0.6, pocket[0], 0, pocket[1], { kind: "turn-lane", id: "LT-1", label: "Side-by-side left-turn lanes (street widened slightly)" }),
    rect(F, 0, pocket[0], CTR + 0.6, pocket[1], { kind: "turn-lane", id: "LT-2", label: "Side-by-side left-turn lanes (street widened slightly)" }),
    line(F, [[0, pocket[0]], [0, pocket[1]]], { kind: "center-line" }),
    spans(median[0], median[1]).map(([a, b]) => rect(F, -CTR + 0.3, a, CTR - 0.3, b, { kind: "refuge-island", id: "MD-1", label: "Landscaped median" })),
    alderPocket && rect(F, -CTR, ALDER + 6, CTR, ALDER + 40, { kind: "turn-lane", id: "LT-3", label: "Left-turn pocket into SE Alder" }),
    platforms(),
    ramps(),
  ]);
}

export const CAMERA = {
  home: { center: F.toLngLat([0, -12]), zoom: 16.9, bearing: 0, pitch: 0 },
  overview: { center: F.toLngLat([0, -12]), zoom: 16.9, bearing: 0, pitch: 0 },
  three: { center: F.toLngLat([0, -40]), zoom: 18.1, bearing: -30, pitch: 60 },
  compare: { center: F.toLngLat([0, -40]), zoom: 17.6, bearing: 0, pitch: 0 },
};

export const PLACE = {
  name: "SE 82nd Ave, SE Ash St to SE Morrison St",
  short: "82nd at Stark",
  neighborhood: "Montavilla",
  city: "Portland, Oregon",
  coordinates: ORIGIN,
  source: "© OpenStreetMap contributors",
};

// ——— Existing conditions: inspectable features, from OpenStreetMap. ———
export const EXISTING_FEATURES = [
  {
    id: "L-01", kind: "control", name: "82nd Avenue travel lanes", xy: [0, 110], osm: "way/394509660",
    summary: "Two lanes each way and a center turn lane",
    facts: ["Mapped as a primary road, OR 213, mostly 5 lanes (OSM)", "Typically 56–60 ft curb to curb, 11–12 ft lanes and a 10 ft center turn lane (PBOT)", "Ranked tenth for serious crashes among 181 corridors in the 2018 Regional Transportation Safety Strategy (TriMet)"],
  },
  {
    id: "S-ST", kind: "control", name: "Signal at SE Stark", lngLat: [-122.579019, 45.519135], osm: "node/40624085",
    summary: "Signal where westbound Stark crosses 82nd",
    facts: ["Signalized intersection with marked crossings (OSM)", "Stark (westbound) and Washington (eastbound) are a one-way couplet one block apart (OSM)"],
  },
  {
    id: "T-01", kind: "transit", name: "SE 82nd & Stark, southbound", lngLat: [-122.579218, 45.519294], osm: "node/7422900899",
    summary: "Line 72 stop with shelter and bench",
    facts: ["Bus stop with a shelter and a bench (OSM)", "The FX station pair “SE Stark St” is planned just north of Stark (TriMet)", "Line 72 has about 10,000 daily trips and the most delays of any TriMet line (TriMet)"],
  },
  {
    id: "T-02", kind: "transit", name: "SE 82nd & Stark, northbound", lngLat: [-122.57895, 45.519471], osm: "node/7422900922",
    summary: "Line 72 stop with a bench, no shelter",
    facts: ["Bus stop with a bench and no shelter (OSM)"],
  },
  {
    id: "T-15", kind: "transit", name: "SE Stark & 82nd", lngLat: [-122.579626, 45.519212], osm: "node/4184968613",
    summary: "Line 15 stop on Stark, with shelter",
    facts: ["Bus stop with a shelter, mapped with Line 15 (OSM)", "FX will connect to 20 other bus lines and MAX (TriMet)"],
  },
  {
    id: "S-WA", kind: "control", name: "Signal at SE Washington", lngLat: [-122.579101, 45.518393], osm: "node/40624089",
    summary: "Signal with accessible pedestrian signals",
    facts: ["Crossings have sound and vibration signals and tactile paving (OSM)", "TriMet kept a minor widening here for side-by-side left-turn lanes (TriMet, February 2026)"],
  },
  {
    id: "X-AL", kind: "crossing", name: "Crossing at SE Alder", lngLat: [-122.578856, 45.517655], osm: "node/9733196786",
    summary: "Unmarked crossing",
    facts: ["Mapped as an unmarked crossing (OSM)", "The July 2026 concept design shows new ADA curb ramps here (TriMet)"],
  },
  {
    id: "X-AS", kind: "crossing", name: "Crossing at SE Ash", lngLat: [-122.579013, 45.521042], osm: "node/6901339097",
    summary: "Marked crossing with a flashing beacon and refuge island",
    facts: ["Mapped as a marked crossing with push-button flashing lights and a refuge island (OSM)"],
  },
].map((f) => ({ ...f, lngLat: f.lngLat || F.toLngLat(f.xy), truth: "osm" }));

// Project area: 82nd and its sidewalks from SE Ash to just past SE Morrison.
export const BOUNDARY = collection([rect(F, -40, Y0 - 8, 40, Y1 + 8, { kind: "boundary", label: "Project area" })]);

export const STREET_LABELS = collection([
  point(F, [0, 190], { label: "SE 82ND AVE", rotate: 90 }),
  point(F, [-30, STARK], { label: "SE STARK ST", rotate: 0 }),
  point(F, [-30, WASH], { label: "SE WASHINGTON ST", rotate: 0 }),
  point(F, [-30, ALDER], { label: "SE ALDER ST", rotate: 0 }),
]);

export const OPTIONS = [
  {
    id: "1", name: "Current project design", short: "No BAT",
    summary: "FX stations near safe crossings, transit signal priority and longer buses with all-door boarding. No lanes change.",
    changes: ["Stations near safe crossings, with shelters, lighting and real-time information", "Transit signal priority at signals", "Two lanes each way and a center turn lane, as today", "New ADA curb ramps"],
    benefits: ["Buses 8–9 minutes faster on the 7-mile sample trip", "Driving times not affected", "Lowest risk to scope, schedule and budget"],
    tradeoffs: ["Harder for buses to stay on schedule as congestion grows"],
    geojson: current(),
  },
  {
    id: "2", name: "Some BAT lanes", short: "Some BAT",
    summary: "Turns a lane into a bus-and-turn lane for about 3 miles each way, NE Lombard–Tillamook and SE Foster–Clatsop. No bus lanes on this block.",
    changes: ["BAT lanes for about 3 miles each way, north of NE Tillamook and south of SE Foster", "No BAT lanes on this block", "Stations and signal priority as in the current design", "New ADA curb ramps"],
    benefits: ["Buses another 1–2 minutes faster", "Some improvement to reliability", "About 3 miles of sidewalk next to less traffic", "Lowest cost of the added tools"],
    tradeoffs: ["Drivers 1–2 minutes slower (TriMet's summary says 1–4)", "About 15% of peak-hour drivers would take another route"],
    geojson: current(),
  },
  {
    id: "3", name: "More BAT lanes", short: "More BAT",
    summary: "Turns the outer lane each way into a bus-and-turn lane for about 7 miles, NE Lombard to SE Clatsop. Between Stark and Washington the street widens slightly for side-by-side left turns.",
    changes: ["BAT lanes for about 7 miles each way, NE Lombard to SE Clatsop", "Outer lane for buses and right turns; cars use the inner lanes", "Slight widening for side-by-side left-turn lanes between Stark and Washington", "Stations and signal priority as in the current design", "New ADA curb ramps"],
    benefits: ["Buses another 3–4 minutes faster", "The most improvement to reliability", "About 7 miles of sidewalk next to less traffic", "Driveways stay reachable from the outer lane"],
    tradeoffs: ["Drivers 3–4 minutes slower", "20–25% of peak-hour drivers would take another route", "At least twice the cost of Some BAT"],
    geojson: moreBat(),
  },
  {
    id: "4", name: "Intersection widening", short: "Widening",
    summary: "Widens 82nd for a few blocks near SE Powell, Holgate and Foster to fit BAT lanes and keep every lane. Nothing changes on this block.",
    changes: ["Widening near SE Powell, Holgate and Foster for BAT lanes there", "Up to 7 lanes to cross at widened intersections", "Buys three entire properties; some businesses relocate", "No change on this block"],
    benefits: ["Buses about 1 minute faster", "Drivers about 15 seconds faster"],
    tradeoffs: ["About 8 ft farther to cross at widened intersections", "More than four times the cost of Some BAT"],
    geojson: current(),
  },
];

export const OPTION_BY_ID = Object.fromEntries(OPTIONS.map((o) => [o.id, o]));

// More BAT on this block in the September 2025 draft and the July 2026 draft.
export const VERSIONS = [
  { id: "v1", label: "Sept 2025 draft", date: "2025-09-01", geojson: moreBat({ medianThroughAlder: true, alderPocket: false }), note: "More BAT as drawn in the September 2025 draft concept design." },
  { id: "v2", label: "July 2026 draft", date: "2026-07-01", geojson: moreBat(), note: "The July 2026 draft, after the February 2026 decision. TriMet's concept maps are marked “not drawn to scale”; the median and turn pockets here are read from them." },
];

export const REVISION_CHANGES = [
  { id: "RC-1", title: "Left turns between Stark and Washington", before: "One option: drop BAT lanes here, along about 0.6 mile, to save about $3.7 million", after: "BAT lanes kept, with a slight widening for side-by-side left-turn lanes so turn queues don't spill into through lanes", themes: ["T-BAT", "T-TRAFFIC"], lngLat: F.toLngLat([0, -41]), status: "changed" },
  { id: "RC-2", title: "Left turn into SE Alder", before: "A landscaped median ran through the Alder intersection (September 2025 draft)", after: "A left-turn pocket into Alder; the median starts south of Alder (July 2026 draft)", themes: ["T-BIZ"], lngLat: F.toLngLat([0, ALDER + 22]), status: "changed" },
  { id: "RC-3", title: "Crossings at every station", before: "Requests for safer crossings to reach the bus", after: "Every station paired with an enhanced or signalized crossing; 168 ADA curb ramps along the corridor", themes: ["T-WALK"], lngLat: F.toLngLat([HALF + 2, 32]), status: "changed" },
  { id: "RC-4", title: "Bus lanes only at peak times", before: "Some people asked for BAT lanes only during rush hours", after: "TriMet's published documents don't record a response", themes: ["T-BAT"], lngLat: F.toLngLat([-HALF + 2, -120]), status: "not-changed" },
];

// The guided story. Each step names a camera and the layers it shows.
export const STORY = [
  { id: "today", title: "82nd today", body: "Two lanes each way and a center turn lane, with Line 72 stops at Stark. Every fact on the map comes from OpenStreetMap.", camera: CAMERA.home, show: { existing: true } },
  { id: "problem", title: "Why it's changing", body: "Line 72 has about 10,000 daily trips and the most delays of any TriMet line. From 2015 to 2020, 82nd had 2,698 injury crashes and 15 deaths.", camera: { center: F.toLngLat([0, 10]), zoom: 18.6, bearing: 0, pitch: 30 }, focus: "T-01", show: { existing: true, comments: true } },
  { id: "proposal", title: "The chosen design", body: "More BAT lanes: the outer lane each way for buses and turns, and side-by-side left turns between Stark and Washington.", camera: { center: F.toLngLat([0, -40]), zoom: 18, bearing: -20, pitch: 50 }, option: "3", show: { proposal: true } },
  { id: "compare", title: "The other scenarios", body: "Some BAT and intersection widening would leave this block as it is. Same street, different trade-offs along the corridor.", camera: CAMERA.home, option: "2", show: { proposal: true } },
  { id: "feedback", title: "What people said", body: "More than 1,500 people weighed the bus lane scenarios in spring 2025. Drop a pin to try the feedback flow yourself.", camera: CAMERA.home, show: { comments: true } },
];

// ——— Themes: what TriMet reported hearing in 2025, and its responses. ———
const THEME_LIST = [
  { id: "T-WALK", name: "Safe crossings to reach the bus", short: "Crossings", icon: "walk", response: "Every FX station is paired with an enhanced or signalized crossing, with 168 ADA curb ramps, about 2 miles of sidewalk upgrades and lighting at every platform.", status: "addressed" },
  { id: "T-BAT", name: "Bus lanes, the full length", short: "Bus lanes", icon: "bus", response: "TriMet's General Manager directed BAT lanes along nearly all seven miles from NE Lombard to SE Clatsop, except near SE Powell.", status: "addressed" },
  { id: "T-WIDEN", name: "Don't widen intersections", short: "No widening", icon: "alert", response: "Intersection widening at Powell, Holgate and Foster isn't being pursued. At Powell, TriMet dropped the BAT lanes rather than widen.", status: "addressed" },
  { id: "T-BIZ", name: "Business access and visibility", short: "Businesses", icon: "truck", response: "TriMet says BAT lanes don't reduce business access; right turns into driveways stay allowed. Metro is leading an economic impact study, and TriMet commits to keeping businesses accessible and visible during construction.", status: "partly" },
  { id: "T-TRAFFIC", name: "Traffic spilling into neighborhoods", short: "Diversion", icon: "users", response: "ODOT and PBOT found diversion to city streets acceptable with planned improvements. BAT lanes were dropped at Powell, where ODOT standards would be exceeded.", status: "partly" },
  { id: "T-STOPS", name: "Where the stations go", short: "Stations", icon: "pin", response: "Platforms are usually placed just past an intersection, next to a safe crossing.", status: "addressed" },
];

const C = (id, xy, theme, text, extra = {}) => ({ id, lngLat: F.toLngLat(xy), theme, text, sentiment: "concern", option: null, date: "2025-04-15", author: "Resident", ...extra });

// Sample comments written for this demo. They are not real people's words.
export const SAMPLE_COMMENTS = [
  C("f01", [-6, -164], "T-WALK", "Crossing at Alder means running across five lanes. There's nothing to stop traffic.", { date: "2025-04-08" }),
  C("f02", [7, -246], "T-WALK", "Morrison has no crossing at all. People cut across to the bus anyway.", { date: "2025-04-11" }),
  C("f03", [10, 30], "T-WALK", "A station is only as good as the crossing next to it.", { option: "1", sentiment: "idea", date: "2025-04-16" }),
  C("f04", [-6, 219], "T-WALK", "The flashing beacon at Ash works. More of these, please.", { sentiment: "support", date: "2025-05-15" }),
  C("f05", [-9, 60], "T-BAT", "The 72 crawls through here every afternoon. Full-length bus lanes or it won't get better.", { option: "3", sentiment: "support", date: "2025-04-09", author: "Line 72 rider" }),
  C("f06", [8, -120], "T-BAT", "Bus lanes only at rush hour would be a fair middle ground.", { option: "2", sentiment: "idea", date: "2025-05-20" }),
  C("f07", [-8, -30], "T-BAT", "Three or four minutes on every trip adds up to hours a month for me.", { option: "3", sentiment: "support", date: "2025-05-22", author: "Line 72 rider" }),
  C("f08", [9, 110], "T-BAT", "Walking next to a bus lane instead of traffic would feel a lot safer.", { option: "3", sentiment: "support", date: "2025-06-02" }),
  C("f09", [0, -5], "T-WIDEN", "Widening makes 82nd even harder to cross. Don't do it.", { option: "4", date: "2025-04-14" }),
  C("f10", [3, -90], "T-WIDEN", "Buying out businesses to add lanes is the wrong direction.", { option: "4", date: "2025-05-27" }),
  C("f11", [12, -140], "T-BIZ", "Customers need to turn in from both directions. Don't block the driveways with medians.", { date: "2025-04-17", author: "Business owner" }),
  C("f12", [-12, 160], "T-BIZ", "Construction already hurt us once. How will people find the entrance?", { date: "2025-05-16", author: "Business owner" }),
  C("f13", [11, -180], "T-BIZ", "Deliveries stop in the outer lane. Where do they go with a bus lane?", { option: "3", date: "2025-06-04", author: "Business owner" }),
  C("f14", [-20, 0], "T-TRAFFIC", "If drivers avoid 82nd, they'll cut through on 80th and 84th.", { option: "3", date: "2025-04-22" }),
  C("f15", [-20, -82], "T-TRAFFIC", "Washington already backs up at the light. Left turns need their own space.", { date: "2025-05-19" }),
  C("f16", [-9, 25], "T-STOPS", "Put the platform past the light so the bus doesn't stop twice.", { sentiment: "idea", date: "2025-04-24", author: "Line 72 rider" }),
  C("f17", [9, 40], "T-STOPS", "The transfer to the 15 on Stark should be short and covered.", { sentiment: "idea", date: "2025-05-28", author: "Line 72 rider" }),
  C("f18", [-8, -175], "T-STOPS", "Closing the Alder stop makes a long walk for older riders.", { option: "1", date: "2025-06-05" }),
].map((c) => ({ ...c, truth: "sample", public: true }));

export const THEMES = THEME_LIST.map((t) => ({ ...t, color: "accent", count: SAMPLE_COMMENTS.filter((c) => c.theme === t.id).length }));
export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]));

// Bus lane survey, April 7–25 and May 14 – June 6, 2025 (2025 Engagement Report, printed pp. 19–21).
export const SURVEY = {
  window: "spring 2025",
  groups: [
    { label: "More BAT lanes", respondents: "69%", result: "The highest positive response. 50% of 74 business and property owners" },
    { label: "Some BAT lanes", respondents: "58%", result: "A majority. 41% of business and property owners" },
    { label: "Intersection widening", respondents: "—", result: "Nearly 7 in 10 said not worth it. 68% of business and property owners said not worth it" },
  ],
  total: 1511,
  totalLabel: "1,500+",
  totalRow: false,
  glance: "More than 1,500 people weighed 3 bus lane tools",
  note: "Younger adults, people of color, lower-income respondents and frequent Line 72 riders backed More BAT most strongly; older adults, women and some people with disabilities leaned slightly toward Some BAT. The current design was the baseline, not a choice in the survey.",
  lead: "More than 1,500 people took TriMet's bus lane survey, April 7–25 and May 14 – June 6, 2025, giving 1,511 rankings. Each scenario was rated worth the trade-off or not.",
  caption: "Share of respondents who said each scenario was worth it",
  columns: ["Scenario", "Worth it", "What TriMet reported"],
};

// Not built: no evaluation results.
export const RESULTS = [];

export const DECISION = {
  headline: "TriMet chose More BAT lanes, except at SE Powell",
  whyLead: "TriMet's General Manager chose bus-and-turn lanes along nearly all seven miles, as the survey favored, and dropped them only at SE Powell, where the regulatory and cost risk was too high.",
  status: "Decision announced",
  date: "2026-02-13",
  chosen: "3",
  version: "v2",
  body: "On February 13, 2026, TriMet's General Manager directed design of BAT lanes along nearly all seven miles of 82nd from NE Lombard to SE Clatsop, except near SE Powell, including the minor widening at Stark and Washington. In August 2026 TriMet confirmed the full scope within a budget of about $346 million.",
  notAdopted: [
    { title: "BAT lanes at SE Powell", reason: "ODOT forecast the intersection at 1.03 of capacity in 2045 with no project and 1.07 with full BAT lanes, against a 0.85 target. Fixing that meant $15–20 million of widening or an uncertain design exception." },
    { title: "Intersection widening (4)", reason: "Nearly 7 in 10 respondents said it wasn't worth it, and the committee favored avoiding costly widening." },
    { title: "Dropping BAT lanes at Stark–Washington", reason: "It would have saved about $3.7 million but cut BAT lanes along about 0.6 mile and left the left-turn lanes unlengthened." },
    { title: "Current design and Some BAT (1, 2)", reason: "Superseded by an approach that maximizes bus lanes while managing risk." },
  ],
  unresolved: ["ODOT design exceptions were still under review at other locations", "TriMet says a significant delay could require more funding or future scope decisions", "Results of the September 2026 design survey haven't been published"],
};

export const TIMELINE = [
  { date: "2025-01-16", title: "Route and stations recommended", body: "The steering committee recommended the route, termini and station locations.", status: "done" },
  { date: "2025-01-22", title: "Station locations survey", body: "268 people rated station locations; 54% felt positive about them.", status: "done" },
  { date: "2025-04-07", title: "Bus lane survey opened", body: "Four scenarios; more than 1,500 people gave 1,511 rankings, April to June.", status: "done" },
  { date: "2025-09-01", title: "30% design", body: "Draft concept maps with BAT lanes on all seven miles.", status: "done" },
  { date: "2026-02-13", title: "Bus lane decision", body: "More BAT lanes, except at SE Powell.", status: "done" },
  { date: "2026-05-01", title: "Environmental review complete", body: "Federal agencies concurred on a Documented Categorical Exclusion.", status: "done" },
  { date: "2026-07-01", title: "Updated concept design", body: "Draft concept maps with 68 station platforms.", status: "done" },
  { date: "2026-08-10", title: "Full scope confirmed", body: "About $346 million, after value engineering saved over $15 million with no scope cuts.", status: "done" },
  { date: "2026-10-01", title: "Federal grant materials", body: "Final Small Starts funding materials due to be submitted.", status: "current" },
  { date: "2027-03-01", title: "Grant agreement", body: "Targeted Small Starts grant agreement.", status: "upcoming" },
  { date: "2027-04-01", title: "Construction starts", body: "Planned for spring 2027.", status: "upcoming" },
  { date: "2029-07-01", title: "FX service begins", body: "Expected in summer 2029.", status: "upcoming" },
];

export const EVIDENCE = [
  { title: "The scenario people favored", body: "More BAT lanes drew the highest support of any scenario: 69% said it was worth it, against 58% for Some BAT. Nearly 7 in 10 said intersection widening wasn't.", source: "TriMet 2025 Engagement Report." },
  { title: "Reliability on top of speed", body: "The current design already gives most of the time savings. More BAT adds 3–4 minutes on the 7-mile peak-hour trip and keeps buses on schedule as traffic grows.", source: "TriMet Lane Design Proposal, April 2025; Policy & Budget Committee, January 2026." },
  { title: "Why not at Powell", body: "Full BAT lanes would push an intersection already over capacity further past ODOT's target. Dropping them for about 200 ft each way avoided $15–20 million of widening or an uncertain design exception.", source: "Policy & Budget Committee, January and February 2026." },
  { title: "Why widen at Stark–Washington", body: "Side-by-side left-turn lanes between the couplet streets keep turn queues out of the through lanes once the curb lane carries buses. TriMet judged that worth about $3.7 million rather than dropping BAT lanes along about 0.6 mile.", source: "Policy & Budget Committee, January and February 2026." },
];

export const PROJECT = {
  id: "82nd-ave-fx",
  title: "82nd Avenue Transit Project",
  status: "In design",
  statusTone: "warning",
  round: "Bus lane survey replay",
  place: PLACE,
  summary: "TriMet is upgrading Line 72 to FX between Cully and Clackamas Town Center. Explore the four bus lane scenarios people weighed in 2025 on one block of 82nd, and what TriMet decided.",
  team: "TriMet, with Metro, PBOT, ODOT and Clackamas County",
  closes: "2025-06-06",
  agency: "TriMet",
  url: "https://trimet.org/82nd/",
  budget: "About $346 million, with $150 million sought from federal Small Starts",
};

// ——— Place words, used by the proposal and feedback screens ———
const nearestCross = (y) => CROSS_STREETS.reduce((b, c) => (Math.abs(c.y - y) < Math.abs(b.y - y) ? c : b));

export function describePlace(lngLat) {
  if (!lngLat) return "No location yet";
  const [x, y] = F.toLocal(lngLat);
  const c = nearestCross(y);
  const at = Math.abs(c.y - y) <= c.half + 4;
  if (Math.abs(x) <= HALF) return at ? `82nd at ${c.name}` : `82nd near ${c.name}`;
  const side = x > 0 ? "East" : "West";
  if (Math.abs(x) <= HALF + 6) return `${side} sidewalk, ${at ? "at" : "near"} ${c.name}`;
  return `${c.name}, ${side.toLowerCase()} of 82nd`;
}

export const WHERE = {
  "L-01": "Along 82nd between Oak and Pine",
  "S-ST": "82nd at SE Stark St",
  "T-01": "West side of 82nd, just north of Stark",
  "T-02": "East side of 82nd, north of Stark",
  "T-15": "SE Stark St, just west of 82nd",
  "S-WA": "82nd at SE Washington St",
  "X-AL": "Crossing 82nd at SE Alder St",
  "X-AS": "Crossing 82nd at SE Ash St",
};

// "Today" lines for each kind of change, from OSM or PBOT's corridor description.
export const TODAY_RULES = [
  [/station|shelter/i, "Line 72 stops at Stark: one with a shelter and bench, one with a bench (OSM)."],
  [/signal priority/i, "Signals at Stark and Washington, without transit priority (OSM)."],
  [/no BAT|no change/i, "Two lanes each way and a center turn lane (OSM, PBOT)."],
  [/BAT|outer lane|bus/i, "No bus lanes on 82nd (OSM)."],
  [/left-turn|turn lane|lanes each way/i, "Two lanes each way and a 10 ft center turn lane, typical of 82nd (PBOT)."],
  [/ramp/i, "Unmarked crossings at Alder and Morrison (OSM)."],
  [/widen|lanes to cross|properties/i, "Not on this block."],
];
export const FID_RULES = [
  [/station|shelter/i, "T-01"],
  [/signal/i, "S-ST"],
  [/left-turn|widen/i, "S-WA"],
  [/BAT|outer lane|lanes each way/i, "L-01"],
  [/ramp/i, "X-AL"],
];

// "Three things you'd notice first", per scenario.
export const NOTICE = {
  1: [
    { title: "An FX station at Stark", body: "Platforms on both curbs just north of Stark, near the signal.", fid: "T-01", xy: [-HALF, 32] },
    { title: "Lanes stay as they are", body: "Two lanes each way and a center turn lane. Buses still share traffic.", fid: "L-01", xy: [0, 110] },
    { title: "Curb ramps at every corner", body: "New ADA ramps at Stark, Washington, Alder and Morrison.", fid: "X-AL", xy: [HALF, ALDER] },
  ],
  2: [
    { title: "No bus lanes on this block", body: "Some BAT puts bus lanes north of NE Tillamook and south of SE Foster, not here.", fid: "L-01", xy: [0, 110] },
    { title: "The same FX station", body: "Platforms on both curbs just north of Stark, as in the current design.", fid: "T-01", xy: [-HALF, 32] },
    { title: "Slower drives elsewhere", body: "Drivers lose 1–2 minutes on the 7-mile trip, and about 15% of peak drivers reroute.", fid: "S-ST", xy: [0, 0] },
  ],
  3: [
    { title: "Red bus and turn lanes", body: "The outer lane each way is for buses and right turns. Cars use the inner lanes.", fid: "L-01", xy: [-HALF + 1.8, 110] },
    { title: "Side-by-side left turns", body: "Between Stark and Washington the street widens slightly so left turns don't block traffic.", fid: "S-WA", xy: [0, -41] },
    { title: "A quieter curb lane", body: "Sidewalks sit next to a lane with less traffic.", fid: "T-01", xy: [HALF - 1.8, -120] },
  ],
  4: [
    { title: "Nothing changes here", body: "Widening happens near SE Powell, Holgate and Foster, miles to the south.", fid: "L-01", xy: [0, 110] },
    { title: "Longer crossings there", body: "Up to 7 lanes to cross, about 8 ft farther, at widened intersections.", fid: "X-AL", xy: [0, ALDER] },
    { title: "The same FX station", body: "Platforms just north of Stark, as in the current design.", fid: "T-01", xy: [-HALF, 32] },
  ],
};

// Comparison matrix: relative scores, each cell paraphrasing TriMet's Lane Design Proposal and survey results.
// A score of 0 means TriMet didn't rate or state it.
export const MATRIX_ROWS = [
  { id: "support", label: "Said worth it", truth: "source", cells: {
    1: { score: 0, text: "Baseline, not rated" },
    2: { score: 2, text: "58%" },
    3: { score: 3, text: "69%" },
    4: { score: 1, text: "Nearly 7 in 10 said no" } } },
  { id: "bus", label: "Bus time saved, 7-mile trip", truth: "source", cells: {
    1: { score: 1, text: "8–9 min vs today" },
    2: { score: 2, text: "1–2 min more" },
    3: { score: 3, text: "3–4 min more" },
    4: { score: 1, text: "About 1 min more" } } },
  { id: "car", label: "Driving time", truth: "source", cells: {
    1: { score: 3, text: "No change" },
    2: { score: 2, text: "1–2 min slower" },
    3: { score: 1, text: "3–4 min slower" },
    4: { score: 3, text: "About 15 s faster" } } },
  { id: "cost", label: "Cost", truth: "source", cells: {
    1: { score: 3, text: "Current budget" },
    2: { score: 2, text: "Lowest of the added tools" },
    3: { score: 1, text: "At least 2× Some BAT" },
    4: { score: 1, text: "Over 4× Some BAT, 3 properties" } } },
  { id: "here", label: "At Stark–Washington", truth: "source", cells: {
    1: { score: 1, text: "Lanes as today" },
    2: { score: 1, text: "Lanes as today" },
    3: { score: 3, text: "BAT lanes, side-by-side left turns" },
    4: { score: 1, text: "Lanes as today" } } },
];

DECISION.why = [
  { title: "The scenario people favored", detail: "69% said worth it", body: EVIDENCE[0].body, theme: "T-BAT" },
  { title: "Faster, more reliable buses", detail: "3–4 min more on the 7-mile trip", body: EVIDENCE[1].body, theme: null },
  { title: "No costly widening", detail: null, body: THEME_BY_ID["T-WIDEN"].response, theme: "T-WIDEN" },
  { title: "Left turns that don't block traffic", detail: "About $3.7 million at Stark–Washington", body: EVIDENCE[3].body, theme: "T-TRAFFIC" },
];

export function inProjectArea(lngLat) {
  if (!lngLat) return false;
  const [x, y] = F.toLocal(lngLat);
  return Math.abs(x) <= 40 && y >= Y0 - 8 && y <= Y1 + 8;
}

// Existing conditions from OpenStreetMap (npm run osm -- 82nd-ave-fx).
export const OSM = () => import("./osm-82nd-ave-fx.json");

export const LEGEND = [
  { swatch: "existing", label: "Existing sidewalk & crossing (OSM)" },
  { swatch: "bus", label: "Bus and turn (BAT) lane" },
  { swatch: "turn", label: "Center or left-turn lane" },
  { swatch: "island", label: "Landscaped median" },
  { swatch: "proposed", label: "FX platform (position approximate)" },
  { swatch: "ramp", label: "ADA curb ramp" },
  { swatch: "comment", label: "Resident comment (sample)" },
  { swatch: "feature", label: "Feature you can inspect" },
];

// Project-specific words the shared screens use.
export const COPY = {
  mapLabel: "Map of SE 82nd Ave at Stark, Portland",
  alt: "Scenario",
  altShort: "Scenario",
  tagIsShort: true,
  alts: "scenarios",
  round: "round 2",
  agencyShort: "TriMet",
  raisedYear: "2025",
  placeShort: "82nd at Stark",
  photoNote: "Photos show today's street.",
  streetContext: "Today, as photographed.",
  tourIntro: "The map moves for you: 82nd today, why it's changing, the chosen design, the other scenarios, and what people said. About two minutes.",
  themesSource: "Themes and responses summarise TriMet's 2025 Engagement Report and its Policy & Budget Committee records.",
  builtNote: "Construction is planned to start in spring 2027.",
  exploreTitle: "How 82nd works now",
  exploreLead: "Start with what's there: two lanes each way, a center turn lane and Line 72 stops.",
  featuresLabel: "Features on this stretch of 82nd",
  drawingNote: "The scenarios are concept drawings using PBOT's corridor-typical lane widths — don't measure from them.",
  compareLead: "Drag the handle across the same stretch of 82nd, today and as TriMet's scenario would draw it. Nothing else on the map changes.",
  compareNote: (alt) => `Today comes from OpenStreetMap. ${alt} is a concept drawing using PBOT's corridor-typical lane widths, not a design drawing.`,
  decisionDoc: "decision notes",
  matrixBasis: "Lane Design Proposal and survey results",
  altsLead: "Same street, same camera. Three of the four scenarios leave this block as it is; the map shows what each would do here.",
  altsChosenNote: "TriMet chose More BAT lanes, minus SE Powell, in February 2026; the others stay here so you can see what was traded.",
  revisionNote: "Both versions are concept drawings read from TriMet's not-to-scale draft maps.",
  timelineLinks: {
    "Route and stations recommended": { to: "../explore", label: "82nd today", icon: "map" },
    "Bus lane survey opened": { to: "../alternatives", label: "The 4 scenarios", icon: "layers" },
    "Bus lane decision": { to: "../decision", label: "Decision summary", icon: "doc" },
    "Updated concept design": { to: "../revision", label: "How More BAT was refined", icon: "swap" },
  },
  replayContext: "when people weighed TriMet's bus lane scenarios. The map shows the street today.",
  describePlaceholder: "e.g. the bus stop on the west side of 82nd, just north of Stark",
  commentPlaceholder: "e.g. When I cross 82nd at Alder to catch the 72, there's nowhere to wait between the lanes.",
  pickMapLabel: "Map of SE 82nd Ave from SE Ash St to SE Morrison St.",
  wholeThing: "the street",
  illustrativeLabel: "Concept drawing · from PBOT's typical lane widths",
  stages: ["Planning", "Station locations", "Bus lane survey", "Decision", "Final design", "Construction", "FX service"],
  replayStage: "Bus lane survey",
  replayStep: "Bus lane survey opened",
  textSources: "Facts about the street today come from OpenStreetMap. The scenarios, decision, timeline and survey results come from TriMet's published reports and committee records, listed under Sources. The scenario drawings use PBOT's corridor-typical lane widths; this block's exact widths aren't published.",
  textToday: "SE 82nd Ave runs north–south. This page covers it from SE Ash St to SE Morrison St, crossing Pine, Oak, Stark, Washington and Alder. Stark and Washington are a one-way couplet. FX will replace Line 72 along the whole corridor, from Cully to Clackamas Town Center.",
  describeExample: "the bus stop at Stark, west side",
  idExample: "T-01 for the southbound Line 72 stop at Stark",
  results: null,
  todayRow: () => ({
    support: "—",
    bus: "Line 72: about 10,000 daily trips and the most delays of any TriMet line (TriMet)",
    car: "Two lanes each way and a center turn lane (OSM, PBOT)",
    cost: "—",
    here: "No bus lanes; Line 72 stops at Stark (OSM)",
  }),
  // Overview "what TriMet chose": each change → icon and the map feature kinds it describes.
  changeRules: [
    [/BAT|outer lane/i, "bus", ["bus-lane"]],
    [/left-turn/i, "layers", ["turn-lane"]],
    [/station/i, "bus", ["bus-shelter"]],
    [/ramp/i, "access", ["curb-ramp"]],
  ],
  stepLinks: { today: ["explore", "See 82nd today"], problem: ["inspect/T-01", "Inspect the Line 72 stop at Stark"], proposal: ["explore?show=3", "Open More BAT"], compare: ["compare", "Compare the scenarios"], feedback: ["feedback", "Try the round 2 feedback flow"] },
  evidence: {
    lede: "TriMet's decision leans on what riders favored, on reliability, and on avoiding risks it couldn't control. Here is how each applies on 82nd, and where this page's knowledge stops.",
    sections: [
      { id: "favored", label: "What people favored", ev: 0, matrix: ["support", "bus"] },
      { id: "reliable", label: "Reliability", ev: 1, matrix: ["car", "cost"] },
      { id: "powell", label: "Why not at Powell", ev: 2, facts: [{ label: "Powell, 2045, no project", value: "1.03" }, { label: "With full BAT lanes", value: "1.07" }, { label: "ODOT target", value: "0.85" }], link: { src: "options", label: "Read the January 2026 options" } },
      { id: "stark", label: "Stark–Washington", ev: 3, facts: [{ label: "Cost of the widening", value: "~$3.7M" }, { label: "BAT lanes it keeps", value: "~0.6 mi" }] },
    ],
    placeLabel: "This street",
    placeLead: "What OpenStreetMap records on 82nd between SE Ash and SE Morrison today, and what this demo doesn't have.",
    known: [
      "82nd is mapped as OR 213, mostly with 5 lanes",
      "Signals at Stark and Washington; Washington's crossings have sound and vibration signals",
      "Line 72 stops at Stark: one with a shelter and bench, one with a bench",
      "A marked crossing with a flashing beacon and refuge island at Ash",
      "Unmarked crossings at Alder and Morrison",
    ],
    unknown: [
      "This block's curb-to-curb and lane widths, and how much the street widens at Stark–Washington",
      "Exact FX platform positions: TriMet's concept maps aren't drawn to scale",
      "Which Line 72 stops close, shown only on TriMet's map images",
      "Results of the September 2026 design survey",
      "TriMet's sources differ slightly on some savings: 8–9 or 8–10 minutes for the baseline",
    ],
    noEstimate: "travel times or diversion",
    sources: [
      { k: "Decision", src: "decision", text: "More BAT lanes, minus Powell, and the Stark–Washington widening." },
      { k: "Scenarios", src: "lanedesign", text: "The four scenarios, minutes saved, diversion and relative cost." },
      { k: "Survey", src: "engagement", text: "Rankings, worth-it shares and what people said." },
      { k: "Widths", src: "pbot", text: "82nd's typical 56–60 ft curb to curb and lane widths." },
    ],
    osmCovers: "Lanes, signals, crossings and bus stops.",
  },
  glossary: [
    { term: "FX (Frequent Express)", def: "TriMet's high-capacity bus service: longer buses, all-door boarding, fewer stops and priority at signals. Line 72 on 82nd becomes FX." },
    { term: "BAT lane", def: "A business access and transit lane: only buses and turning vehicles may use it, so buses pass queued traffic while driveways stay reachable." },
    { term: "Transit signal priority", def: "Signals that hold a green light, or shorten a red, for an approaching bus." },
    { term: "Couplet", def: "Two one-way streets a block apart that work as a pair, like SE Stark (westbound) and SE Washington (eastbound)." },
    { term: "Diversion", def: "Drivers choosing another route, such as I-205 or side streets, when a street gets slower." },
    { term: "Volume-to-capacity (V/C)", def: "How full an intersection is at its busiest. 1.0 means it's at capacity; ODOT's target at Powell is 0.85." },
    { term: "Small Starts", def: "A federal grant program for transit projects. TriMet and its partners are seeking $150 million from it." },
  ],
};
