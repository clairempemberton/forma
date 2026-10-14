// SE Hawthorne Blvd Pave & Paint, SE 35th Pl to SE César E. Chávez Blvd, Portland, Oregon.
//
// Truth labels used throughout the app:
//   "source"       — stated in a cited PBOT document (see SOURCES)
//   "osm"          — real, from OpenStreetMap (© OpenStreetMap contributors, ODbL), see osm-existing.json
//   "estimate"     — derived from source widths or OSM geometry with a stated assumption, not surveyed
//   "illustrative" — a concept drawing of a PBOT alternative, drawn from the published widths
//   "sample"       — sample resident comments; not real people
//
// Forma is an unofficial concept. It is not affiliated with the City of Portland or PBOT.

import { makeFrame, rect, line, point, collection } from "../lib/geo.js";

// SE Hawthorne Blvd & SE 37th Ave (OSM node shared by both ways).
export const ORIGIN = [-122.62582, 45.512052];
export const F = makeFrame(ORIGIN);

export const SOURCES = {
  decision: { title: "SE Hawthorne Pave and Paint: Decision Report", publisher: "PBOT", date: "February 2021", url: "https://www.portland.gov/sites/default/files/2021/hawthorne-pave-and-paint-decision-final.pdf" },
  evaluation: { title: "SE Hawthorne Boulevard Projects Evaluation Report", publisher: "PBOT", date: "October 2023, updated June 2025", url: "https://www.portland.gov/transportation/vision-zero/documents/se-hawthorne-boulevard-projects-evaluation-report-2023-updated" },
  osm: { title: "OpenStreetMap", publisher: "OpenStreetMap contributors (ODbL)", date: "fetched October 2026", url: "https://www.openstreetmap.org/#map=18/45.51205/-122.6252" },
};

// ——— Street geometry, in local metres: x east along Hawthorne, y north. ———
// Curb to curb is about 50 ft (15.24 m): every PBOT alternative's published lane widths add up to it (estimate).
const FT = 0.3048;
const HALF = 25 * FT;
const X0 = -158;
const X1 = 290;

// Cross streets, from OSM nodes shared with Hawthorne. 38th Ave meets Hawthorne at two offset points.
export const CROSS_STREETS = [
  { name: "35th Pl", x: -141.4, half: 5 },
  { name: "36th Ave", x: -72.8, half: 7 },
  { name: "37th Ave", x: 0, half: 6 },
  { name: "38th Ave", x: 104.1, half: 5 },
  { name: "38th Ave", x: 145.7, half: 5 },
  { name: "César E. Chávez Blvd", x: 232.3, half: 9 },
];
const CHAVEZ = 232.3;
const ISLAND_X = [-72.8, 111.3]; // marked crossings at 36th and 38th (OSM), where PBOT's concept plan shows refuge islands

// Split [a, b] around intersections so lanes stop at cross streets.
function spans(a, b) {
  const out = [];
  let s = a;
  for (const c of CROSS_STREETS) {
    if (c.x + c.half <= s || c.x - c.half >= b) continue;
    if (c.x - c.half > s) out.push([s, c.x - c.half]);
    s = Math.max(s, c.x + c.half);
  }
  if (s < b) out.push([s, b]);
  return out;
}
const band = (y0, y1, props, a = X0, b = X1) => spans(a, b).map(([s, e]) => rect(F, s, y0, e, y1, props));
const both = (y0, y1, props, a, b) => [band(y0, y1, props, a, b), band(-y1, -y0, props, a, b)];
const stripe = (y, props, a = X0, b = X1) => spans(a, b).map(([s, e]) => line(F, [[s, y], [e, y]], props));
const minus = (ranges, holes) => ranges.flatMap(([a, b]) => {
  let out = [[a, b]];
  for (const [h0, h1] of holes) out = out.flatMap(([s, e]) => (h1 <= s || h0 >= e ? [[s, e]] : [[s, Math.max(s, h0)], [Math.min(e, h1), e]].filter(([p, q]) => q - p > 0.5)));
  return out;
});

const crosswalk = (x, id) => rect(F, x - 1.6, -HALF, x + 1.6, HALF, { kind: "crosswalk", id, label: "Marked crosswalk" });
const island = (x, widthFt, id) => rect(F, x - 6, -(widthFt * FT) / 2, x + 6, (widthFt * FT) / 2, { kind: "refuge-island", id, label: `Refuge island, ${widthFt} ft wide` });
const ramps = () => CROSS_STREETS.filter((c, i, a) => a.findIndex((d) => d.name === c.name) === i || c.x > 140)
  .flatMap((c, i) => [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy], j) => point(F, [c.x + sx * (c.half + 1), sy * (HALF + 0.6)], { kind: "curb-ramp", id: `R-${i * 4 + j + 1}`, label: "ADA curb ramp" })));

// Bus and right-turn lanes on both approaches to Chávez; the eastbound stop moves far-side (Decision Report).
const busLanes = () => [
  rect(F, 160, -HALF, CHAVEZ - 9, -HALF + 3.4, { kind: "bus-lane", id: "BL-1", label: "Bus and right-turn lane, eastbound" }),
  rect(F, CHAVEZ + 9, HALF - 3.4, X1, HALF, { kind: "bus-lane", id: "BL-2", label: "Bus and right-turn lane, westbound" }),
  point(F, [256.6, -9.4], { kind: "bus-stop", id: "T-03", label: "Eastbound Line 14 stop, moved far-side" }),
];
// Alternative 3: buses, bikes and right turns share the outer lane for about a block approaching Chávez.
const mixingZones = () => [
  rect(F, 160, -HALF + 2.1, CHAVEZ - 9, -2.9, { kind: "mixing-zone", id: "MZ-1", label: "Bus, bike and right-turn mixing zone" }),
  rect(F, CHAVEZ + 9, 2.9, X1, HALF - 2.1, { kind: "mixing-zone", id: "MZ-2", label: "Bus, bike and right-turn mixing zone" }),
];

// Alternative 1: the 2020 layout west of Chávez — four 9 ft lanes and parking both sides.
function alt1() {
  const P = 7 * FT, L = 9 * FT;
  return collection([
    both(HALF - P, HALF, { kind: "parking", label: "On-street parking" }),
    stripe(HALF - P - L, { kind: "lane-line", label: "Four 9-ft travel lanes" }), stripe(-(HALF - P - L), { kind: "lane-line" }),
    stripe(0, { kind: "center-line" }),
    ramps(),
  ]);
}

// Alternative 2: two 11–12 ft lanes, a center turn lane, parking both sides, 8–10 ft refuge islands.
function alt2(refined = true) {
  const P = 8 * FT, L = 11.5 * FT, T = HALF - P - L;
  const islandHoles = ISLAND_X.map((x) => [x - 6, x + 6]);
  const turn = minus(spans(X0, X1), islandHoles);
  return collection([
    band(HALF - P, HALF, { kind: "parking", label: "On-street parking, kept" }),
    band(-HALF, -(HALF - P), { kind: "parking", label: "On-street parking, kept" }, X0, 160),
    turn.map(([a, b]) => rect(F, a, -T, b, T, { kind: "turn-lane", id: "CT-1", label: "Center turn lane" })),
    stripe(T, { kind: "center-line" }), stripe(-T, { kind: "center-line" }),
    ISLAND_X.map((x, i) => [island(x, 9, `I-${i + 1}`), crosswalk(x, `X-${i + 11}`)]),
    busLanes(),
    ramps(),
    refined && [
      line(F, [[0, HALF + 2], [0, 40]], { kind: "bike-route", id: "BW-1", label: "Possible north–south bikeway connection" }),
      line(F, [[0, -HALF - 2], [0, -40]], { kind: "bike-route", id: "BW-2", label: "Possible north–south bikeway connection" }),
    ],
  ]);
}

// Alternative 3a: two 10 ft lanes, buffered bike lanes (8 ft lane+buffer), parking at the curb, 6 ft islands.
function alt3a() {
  const P = 7 * FT, B = 8 * FT;
  const atIslands = ISLAND_X.map((x) => [x - 16, x + 16]);
  return collection([
    both(HALF - P, HALF, { kind: "parking", label: "On-street parking" }, X0, 160).map((g) => g.filter((f) => !atIslands.some(([a, b]) => { const [x] = F.toLocal(f.geometry.coordinates[0][0]); return x > a && x < b; }))),
    atIslands.map(([a, b]) => both(HALF - P, HALF, { kind: "parking-removed", label: "Parking removed at the island" }, a, b)),
    both(HALF - P - B, HALF - P, { kind: "bike-lane", id: "BK-1", label: "Buffered bike lane, 8 ft with buffer" }),
    stripe(0, { kind: "center-line" }),
    ISLAND_X.map((x, i) => [island(x, 6, `I-${i + 1}`), crosswalk(x, `X-${i + 11}`)]),
    mixingZones(),
    ramps(),
  ]);
}

// Alternative 3b: two 10.5 ft lanes, curbside bike lanes (7.5 ft lane+buffer), floating parking, visibility hatching at corners.
function alt3b() {
  const B = 7.5 * FT, P = 7 * FT;
  const nearCorners = CROSS_STREETS.flatMap((c) => [[c.x - c.half - 14, c.x - c.half], [c.x + c.half, c.x + c.half + 14]]);
  const parkRanges = minus(spans(X0, 160), [...nearCorners, ...ISLAND_X.map((x) => [x - 16, x + 16])]);
  return collection([
    both(HALF - B, HALF, { kind: "bike-lane", id: "BK-1", label: "Parking-protected bike lane, 7.5 ft with buffer" }),
    parkRanges.map(([a, b]) => [rect(F, a, HALF - B - P, b, HALF - B, { kind: "parking", label: "Floating parking" }), rect(F, a, -(HALF - B), b, -(HALF - B - P), { kind: "parking", label: "Floating parking" })]),
    nearCorners.filter(([a, b]) => b > X0 && a < 160).map(([a, b]) => both(HALF - B - P, HALF - B, { kind: "visibility-zone", label: "Hatched for visibility, no parking" }, Math.max(a, X0), Math.min(b, 160))),
    stripe(0, { kind: "center-line" }),
    ISLAND_X.map((x, i) => [island(x, 6, `I-${i + 1}`), crosswalk(x, `X-${i + 11}`)]),
    mixingZones(),
    ramps(),
  ]);
}

export const CAMERA = {
  home: { center: F.toLngLat([66, 0]), zoom: 17.15, bearing: 0, pitch: 0 },
  overview: { center: F.toLngLat([66, -10]), zoom: 17.2, bearing: 0, pitch: 0 },
  three: { center: F.toLngLat([40, 0]), zoom: 18.1, bearing: -32, pitch: 62 },
  // Frames Hawthorne from 36th to Chávez, so every numbered change is in view.
  compare: { center: F.toLngLat([66, -4]), zoom: 17.4, bearing: 0, pitch: 0 },
};

export const PLACE = {
  name: "SE Hawthorne Blvd, 35th Pl to César E. Chávez Blvd",
  short: "Hawthorne at 37th",
  neighborhood: "Sunnyside · Richmond",
  city: "Portland, Oregon",
  coordinates: ORIGIN,
  source: "© OpenStreetMap contributors",
};

// ——— Existing conditions: inspectable features. Today's street, after the 2021 project. ———
export const EXISTING_FEATURES = [
  {
    id: "L-01", kind: "control", name: "Hawthorne travel lanes", xy: [-36, 0], osm: "way/1026951219",
    summary: "One lane each way and a center turn lane",
    facts: ["Mapped with 3 lanes and a 20 mph limit (OSM)", "Four lanes before 2021 west of Chávez (PBOT Decision Report)", "At 37th, top-end speeders fell 41.5% after the project (PBOT Evaluation Report)"],
  },
  {
    id: "X-36", kind: "crossing", name: "Crossing at SE 36th", lngLat: [-122.626746, 45.512053], osm: "node/9851500143",
    summary: "Marked crossing without a signal",
    facts: ["Mapped as an uncontrolled, marked crossing (OSM)", "PBOT's concept plan shows a refuge island here (Decision Report)"],
  },
  {
    id: "S-37", kind: "control", name: "Signal at SE 37th", lngLat: [-122.62582, 45.512052], osm: "node/4234982067",
    summary: "Signalized intersection with crosswalks",
    facts: ["Traffic signal with crossings on both sides of 37th (OSM)", "PBOT measured speeds here before and after the project (Evaluation Report)"],
  },
  {
    id: "T-01", kind: "transit", name: "Hawthorne & 37th, eastbound", lngLat: [-122.625471, 45.511993], osm: "node/1368545925",
    summary: "Line 14 stop with shelter and bench",
    facts: ["Bus stop with a shelter and a bench (OSM)", "Served by TriMet Line 14, Lents to downtown (Decision Report)"],
  },
  {
    id: "T-02", kind: "transit", name: "Hawthorne & 37th, westbound", lngLat: [-122.625712, 45.512116], osm: "node/4234982067",
    summary: "Line 14 stop, no shelter",
    facts: ["Bus stop mapped without a shelter or bench (OSM)"],
  },
  {
    id: "X-38", kind: "crossing", name: "Crossing at SE 38th", lngLat: [-122.624393, 45.512048], osm: "node/10960595504",
    summary: "Marked crossing without a signal",
    facts: ["Mapped as an uncontrolled, marked crossing (OSM)", "PBOT's concept plan shows a refuge island here (Decision Report)"],
  },
  {
    id: "S-39", kind: "transit", name: "César E. Chávez Blvd", lngLat: [-122.622841, 45.512045], osm: "node/1369584917",
    summary: "Signal with red bus-and-turn lanes",
    facts: ["Signalized intersection (OSM)", "Red bus-and-turn lanes added on the approaches and the signal modified in 2021 (Evaluation Report)", "City Council approved renaming the street SE Campesinos Blvd in September 2026 (PBOT)"],
  },
  {
    id: "B-01", kind: "bike", name: "Bike access to Hawthorne", xy: [0, 32],
    summary: "No bike lane on Hawthorne itself",
    facts: ["No cycleway mapped on Hawthorne here (OSM)", "PBOT chose to improve north–south links from the Salmon–Taylor and Lincoln–Harrison greenways (Decision Report)"],
  },
].map((f) => ({ ...f, lngLat: f.lngLat || F.toLngLat(f.xy), truth: "osm" }));

// Project area: Hawthorne and its sidewalks from 35th Pl to just past Chávez.
export const BOUNDARY = collection([rect(F, X0, -44, X1, 44, { kind: "boundary", label: "Project area" })]);

export const STREET_LABELS = collection([
  point(F, [-110, 0], { label: "SE HAWTHORNE BLVD", rotate: 0 }),
  point(F, [-72.8, 30], { label: "SE 36TH AVE", rotate: 90 }),
  point(F, [0, -30], { label: "SE 37TH AVE", rotate: 90 }),
  point(F, [104, -30], { label: "SE 38TH AVE", rotate: 90 }),
  point(F, [CHAVEZ, 30], { label: "SE CÉSAR E. CHÁVEZ BLVD", rotate: 90 }),
]);

export const OPTIONS = [
  {
    id: "1", name: "Keep the 2020 layout", short: "No change",
    summary: "Four general lanes west of César E. Chávez Blvd, parking on both sides. The street as it was before 2021.",
    changes: ["Four 9-ft travel lanes", "Parking on both sides", "Repaving and new curb ramps only"],
    benefits: ["No change for drivers", "Parking stays as it is"],
    tradeoffs: ["People cross four lanes of traffic at once", "Buses are wider than 9-ft lanes; mirror strikes are common", "Left-turning drivers block a travel lane"],
    geojson: alt1(),
  },
  {
    id: "2", name: "Three lanes", short: "Center turn lane",
    summary: "One lane each way with a center turn lane, parking on both sides, 8–10 ft refuge islands, and bus lanes approaching Chávez.",
    changes: ["Two 11–12 ft travel lanes and a center turn lane", "8–10 ft refuge islands with marked crosswalks", "Bus and right-turn lanes approaching Chávez", "Parking kept on both sides", "New ADA curb ramps"],
    benefits: ["Expected to reduce all crashes by 29%, and pedestrian crashes by about 50% where islands are built", "Lanes wide enough for buses", "Room to wait for a gap when turning left"],
    tradeoffs: ["No bike lane on Hawthorne itself", "Fewer gaps for drivers turning onto Hawthorne"],
    geojson: alt2(true),
  },
  {
    id: "3a", name: "Buffered bike lanes", short: "Buffered bike lanes",
    summary: "Two 10 ft lanes and buffered bike lanes (8 ft with buffer), parking at the curb, and 6 ft refuge islands.",
    changes: ["Two 10-ft travel lanes", "Buffered bike lanes, 8 ft with buffer", "6-ft refuge islands", "Bus, bike and right-turn mixing zones at Chávez", "Parking removed around each island"],
    benefits: ["Bike lanes on Hawthorne for about 20 blocks", "Wider lanes reduce sideswipes and mirror strikes"],
    tradeoffs: ["No turn lanes, so no expected drop in left-turn crashes", "Bike lanes narrow to 5 ft with no buffer at islands", "Buses pull into the bike lane at stops"],
    geojson: alt3a(),
  },
  {
    id: "3b", name: "Parking-protected bike lanes", short: "Protected bike lanes",
    summary: "Two 10.5 ft lanes, curbside bike lanes (7.5 ft with buffer) and floating parking, with hatching near corners for visibility.",
    changes: ["Two 10.5-ft travel lanes", "Bike lanes at the curb, 7.5 ft with buffer", "Parking floats between the bike lane and traffic", "Hatched no-parking zones near corners", "6-ft refuge islands"],
    benefits: ["Parked cars separate people biking from traffic", "Physically separated lanes have lower crash rates than painted lanes"],
    tradeoffs: ["About 50–60% of the curb zone no longer available", "No turn lanes, so no expected drop in left-turn crashes", "No protection at intersections within this project's budget"],
    geojson: alt3b(),
  },
];

export const OPTION_BY_ID = Object.fromEntries(OPTIONS.map((o) => [o.id, o]));

// Alternative 2 as shown in round 2, and as refined before the decision.
export const VERSIONS = [
  { id: "v1", label: "Round 2", date: "2020-09-15", geojson: alt2(false), note: "Alternative 2 as rated in round 2." },
  { id: "v2", label: "Refined", date: "2021-02-01", geojson: alt2(true), note: "Refined between October 2020 and January 2021." },
];

export const REVISION_CHANGES = [
  { id: "RC-1", title: "North–south bike connections", before: "Bike access to Hawthorne only from parallel greenways", after: "Upgraded greenways and new north–south connections; exact locations to be decided", themes: ["T-BIKE"], lngLat: F.toLngLat([0, 30]), status: "changed" },
  { id: "RC-2", title: "Curb zone for people, not just parking", before: "Curb zone used for parking", after: "Room for street seats, parklets, loading and bike corrals", themes: ["T-BIZ"], lngLat: F.toLngLat([-40, 6.6]), status: "changed" },
  { id: "RC-3", title: "Bike lanes on Hawthorne", before: "Requested by many respondents outside nearby zip codes", after: "Not adopted. PBOT chose turn lanes and wider refuge islands", themes: ["T-BIKE"], lngLat: F.toLngLat([60, -4]), status: "not-changed" },
  { id: "RC-4", title: "Wider sidewalks", before: "Requested to expand space for people walking", after: "Not possible within a paving budget. The curb zone is kept for future widening", themes: ["T-BIZ"], lngLat: F.toLngLat([-100, -7]), status: "not-changed" },
];

// The guided story. Each step names a camera and the layers it shows.
export const STORY = [
  { id: "today", title: "Hawthorne today", body: "One lane each way, a center turn lane and marked crossings, as built in 2021. Every fact on the map comes from OpenStreetMap.", camera: CAMERA.home, show: { existing: true } },
  { id: "problem", title: "Why it changed", body: "Hawthorne is one of Portland's 30 High Crash Corridors. From 2013 to 2017 it had 36 Vision Zero crashes, half of them drivers hitting pedestrians.", camera: { center: F.toLngLat([-72.8, 0]), zoom: 19, bearing: 0, pitch: 30 }, focus: "X-36", show: { existing: true, comments: true } },
  { id: "proposal", title: "The chosen design", body: "Alternative 2: three lanes, refuge islands at key crossings, and bus lanes approaching César E. Chávez Blvd.", camera: { center: F.toLngLat([120, 0]), zoom: 18.1, bearing: -20, pitch: 50 }, option: "2", show: { proposal: true } },
  { id: "compare", title: "The alternatives", body: "PBOT also drew buffered and parking-protected bike lanes. Same street, same 50 feet, different trade-offs.", camera: CAMERA.home, option: "3b", show: { proposal: true } },
  { id: "feedback", title: "What people said", body: "1,002 people rated the alternatives in round 2. Drop a pin to try the feedback flow yourself.", camera: CAMERA.home, show: { comments: true } },
];

// ——— Themes: what PBOT reported hearing, and its answers (Decision Report). Counts are of the sample comments. ———
const THEME_LIST = [
  { id: "T-CROSS", name: "Crossing Hawthorne on foot", short: "Crossing safety", icon: "walk", response: "Refuge islands and marked crosswalks at high-priority crossings, including 36th and 38th.", status: "addressed" },
  { id: "T-SPEED", name: "Speeding", short: "Speeding", icon: "alert", response: "Three lanes instead of four, and PBOT sought a 20 mph limit. At 37th, top-end speeders fell 41.5%.", status: "addressed" },
  { id: "T-BUS", name: "Line 14 bus delay", short: "Bus", icon: "bus", response: "Bus and right-turn lanes on both approaches to Chávez; the eastbound stop moved far-side.", status: "addressed" },
  { id: "T-BIKE", name: "Bike lanes on Hawthorne", short: "Bike access", icon: "bike", response: "Not on Hawthorne itself. PBOT is improving parallel greenways and north–south connections instead.", status: "partly" },
  { id: "T-BIZ", name: "Main street and the curb", short: "Main street", icon: "truck", response: "Parking kept on both sides, with room for street seats, parklets, loading and bike corrals.", status: "addressed" },
  { id: "T-ACCESS", name: "Curb ramps and access", short: "Curb ramps", icon: "access", response: "163 curb ramps upgraded to ADA standards across the project.", status: "addressed" },
];

const C = (id, xy, theme, text, extra = {}) => ({ id, lngLat: F.toLngLat(xy), theme, text, sentiment: "concern", option: null, date: "2020-10-02", author: "Resident", ...extra });

// Sample comments written for this demo. They are not real people's words.
export const SAMPLE_COMMENTS = [
  C("c01", [-74, 3], "T-CROSS", "Crossing at 36th means waiting for a gap in four lanes. An island in the middle would change everything.", { date: "2020-09-16" }),
  C("c02", [-71, -4], "T-CROSS", "I walk my kids across here to the park. Drivers in the second lane don't see us.", { date: "2020-09-18" }),
  C("c03", [110, 2], "T-CROSS", "Please put an island at 38th too, it's where the bus riders cross.", { option: "2", sentiment: "support", date: "2020-09-20" }),
  C("c04", [113, -5], "T-CROSS", "A 6-ft island isn't enough with a cargo bike. The wider islands in Alternative 2 matter.", { option: "2", sentiment: "support", date: "2020-09-24" }),
  C("c05", [-30, 1], "T-SPEED", "At night people treat this like a highway between 35th and 37th.", { date: "2020-09-17" }),
  C("c06", [40, -2], "T-SPEED", "One lane each way would calm this down more than any sign.", { option: "2", sentiment: "support", date: "2020-09-22" }),
  C("c07", [-120, 0], "T-SPEED", "Worried three lanes will push traffic onto Madison and Salmon.", { option: "1", date: "2020-10-03" }),
  C("c08", [200, -6], "T-BUS", "The 14 sits in traffic before Chávez every evening. A bus lane here would save me ten minutes a week.", { option: "2", sentiment: "support", date: "2020-09-19" }),
  C("c09", [27, -8], "T-BUS", "Buses take up both lanes now and clip mirrors. Wider lanes please.", { date: "2020-09-25" }),
  C("c10", [250, -8], "T-BUS", "Moving the eastbound stop past Chávez makes sense, as long as the shelter comes too.", { option: "2", sentiment: "idea", date: "2020-10-08" }),
  C("c11", [60, -5], "T-BIKE", "Protected lanes are the only design I'd let my teenager ride on.", { option: "3b", sentiment: "support", date: "2020-09-21" }),
  C("c12", [-90, 5], "T-BIKE", "Buffered lanes would make the shops reachable by bike for the first time.", { option: "3a", sentiment: "support", date: "2020-09-27" }),
  C("c13", [0, 30], "T-BIKE", "If there's no bike lane, make the side streets to Salmon and Lincoln much easier to use.", { sentiment: "idea", date: "2020-10-05" }),
  C("c14", [130, 5], "T-BIKE", "A bike lane that drops to 5 ft at every island isn't really a bike lane.", { option: "3a", date: "2020-10-12" }),
  C("c15", [-50, 7], "T-BIZ", "Our customers park on Hawthorne. Losing half the curb would hurt.", { option: "3b", date: "2020-09-23", author: "Business owner" }),
  C("c16", [20, 7], "T-BIZ", "Street seats on the curb have kept us alive this year. Keep space for them.", { sentiment: "idea", date: "2020-09-29", author: "Business owner" }),
  C("c17", [-140, 6], "T-BIZ", "Deliveries double-park here every morning. A loading zone would help.", { date: "2020-10-10" }),
  C("c18", [5, 9], "T-ACCESS", "The ramp at this corner points into the street. My chair rolls toward traffic.", { date: "2020-09-30", author: "Resident · uses a wheelchair" }),
  C("c19", [-70, -9], "T-ACCESS", "Ramps that line up with the crosswalk, please, and tactile paving.", { date: "2020-10-06" }),
  C("c20", [150, 8], "T-ACCESS", "Older sidewalks along here have no ramps at all on some corners.", { sentiment: "neutral", date: "2020-10-15" }),
  C("c21", [80, 1], "T-SPEED", "The center lane would give left-turners somewhere to wait instead of blocking everyone.", { option: "2", sentiment: "support", date: "2020-10-18" }),
  C("c22", [-10, -3], "T-CROSS", "Even with the signal at 37th, the walk light is short for four lanes.", { date: "2020-10-21" }),
].map((c) => ({ ...c, truth: "sample", public: true }));

export const THEMES = THEME_LIST.map((t) => ({ ...t, color: "accent", count: SAMPLE_COMMENTS.filter((c) => c.theme === t.id).length }));
export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]));

// Round 2 survey, Sep–Nov 2020 (Decision Report). The total is the sum of the three groups.
export const SURVEY = {
  window: "September to November 2020",
  groups: [
    { label: "Zip codes bordering Hawthorne (97214, 97215)", respondents: 548, preferred: "2" },
    { label: "Zip codes served by Line 14 (97206, 97266)", respondents: 137, preferred: "2" },
    { label: "All other zip codes", respondents: 317, preferred: "3b" },
  ],
  total: 1002,
  note: "Alternative 2 was the most preferred overall. People living outside the Hawthorne and Line 14 zip codes preferred Alternative 3b.",
  lead: "1,002 people rated the four alternatives in round 2, September to November 2020. PBOT reported the results by where people live.",
  caption: "Round 2 respondents by zip code group, and the alternative each group preferred",
  columns: ["Where respondents live", "People", "Most preferred"],
};

// Before and after (Evaluation Report, October 2023 updated June 2025).
export const RESULTS = [
  { label: "Top-end speeders at 37th", value: "−41.5%", truth: "source" },
  { label: "Median speed at 37th", value: "−17.5%", truth: "source" },
  { label: "Corridor within a crossing's desired distance", value: "66% → 95%", truth: "source" },
  { label: "Bike crashes, year after the project", value: "4.4/yr → 0", truth: "source" },
];

export const DECISION = {
  headline: "PBOT chose a refined Alternative 2",
  whyLead: "Of the four alternatives, PBOT rated Alternative 2 highest for safety, transit, emergency response, people walking and the curb zone. It was also the most preferred in round 2.",
  status: "Decision published",
  date: "2021-02-01",
  chosen: "2",
  version: "v2",
  body: "PBOT chose a refined Alternative 2. It was rated highest for safety, transit, emergency response, people walking and the curb zone, and it was the most preferred option in round 2.",
  notAdopted: [
    { title: "Bike lanes on Hawthorne (3a and 3b)", reason: "Without turn lanes, PBOT expected no drop in left-turn crashes. Buses would pull into the bike lane at stops, islands could only be 6 ft wide, and 3b would remove 50–60% of the curb zone." },
    { title: "Keep the 2020 layout (1)", reason: "Little public support and no significant safety benefit, so PBOT did not take it forward after round 2." },
  ],
  unresolved: ["How many medium- and lower-priority crossings get islands depended on budget", "North–south bikeway connections were planned over the following five years"],
};

export const TIMELINE = [
  { date: "2020-01-15", title: "Round 1 opened", body: "Ideas and priorities. Pedestrian safety crossing Hawthorne came out on top.", status: "done" },
  { date: "2020-09-15", title: "Round 2 opened", body: "1,002 people rated four alternatives, September to November.", status: "done" },
  { date: "2020-10-15", title: "Alternatives refined", body: "Mixing zones for Alternative 3 and greenway connections for Alternative 2, October to January.", status: "done" },
  { date: "2021-02-01", title: "Decision published", body: "A refined Alternative 2.", status: "done" },
  { date: "2021-10-01", title: "Built", body: "28 blocks repaved, 163 curb ramps, 10 improved crossings and 14 streetlights. Completed fall 2021.", status: "done" },
  { date: "2025-06-01", title: "Evaluation updated", body: "Speeds down, buses faster at peak, traffic volumes about the same.", status: "done" },
  { date: "2026-12-01", title: "Crash evaluation update", body: "PBOT plans updates in 2026 and 2028 as crash data is released.", status: "current" },
];

export const EVIDENCE = [
  { title: "Why three lanes", body: "Going from four lanes to three is expected to cut all crash types by 29%, including the most common ones on Hawthorne: pedestrians and turning vehicles.", source: "PBOT Decision Report, February 2021." },
  { title: "Why refuge islands", body: "Islands let people cross one direction of traffic at a time. With them, PBOT expected pedestrian crashes to fall by about 50% where they are installed.", source: "PBOT Decision Report, February 2021." },
  { title: "What happened after", body: "At 37th, median speeds fell 17.5% and top-end speeders 41.5%. 95% of the corridor is now within the desired distance of a crossing, up from 66%.", source: "PBOT Evaluation Report, October 2023 (updated June 2025)." },
];

export const PROJECT = {
  id: "hawthorne",
  title: "SE Hawthorne Pave & Paint",
  status: "Completed",
  statusTone: "positive",
  round: "Round 2 replay",
  place: PLACE,
  summary: "PBOT repaved Hawthorne from 23rd to 50th and rebuilt it as a three-lane street with refuge islands and bus lanes. Explore the four alternatives people rated in 2020.",
  team: "Portland Bureau of Transportation",
  closes: "2020-11-30",
  agency: "PBOT",
  url: "https://www.portland.gov/transportation/pbot-projects/se-hawthorne-pave-paint",
  budget: "$4.23 million, including $800,000 for safety",
};

// ——— Place words, used by the proposal and feedback screens ———
const nearestCross = (x) => CROSS_STREETS.reduce((b, c) => (Math.abs(c.x - x) < Math.abs(b.x - x) ? c : b));

export function describePlace(lngLat) {
  if (!lngLat) return "No location yet";
  const [x, y] = F.toLocal(lngLat);
  const c = nearestCross(x);
  const at = Math.abs(c.x - x) <= c.half + 4;
  if (Math.abs(y) <= HALF) return at ? `Hawthorne at ${c.name}` : `Hawthorne near ${c.name}`;
  const side = y > 0 ? "North" : "South";
  if (Math.abs(y) <= HALF + 6) return `${side} sidewalk, ${at ? "at" : "near"} ${c.name}`;
  return `${c.name}, ${side.toLowerCase()} of Hawthorne`;
}

export const WHERE = {
  "L-01": "Along Hawthorne between 35th Pl and 37th",
  "X-36": "Crossing Hawthorne at SE 36th Ave",
  "S-37": "Hawthorne at SE 37th Ave",
  "T-01": "South side of Hawthorne, just east of 37th",
  "T-02": "North side of Hawthorne at 37th",
  "X-38": "Crossing Hawthorne at SE 38th Ave",
  "S-39": "Hawthorne at César E. Chávez Blvd",
  "B-01": "North–south side streets toward the Salmon–Taylor greenway",
};

// "Today" lines for each kind of change, from OSM or the 2020 layout in the Decision Report.
export const TODAY_RULES = [
  [/travel lane/i, "Before 2021: four 9-ft lanes west of Chávez (Decision Report). Today: three lanes (OSM)."],
  [/turn lane/i, "Before 2021: no center turn lane; left-turning drivers blocked a lane (Decision Report)."],
  [/island/i, "Before 2021: people crossed four lanes at once (Decision Report)."],
  [/crosswalk/i, "Marked crossings at 36th and 38th today (OSM)."],
  [/bus|mixing/i, "Before 2021: buses shared general lanes approaching Chávez (Decision Report)."],
  [/bike/i, "No bike lane on Hawthorne (OSM)."],
  [/parking|curb zone|hatched/i, "Parking on both sides (Decision Report)."],
  [/ramp/i, "Many ramps did not meet ADA standards before 2021 (Decision Report)."],
];
export const FID_RULES = [
  [/island|crosswalk/i, "X-36"],
  [/travel lane|turn lane/i, "L-01"],
  [/bus|mixing/i, "S-39"],
  [/bike/i, "B-01"],
  [/ramp/i, "S-37"],
];

// "Three things you'd notice first", per option.
export const NOTICE = {
  1: [
    { title: "Four lanes to cross", body: "Two lanes each way, 9 ft wide. People on foot cross all four at once.", fid: "X-36", xy: [-72.8, 0] },
    { title: "Buses squeezed", body: "Buses are wider than 9-ft lanes. PBOT reported mirror strikes were common.", fid: "T-01", xy: [27, -5] },
    { title: "Left turns block traffic", body: "With no turn lane, a driver waiting to turn left stops a whole lane.", fid: "L-01", xy: [-36, 2] },
  ],
  2: [
    { title: "A center turn lane", body: "One 11–12 ft lane each way. Left-turning drivers wait in the middle.", fid: "L-01", xy: [-36, 0] },
    { title: "Refuge islands at 36th and 38th", body: "8–10 ft islands let people cross one direction at a time.", fid: "X-36", xy: [-72.8, 0] },
    { title: "Bus lanes at Chávez", body: "Red bus and right-turn lanes on both approaches; the eastbound stop moves past the signal.", fid: "S-39", xy: [200, -6] },
  ],
  "3a": [
    { title: "Buffered bike lanes", body: "8 ft including the buffer, between parked cars and traffic.", fid: "B-01", xy: [-36, -4] },
    { title: "Narrow at the islands", body: "At 6-ft islands the bike lane drops to 5 ft with no buffer, and parking is removed.", fid: "X-36", xy: [-72.8, -4] },
    { title: "Mixing zone at Chávez", body: "Buses, bikes and right turns share the outer lane for about a block.", fid: "S-39", xy: [200, -4] },
  ],
  "3b": [
    { title: "Bike lanes at the curb", body: "7.5 ft with buffer, protected by a lane of floating parking.", fid: "B-01", xy: [-36, -6.5] },
    { title: "Hatching near corners", body: "Parking is cleared near intersections so drivers and riders can see each other.", fid: "S-37", xy: [-12, -5] },
    { title: "Less curb for business", body: "About 50–60% of the curb zone is no longer available for parking or other uses.", fid: "L-01", xy: [60, -5] },
  ],
};

// Comparison matrix: relative scores, each cell paraphrasing the Decision Report.
export const MATRIX_ROWS = [
  { id: "safety", label: "Expected crash reduction", truth: "source", cells: {
    1: { score: 1, text: "No significant benefit" },
    2: { score: 3, text: "29% overall; ~50% for pedestrians at islands" },
    "3a": { score: 2, text: "Less than Alt 2; 31% for pedestrians at islands" },
    "3b": { score: 2, text: "Less than Alt 2; 31% for pedestrians at islands" } } },
  { id: "crossing", label: "Crossing on foot", truth: "source", cells: {
    1: { score: 1, text: "Four lanes at once" },
    2: { score: 3, text: "Two lanes, 8–10 ft island" },
    "3a": { score: 2, text: "Four streams, 6 ft island" },
    "3b": { score: 2, text: "Four streams, 6 ft island" } } },
  { id: "transit", label: "Line 14 bus", truth: "source", cells: {
    1: { score: 1, text: "9-ft lanes, mirror strikes" },
    2: { score: 3, text: "Bus lanes at Chávez" },
    "3a": { score: 2, text: "Mixing zone; stops in bike lane" },
    "3b": { score: 2, text: "Mixing zone; stops in bike lane" } } },
  { id: "bike", label: "Biking", truth: "source", cells: {
    1: { score: 1, text: "No bike lanes" },
    2: { score: 2, text: "Greenway connections" },
    "3a": { score: 2, text: "Buffered lane, 5 ft at islands" },
    "3b": { score: 3, text: "Parking-protected lane" } } },
  { id: "curb", label: "Curb zone", truth: "source", cells: {
    1: { score: 2, text: "Parking, close to traffic" },
    2: { score: 3, text: "Parking kept, more buffer" },
    "3a": { score: 2, text: "Narrower at islands" },
    "3b": { score: 1, text: "50–60% lost" } } },
];

// The reasons the Decision Report gives for Alternative 2, from its evaluation (MATRIX_ROWS, EVIDENCE),
// each tied to the theme it answers where there is one.
const cell = (row) => MATRIX_ROWS.find((r) => r.id === row)?.cells[DECISION.chosen].text;
DECISION.why = [
  { title: "The largest expected drop in crashes", detail: cell("safety"), body: EVIDENCE[0].body, theme: "T-SPEED" },
  { title: "Shorter, safer crossings on foot", detail: cell("crossing"), body: EVIDENCE[1].body, theme: "T-CROSS" },
  { title: "Faster, safer trips on Line 14", detail: cell("transit"), body: THEME_BY_ID["T-BUS"].response, theme: "T-BUS" },
  { title: "Better for emergency response", detail: null, body: "PBOT rated it highest of the four for emergency response. This summary doesn't include the details of that rating; see the Decision Report.", theme: null },
  { title: "A curb zone that keeps working", detail: cell("curb"), body: THEME_BY_ID["T-BIZ"].response, theme: "T-BIZ" },
];

export function inProjectArea(lngLat) {
  if (!lngLat) return false;
  const [x, y] = F.toLocal(lngLat);
  return x >= X0 && x <= X1 && Math.abs(y) <= 44;
}

// Existing conditions from OpenStreetMap (npm run osm -- hawthorne).
export const OSM = () => import("./osm-existing.json");

// Project-specific words the shared screens use.
export const COPY = {
  mapLabel: "Map of SE Hawthorne Blvd, Portland",
  alt: "Alternative",
  altShort: "Alt",
  alts: "alternatives",
  round: "round 2",
  agencyShort: "PBOT",
  // Evidence page: one section per EVIDENCE item, then what's known about the place and what isn't.
  evidence: {
    lede: "PBOT's decision leans on two ideas: fewer lanes to cross, and somewhere to wait halfway. Here is how each applies on Hawthorne, what PBOT measured after the street was rebuilt, and where this page's knowledge stops.",
    sections: [
      {
        id: "lanes", label: "Three lanes", ev: 0,
        more: "Hawthorne is about 50 ft from curb to curb. Before 2021, someone crossing on foot faced four 9-ft lanes of traffic in one go. In Alternative 2, they cross one 11–12 ft lane, wait on an 8–10 ft refuge island, then cross the other.",
        // Hawthorne is about 50 ft curb to curb: every PBOT alternative's published lane widths add up to it (estimate, not surveyed).
        crossing: {
          widthFt: 50,
          caption: "Plan view of one crossing. The 50 ft width is estimated from PBOT's published lane widths, not surveyed.",
          plans: [
            { label: "Before · Alternative 1", note: "Four 9-ft lanes at once", layout: [["parking", 7], ["lane", 9], ["lane", 9], ["lane", 9], ["lane", 9], ["parking", 7]] },
            { label: "After · Alternative 2", note: "One 11–12 ft lane, then the island", layout: [["parking", 8], ["lane", 11.5], ["gap", 1], ["island", 9], ["gap", 1], ["lane", 11.5], ["parking", 8]] },
          ],
        },
      },
      { id: "islands", label: "Refuge islands", ev: 1, more: "The bike-lane alternatives left room only for 6-ft islands, which PBOT expected to do less.", matrix: ["safety", "crossing"] },
      { id: "after", label: "What happened after", ev: 2, results: true, link: { src: "evaluation", label: "Read the Evaluation Report" } },
    ],
    placeLabel: "This street",
    placeLead: "What OpenStreetMap records on Hawthorne between SE 35th Pl and SE César E. Chávez Blvd today, and what this demo doesn't have.",
    known: [
      "Hawthorne is mapped with 3 lanes and a 20 mph limit",
      "Traffic signals at 35th Pl, 37th and César E. Chávez Blvd",
      "Marked crossings without a signal at 36th and 38th",
      "Line 14 stops at 37th: eastbound with a shelter and bench, westbound without",
      "No bike lane is mapped on Hawthorne itself",
    ],
    unknown: [
      "Crash records for individual crossings — PBOT plans updates in 2026 and 2028 as crash data is released",
      "Surveyed curb-to-curb widths",
      "Traffic counts and bus travel times, beyond what PBOT's reports summarise",
      "The exact positions of the 163 rebuilt curb ramps — the map's ramps are drawn, not surveyed",
      "How many medium- and lower-priority crossings get islands depended on budget",
    ],
    noEstimate: "crash reductions",
    sources: [
      { k: "Decision", src: "decision", text: "Alternatives, widths and expected crash reductions." },
      { k: "Results", src: "evaluation", text: "Speeds, crossings and crashes after the project." },
      { k: "Distances", text: "About 50 ft curb to curb, estimated from PBOT's published lane widths. Not surveyed." },
    ],
    osmCovers: "Lanes, speed limit, signals, crossings and bus stops.",
  },
  glossary: [
    { term: "Refuge island", def: "A raised island in the middle of the street. People crossing on foot can stop there and cross one direction of traffic at a time." },
    { term: "Center turn lane", def: "A lane in the middle of the street where drivers wait to turn left, instead of stopping in a travel lane." },
    { term: "Bus and right-turn lane", def: "A lane only buses and right-turning drivers may use, so the bus can pass queued traffic before a signal." },
    { term: "Mixing zone", def: "A stretch where buses, bikes and right-turning drivers share one lane before an intersection." },
    { term: "Buffered bike lane", def: "A painted bike lane with an extra striped space between it and traffic or parked cars." },
    { term: "Parking-protected bike lane", def: "A bike lane next to the curb, with parked cars between it and traffic." },
    { term: "Curb zone", def: "The space along the curb: parking, loading, bike corrals, street seats and parklets." },
    { term: "Neighborhood greenway", def: "A quiet side street set up for walking and biking, such as Salmon–Taylor or Lincoln–Harrison near Hawthorne." },
  ],
  textSources: "Facts about the street today come from OpenStreetMap. The alternatives, decision, timeline and results come from PBOT's published reports, listed under Sources. The alternative drawings are concept drawings from PBOT's published widths.",
  textToday: "SE Hawthorne Blvd runs east–west. This page covers it from SE 35th Pl to SE César E. Chávez Blvd, crossing 36th Ave, 37th Ave and 38th Ave. The street today is the one PBOT built in 2021.",
  describeExample: "the crossing at 36th, south side",
  idExample: "X-36 for the crossing at SE 36th Ave",
  // What happened after the project was built (Evaluation Report).
  results: null,
  // The street as built, for the text version's comparison table: OSM facts, and PBOT's after-project results.
  todayRow: null,
  illustrativeLabel: "Concept drawing · from PBOT's published widths",
  stages: ["Round 1 ideas", "Round 2 feedback", "Refining", "Decision published", "Completed"],
  replayStage: "Round 2 feedback",
  replayStep: "Round 2 opened",
  replayContext: "when people rated PBOT's four alternatives. The map shows the street as built in 2021.",
  describePlaceholder: "e.g. the bus stop on the south side of Hawthorne, just east of 37th",
  commentPlaceholder: "e.g. When I cross Hawthorne here with a stroller, drivers in the second lane don't see me until I'm in the road.",
  pickMapLabel: "Map of SE Hawthorne Blvd from 35th Pl to César E. Chávez Blvd.",
  wholeThing: "the street",
  timelineLinks: {
    "Round 1 opened": { to: "../themes", label: "What people raised", icon: "comment" },
    "Round 2 opened": { to: "../alternatives", label: "The 4 alternatives", icon: "layers" },
    "Alternatives refined": { to: "../revision", label: "How Alternative 2 was refined", icon: "swap" },
    "Decision published": { to: "../decision", label: "Decision summary", icon: "doc" },
    "Built": { to: "../explore", label: "Hawthorne today", icon: "map" },
    "Evaluation updated": { to: "../evidence", label: "What happened after", icon: "check" },
  },
  revisionNote: "Both versions are concept drawings from PBOT's published widths.",
  placeShort: "SE Hawthorne",
  photoNote: "Photos may predate the 2021 project.",
  decisionDoc: "Decision Report",
  matrixBasis: "evaluation",
  altsLead: "Same street, same camera. Switching alternatives only changes what's drawn on the map.",
  altsChosenNote: "PBOT chose a refined Alternative 2 in February 2021; the others stay here so you can see what was traded.",
  compareLead: "Drag the handle across the same stretch of Hawthorne, today and as PBOT drew it. Nothing else on the map changes.",
  compareNote: (alt) => `Today comes from OpenStreetMap and shows the street as built in 2021. ${alt} is a concept drawing from PBOT's published lane widths, not a design drawing.`,
  exploreTitle: "How Hawthorne works now",
  exploreLead: "Start with what's there: the street as rebuilt in 2021.",
  featuresLabel: "Features on this stretch of Hawthorne",
  drawingNote: "The alternatives are concept drawings from PBOT's published lane widths — don't measure from them.",
  raisedYear: "2020",
  streetContext: "Today, as photographed. Photos may predate the 2021 project.",
  tourIntro: "The map moves for you: Hawthorne today, why it changed, the chosen design, the alternatives, and what people said. About two minutes.",
  themesSource: "Themes and responses summarise PBOT's Decision Report.",
  builtNote: "The street was built in fall 2021.",
  stepLinks: { today: ["explore", "See Hawthorne today"], problem: ["inspect/X-36", "Inspect the crossing at 36th"], proposal: ["explore?show=2", "Open Alternative 2"], compare: ["compare", "Compare the alternatives"], feedback: ["feedback", "Try the round 2 feedback flow"] },
  // Overview "what PBOT chose": each change in the chosen alternative → icon and the map feature kinds it describes.
  changeRules: [
    [/turn lane/i, "layers", ["turn-lane"]],
    [/island/i, "walk", ["refuge-island", "crosswalk"]],
    [/bus/i, "bus", ["bus-lane", "bus-stop"]],
    [/parking/i, "truck", ["parking"]],
    [/ramp/i, "access", ["curb-ramp"]],
  ],
};

const feature = (id) => EXISTING_FEATURES.find((f) => f.id === id);
COPY.results = { body: EVIDENCE[2].body, source: EVIDENCE[2].source, url: SOURCES.evaluation.url, linkLabel: "Read the Evaluation Report" };
COPY.todayRow = () => ({
  safety: `${RESULTS[0].label}: ${RESULTS[0].value} (PBOT Evaluation Report)`,
  crossing: feature("X-36")?.facts[0],
  transit: feature("S-39")?.facts[1],
  bike: feature("B-01")?.facts[0],
  curb: TODAY_RULES.find(([re]) => re.test("parking"))?.[1],
});
