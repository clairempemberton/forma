// Creston Park Skatepark, Creston Park, SE 44th Ave & Powell Blvd, Portland, Oregon.
//
// Truth labels used throughout the app (see hawthorne.js):
//   "source"       — stated in a cited PP&R document (see SOURCES)
//   "osm"          — real, from OpenStreetMap (© OpenStreetMap contributors, ODbL), see osm-creston-skatepark.json
//   "estimate"     — derived from OSM geometry or PP&R's square footage with a stated assumption
//   "illustrative" — PP&R's concept drawings are marked "not to scale": areas match the published square
//                    footage, element positions are read off the drawings and are approximate
//   "sample"       — sample resident comments; not real people
//
// Forma is an unofficial concept. It is not affiliated with the City of Portland or Portland Parks & Recreation.

import { makeFrame, rect, point, collection } from "../lib/geo.js";

// Centre of the former tennis courts (OSM way 58059958), now the skatepark site.
export const ORIGIN = [-122.615359, 45.496708];
export const F = makeFrame(ORIGIN);

export const SOURCES = {
  decision: { title: "Creston Park Skatepark Project", publisher: "Portland Parks & Recreation", date: "updated May 2023 to June 2026", url: "https://www.portland.gov/parks/construction/creston-park-skatepark-project" },
  engagement: { title: "Community Engagement Summary, December 2023", publisher: "Portland Parks & Recreation", date: "December 2023", url: "https://www.portland.gov/parks/documents/creston-park-skatepark-community-engagement-summary-december-2023/download" },
  conceptD: { title: "Concept D, full design suite", publisher: "PP&R, Mears Design Group, DECA Architect", date: "November 2023", url: "https://www.portland.gov/parks/documents/creston-park-skatepark-concept-d-full-design-suite/download" },
  conceptE: { title: "Concept E, full design suite", publisher: "PP&R, Mears Design Group, DECA Architect", date: "November 2023", url: "https://www.portland.gov/parks/documents/creston-park-skatepark-concept-e-full-design-suite/download" },
  final: { title: "Final design, overhead view", publisher: "PP&R, Mears Design Group, DECA Architect", date: "May 2024", url: "https://www.portland.gov/parks/documents/creston-skatepark-final-design-overhead-view/download" },
  osm: { title: "OpenStreetMap", publisher: "OpenStreetMap contributors (ODbL)", date: "fetched October 2026", url: "https://www.openstreetmap.org/way/58059958" },
};

// ——— Site geometry, in local metres: x east, y north. ———
// The old courts' fence is about 35 × 35 m (OSM). Each concept's footprint is drawn as a rectangle with the
// square footage PP&R published; the drawings show the park running past the old fence on the west side.
const FENCE = 17.4;
// Final concept: 15,600 sq ft ≈ 1,449 m², drawn 45.3 × 32 m. Roof 10,700 sq ft ≈ 994 m², drawn 41 × 24.25 m.
// Option D: 16,940 sq ft ≈ 1,574 m², drawn 47 × 33.5 m. Roof 10,500 sq ft ≈ 975 m², drawn 41 × 23.8 m.
// Option E: 14,180 sq ft ≈ 1,317 m², drawn 41 × 32 m. Roofs 3,045 sq ft (north) + 7,075 sq ft (south).

const area = (x0, y0, x1, y1, sqft) => rect(F, x0, y0, x1, y1, { kind: "skate-area", label: `Skatepark, ${sqft.toLocaleString("en-US")} sq ft` });
const roof = (x0, y0, x1, y1, sqft, id, label = "Roof") => rect(F, x0, y0, x1, y1, { kind: "cover", id, label: `${label}, ${sqft.toLocaleString("en-US")} sq ft` });
const el = (id, xy, label) => point(F, xy, { kind: "skate-element", id, label });

// Option D (November 2023): one roof over the south of the park; entry plaza and skateable seating in the northwest.
function optionD() {
  return collection([
    area(-28, -17, 19, 16.5, 16940),
    roof(-22, -17, 19, 6.8, 10500, "RF-1", "One roof"),
    rect(F, -27, 4, -20, 13, { kind: "plaza", id: "PZ-1", label: "Entry plaza with skateable seating" }),
    rect(F, 3, -14.5, 13.5, -7, { kind: "bowl", id: "BW-1", label: "Mini ramp bowl with pool coping" }),
    el("E-1", [-19.1, 12.5], "Skateable seating around the entrance"),
    el("E-2", [-6.1, 10.7], "Ledges at different heights"),
    el("E-3", [10.9, 6.2], "Hubba ledge"),
    el("E-4", [12.9, 1.8], "Euro gap"),
    el("E-5", [-3.2, 3.1], "Stairs and rail"),
    el("E-6", [-12.6, -3.6], "Ledges with a 2-block gap"),
    el("E-7", [-16.7, -6.3], "Volcano"),
    el("E-8", [-10.2, -6.3], "Volcano"),
    el("E-9", [-20.7, -8.1], "Tight DIY-style quarter pipe"),
    el("E-10", [-11.8, -9.4], "Pyramid hip"),
    el("E-11", [2.8, -4.5], "Quarter pipe hip with pool coping"),
  ]);
}

// Option E (November 2023): two roofs, a bowl under the north one, the entry plaza on the west.
function optionE() {
  return collection([
    area(-24, -16, 17, 16, 14180),
    roof(-3.2, 2, 17, 16, 3045, "RF-1", "North roof"),
    roof(-21.6, -16, 17, 1, 7075, "RF-2", "South roof"),
    rect(F, -29, 0, -24, 7, { kind: "plaza", id: "PZ-1", label: "Entry plaza" }),
    rect(F, 1.5, 5, 12, 13, { kind: "bowl", id: "BW-1", label: "Bowl, about 2 ft below the deck" }),
    el("E-1", [-17.9, 11.6], "Bank art “chair”"),
    el("E-2", [-7.2, 8.5], "Bank-to-bank with gap"),
    el("E-3", [12.4, 12.5], "Taco"),
    el("E-4", [-16.1, 0.2], "A-frame and spine"),
    el("E-5", [1.4, 2.8], "Brick bank with ledge seat"),
    el("E-6", [-3.6, -0.7], "Volcano"),
    el("E-7", [2.8, -3.3], "Volcano"),
    el("E-8", [9.6, -4.2], "Volcano"),
    el("E-9", [-16.1, -11.6], "Quarter pipes and 60° bank extension"),
    el("E-10", [1, -13], "Hip"),
  ]);
}

// Final concept (May 2024): Option D's single roof and plaza, reworked after round 3.
function finalG() {
  return collection([
    area(-26.3, -16, 19, 16, 15600),
    roof(-22, -16, 19, 8.25, 10700, "RF-1", "One roof"),
    rect(F, -32, 2, -26.3, 12, { kind: "plaza", id: "PZ-1", label: "Entry plaza" }),
    rect(F, 3, -14, 15.5, -4.6, { kind: "bowl", id: "BW-1", label: "Mini ramp bowl with pool coping" }),
    el("E-1", [-11.5, 9.8], "Flat rail and slappy curb"),
    el("E-2", [0.4, 8.9], "Euro gap and brick bank to curb"),
    el("E-3", [5, 1.3], "Spine"),
    el("E-4", [-16.2, -0.9], "Brick bank and bank to ledge"),
    el("E-5", [-8.2, -1.8], "Tight brick volcano"),
    el("E-6", [-13.1, -7.1], "Quarter pipe and toe nail"),
    el("E-7", [-11.5, -11], "Rail"),
    el("E-8", [-11.5, -14], "Ledge"),
    el("E-9", [9.7, -4.4], "Extension, 8 ft wall"),
    el("E-10", [15.9, 0.9], "Quarter pipe hip"),
    el("E-11", [17.5, -13.3], "Taco"),
  ]);
}

export const CAMERA = {
  home: { center: F.toLngLat([-28, 0]), zoom: 18.35, bearing: 0, pitch: 0 },
  overview: { center: F.toLngLat([-28, -4]), zoom: 18.35, bearing: 0, pitch: 0 },
  three: { center: F.toLngLat([-6, -2]), zoom: 19.2, bearing: -28, pitch: 58 },
  compare: { center: F.toLngLat([-6, 0]), zoom: 19.1, bearing: 0, pitch: 0 },
};

export const PLACE = {
  name: "Creston Park, SE 44th Ave & Powell Blvd",
  short: "Creston Park",
  neighborhood: "Creston-Kenilworth",
  city: "Portland, Oregon",
  coordinates: ORIGIN,
  source: "© OpenStreetMap contributors",
};

// ——— Existing conditions: inspectable features, as mapped before construction began in January 2026. ———
export const EXISTING_FEATURES = [
  {
    id: "K-01", kind: "park", name: "Old tennis courts · Creston DIY", lngLat: ORIGIN, osm: "way/58059958",
    summary: "Community-built skate spot on the old court surface",
    facts: ["The tennis courts were converted into a community-built skatepark on the existing court surface (PP&R)", "Fenced area of about 35 × 35 m (OSM, estimate)", "In round 3, 99 of 231 respondents (42.86%) said they skate here (PP&R survey)", "Closed January 13, 2026, when construction began (PP&R)"],
  },
  {
    id: "P-01", kind: "park", name: "Creston Pool", lngLat: [-122.616382, 45.496743], osm: "way/58059959",
    summary: "Outdoor community pool, west of the skate area",
    facts: ["Mapped as an outdoor swimming pool (OSM)", "The pool lacked ADA access from the parking lot; the project adds an accessible path to the pool and skate areas (PP&R)"],
  },
  {
    id: "S-01", kind: "path", name: "Stairs to the upper park", lngLat: [-122.615928, 45.496465], osm: "way/518925885",
    summary: "Stairs between the lower park and the upper park and school",
    facts: ["Mapped as concrete steps (OSM)", "Being removed and replaced as part of the project (PP&R)"],
  },
  {
    id: "B-01", kind: "bike", name: "Bike parking by the pool", lngLat: [-122.61597, 45.4967], osm: "node/5061007144",
    summary: "Bike stands between the pool and the courts",
    facts: ["Bike stands mapped beside the pool and skate area (OSM)"],
  },
  {
    id: "X-45", kind: "crossing", name: "Crossing SE Powell at 45th", lngLat: [-122.616277, 45.497596], osm: "node/1391202248",
    summary: "Marked crossing without a signal",
    facts: ["Mapped as an uncontrolled, marked crossing of SE Powell (OSM)", "SE Powell runs along the north edge of the park (OSM)"],
  },
  {
    id: "T-01", kind: "transit", name: "SE Powell & 47th", lngLat: [-122.615206, 45.497618], osm: "node/7424279444",
    summary: "Bus stop on SE Powell, north of the courts",
    facts: ["Bus stop mapped with TriMet Line 9 (OSM)"],
  },
].map((f) => ({ ...f, truth: "osm" }));

// Project area: the skate area, the pool and the stairs between them.
export const BOUNDARY = collection([rect(F, -100, -32, 26, 30, { kind: "boundary", label: "Project area" })]);
export const STREET_LABELS = collection([]);
export const CROSS_STREETS = [];

export const OPTIONS = [
  {
    id: "D", name: "One roof, mini ramp bowl", short: "One roof",
    summary: "A 16,940 sq ft skatepark with one roof over 10,500 sq ft, a mini ramp bowl with pool coping, and an entry plaza with skateable seating.",
    changes: ["16,940 sq ft skatepark", "One roof over 10,500 sq ft", "Mini ramp bowl with pool coping", "Entry plaza with skateable seating around it", "14 kinds of elements: ledges, rails, banks, volcanoes, a hip, a euro gap and more"],
    benefits: ["Rated “It's amazing!” by 46.96% of round 3 respondents", "The larger of the two: 16,940 sq ft", "One continuous roof"],
    tradeoffs: ["Round skateable seating at the entrance, which people later asked to remove", "Several volcanoes; people asked PP&R to go easy on them"],
    geojson: optionD(),
  },
  {
    id: "E", name: "Two roofs, deeper bowl", short: "Two roofs",
    summary: "A 14,180 sq ft skatepark with two roofs (3,045 and 7,075 sq ft), a bowl about 2 ft below the deck under the north roof, and an entry plaza on the west.",
    changes: ["14,180 sq ft skatepark", "Two roofs: 3,045 sq ft north and 7,075 sq ft south", "Bowl and kidney bowl, about 2 ft below the deck", "Entry plaza on the west side", "17 kinds of elements, including a taco, an A-frame and a spine"],
    benefits: ["The most kinds of elements: 17", "A deeper bowl under its own roof"],
    tradeoffs: ["41.85% of round 3 respondents said “We can do better”", "Smaller: 14,180 sq ft", "The roof is split in two"],
    geojson: optionE(),
  },
];

export const OPTION_BY_ID = Object.fromEntries(OPTIONS.map((o) => [o.id, o]));

// Option D as rated in round 3, and the final concept PP&R built from it.
export const VERSIONS = [
  { id: "v1", label: "Round 3", date: "2023-11-08", geojson: optionD(), note: "Option D as rated in round 3." },
  { id: "v2", label: "Final", date: "2024-05-01", geojson: finalG(), note: "The final concept, published in May 2024, after a last round of feedback in January and February. PP&R didn't say which request led to which change; the pairing below is Forma's reading of the two drawings." },
];

export const REVISION_CHANGES = [
  { id: "RC-1", title: "Seating at the entrance", before: "Round skateable seating around the entrance (Option D)", after: "Removed from the final design", themes: ["T-GATHER"], lngLat: F.toLngLat([-19.1, 12.5]), status: "changed" },
  { id: "RC-2", title: "Brick features", before: "Concrete banks and two volcanoes", after: "A brick bank, a brick bank to curb and one tight brick volcano", themes: ["T-STREET"], lngLat: F.toLngLat([-8.2, -1.8]), status: "changed" },
  { id: "RC-3", title: "More rails and ledges", before: "One rail by the stairs and one bank to ledge", after: "A second rail and a second bank to ledge", themes: ["T-STREET"], lngLat: F.toLngLat([-11.5, -11]), status: "changed" },
  { id: "RC-4", title: "The roof", before: "One roof over 10,500 sq ft", after: "One roof over 10,700 sq ft. Drainage details aren't in the published drawings", themes: ["T-COVER", "T-WATER"], lngLat: F.toLngLat([0, -4]), status: "changed" },
  { id: "RC-5", title: "A nod to Creston DIY", before: "A “tight DIY style 1/4 pipe” in Option D", after: "No feature is labelled DIY in the final drawing. PP&R keeps it as a design goal", themes: ["T-DIY"], lngLat: F.toLngLat([-20.7, -8.1]), status: "not-changed" },
];

// The guided story. Each step names a camera and the layers it shows.
export const STORY = [
  { id: "today", title: "Creston Park before construction", body: "The old tennis courts had become Creston DIY, a skate spot built by the community. Every fact on the map comes from OpenStreetMap.", camera: CAMERA.home, show: { existing: true } },
  { id: "problem", title: "Why here", body: "65% of Portland households aren't within two miles of a skatepark, the biggest gap PP&R found. Of three candidate sites, Creston has the most people within two miles.", camera: { center: F.toLngLat([0, 0]), zoom: 19.3, bearing: 0, pitch: 30 }, focus: "K-01", show: { existing: true, comments: true } },
  { id: "proposal", title: "The chosen design", body: "Option D, refined: one roof over 10,700 sq ft, a mini ramp bowl and street features throughout.", camera: { center: F.toLngLat([-4, -2]), zoom: 19.2, bearing: -20, pitch: 50 }, option: "D", show: { proposal: true } },
  { id: "compare", title: "The other concept", body: "Option E split the roof in two and dug a deeper bowl under the north roof. Same site, different trade-offs.", camera: CAMERA.home, option: "E", show: { proposal: true } },
  { id: "feedback", title: "What people said", body: "233 people rated D and E in round 3. Drop a pin to try the feedback flow yourself.", camera: CAMERA.home, show: { comments: true } },
];

// ——— Themes: what PP&R reported learning in December 2023, and what the final design shows. ———
const THEME_LIST = [
  { id: "T-COVER", name: "Cover it and light it", short: "Roof & lights", icon: "sparkle", response: "One roof over 10,700 sq ft in the final design, with lighting. PP&R says a roof allows year-round skating and lights add hours a day from October to March.", status: "addressed" },
  { id: "T-STREET", name: "Street features: ledges and rails", short: "Street features", icon: "layers", response: "The final design keeps D's ledges, rails, manual pads and euro gap, and adds a second rail, a second bank to ledge and brick features.", status: "addressed" },
  { id: "T-DIY", name: "Pay homage to Creston DIY", short: "Creston DIY", icon: "history", response: "A design goal for PP&R. No feature in the final drawing is labelled as a DIY tribute.", status: "partly" },
  { id: "T-GATHER", name: "A place to gather", short: "Gathering", icon: "users", response: "An entry plaza stays in the final design. The round skateable seating at the entrance was removed, as people asked.", status: "addressed" },
  { id: "T-WATER", name: "Keep the skating dry", short: "Drainage", icon: "alert", response: "PP&R's goal is to control water run-off from the roof. Roof and drainage details aren't in the published drawings.", status: "partly" },
  { id: "T-ACCESS", name: "All wheels, all abilities", short: "Access", icon: "access", response: "A mix of street and transition features for every level, and a new accessible path to the pool and skate areas.", status: "addressed" },
];

const C = (id, xy, theme, text, extra = {}) => ({ id, lngLat: F.toLngLat(xy), theme, text, sentiment: "concern", option: null, date: "2023-11-12", author: "Resident", ...extra });

// Sample comments written for this demo. They are not real people's words.
export const SAMPLE_COMMENTS = [
  C("k01", [-2, -6], "T-COVER", "A roof is the whole point. Half the year the DIY spot is a puddle.", { option: "D", sentiment: "support", date: "2023-11-08", author: "Skater" }),
  C("k02", [6, 9], "T-COVER", "Two roofs leave a wet strip right through the middle of the park.", { option: "E", date: "2023-11-09", author: "Skater" }),
  C("k03", [-10, 4], "T-COVER", "Lights please. After school in December it's dark by five.", { sentiment: "idea", date: "2023-11-14", author: "Parent" }),
  C("k04", [-6, 10], "T-STREET", "More ledges and rails, fewer lumps. Street is what most of us skate.", { option: "D", sentiment: "idea", date: "2023-11-10", author: "Skater" }),
  C("k05", [-14, -6], "T-STREET", "Too many volcanoes in D. One good one is plenty.", { option: "D", date: "2023-11-13", author: "Skater" }),
  C("k06", [8, -10], "T-STREET", "The mini ramp bowl is perfect for learning transition.", { option: "D", sentiment: "support", date: "2023-11-15", author: "Skater" }),
  C("k07", [6, 8], "T-STREET", "If there's a bowl, go deep. E's bowl is the best thing in either plan.", { option: "E", sentiment: "support", date: "2023-11-18", author: "Skater" }),
  C("k08", [0, 0], "T-DIY", "Keep something from the DIY. People built this spot by hand.", { sentiment: "idea", date: "2023-11-09", author: "Skater" }),
  C("k09", [-20, -8], "T-DIY", "The tight DIY-style quarter pipe is a nice nod. Don't lose it.", { option: "D", sentiment: "support", date: "2023-11-20" }),
  C("k10", [-24, 8], "T-GATHER", "The round seating at the entrance gets in the way. Just give us a plaza.", { option: "D", date: "2023-11-11" }),
  C("k11", [-28, 4], "T-GATHER", "Somewhere for parents to sit and watch, out of the line of skaters.", { sentiment: "idea", date: "2023-11-16", author: "Parent" }),
  C("k12", [-30, -2], "T-GATHER", "Make it a place people hang out, not just skate through.", { sentiment: "idea", date: "2023-11-22" }),
  C("k13", [10, -12], "T-WATER", "Where does the roof water go? Don't dump it onto the bowl.", { date: "2023-11-14" }),
  C("k14", [-16, -14], "T-WATER", "Drains at the low points, please. The courts flood now.", { date: "2023-11-24" }),
  C("k15", [-46, -12], "T-ACCESS", "There's no step-free way from the parking lot to the pool or the courts.", { date: "2023-11-12", author: "Resident · uses a wheelchair" }),
  C("k16", [-12, 2], "T-ACCESS", "Space for beginners away from the fast lines.", { sentiment: "idea", date: "2023-11-17", author: "Parent" }),
  C("k17", [-30, -10], "T-ACCESS", "Scooters and BMX too. Build it for every kind of wheel.", { sentiment: "idea", date: "2023-11-21" }),
  C("k18", [-40, -18], "T-ACCESS", "The old stairs down from the school are steep and crumbling.", { sentiment: "neutral", date: "2023-11-25" }),
].map((c) => ({ ...c, truth: "sample", public: true }));

export const THEMES = THEME_LIST.map((t) => ({ ...t, color: "accent", count: SAMPLE_COMMENTS.filter((c) => c.theme === t.id).length }));
export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]));

// Round 3 survey, November 8–27, 2023 (Community Engagement Summary, survey export pp. 21–97).
export const SURVEY = {
  window: "November 2023",
  groups: [
    { label: "Option D", respondents: 230, result: "46.96% “It's amazing!” · 43.48% “It's ok.” · 9.57% “I'm not a fan.”" },
    { label: "Option E", respondents: 227, result: "19.82% “It's amazing!” · 38.33% “It's ok.” · 41.85% “We can do better.”" },
  ],
  total: 233,
  totalResult: "PP&R: Option D was “easily the favorite”",
  note: "The first survey, in May 2023, drew 669 responses; across its three surveys PP&R received over 1,250. Round 2's counts and the results of the final January–February 2024 round weren't published.",
  lead: "233 people answered PP&R's third survey, November 8 to 27, 2023, after Workshop #3. Each rated the two revised concepts, D and E.",
  caption: "Round 3 ratings of Options D and E",
  columns: ["Concept", "Answered", "How people rated it"],
};

// Not open yet: no evaluation results.
export const RESULTS = [];

export const DECISION = {
  headline: "PP&R built the final design on Option D",
  whyLead: "Of the two concepts in round 3, PP&R called Option D “easily the favorite”. The final design keeps its single roof, entry plaza and mini ramp bowl, and reworks its features around what people asked for.",
  status: "Final concept published",
  date: "2024-05-01",
  chosen: "D",
  version: "v2",
  body: "PP&R took Option D forward. After a last round of feedback in January and February 2024, it published the final concept in May 2024: a 15,600 sq ft skatepark with 10,700 sq ft under one roof.",
  notAdopted: [
    { title: "Option E: two roofs", reason: "41.85% of round 3 respondents said “We can do better”, against 9.57% “I'm not a fan” for D. PP&R didn't give a separate reason; the final design has one roof." },
    { title: "Concepts A, B and C", reason: "Shown at Workshop #2 in August 2023, then replaced by D and E once that feedback was incorporated. Their survey results weren't published." },
    { title: "Powell Park and Glenwood Park", reason: "PP&R recommended Creston: the most people within two miles, more youth and people of color, and an existing parking lot. Powell has no onsite parking; Glenwood has homes on three sides." },
  ],
  unresolved: ["Results of the final feedback round, January 31 to February 14, 2024, weren't published", "PP&R hasn't published a final project cost", "Roof drainage and lighting details aren't in the published drawings"],
};

export const TIMELINE = [
  { date: "2022-12-01", title: "Funding announced", body: "$5 million in Parks System Development Charges for a new skatepark in Southeast Portland.", status: "done" },
  { date: "2023-05-03", title: "Round 1 opened", body: "Site selection workshop and survey. 669 responses, triple PP&R's other skate projects.", status: "done" },
  { date: "2023-08-24", title: "Round 2 opened", body: "Workshop #2 at Creston Park, 110 attendees, concepts A, B and C.", status: "done" },
  { date: "2023-11-08", title: "Round 3 opened", body: "Workshop #3, 85 attendees. 233 people rated concepts D and E, November 8 to 27.", status: "done" },
  { date: "2024-01-31", title: "Final round", body: "A proposed concept built on Option D, with feedback January 31 to February 14.", status: "done" },
  { date: "2024-05-01", title: "Final concept published", body: "15,600 sq ft skatepark, 10,700 sq ft covered.", status: "done" },
  { date: "2025-11-01", title: "Contractors chosen", body: "Paul Brothers as general contractor; Evergreen Skateparks builds the skatepark.", status: "done" },
  { date: "2026-01-13", title: "Construction began", body: "The DIY spot and the lower park closed. The covered building started in May 2026.", status: "done" },
  { date: "2026-10-01", title: "Grand opening", body: "PP&R expects to finish in fall 2026 and hopes to open in October (date subject to change).", status: "current" },
];

export const EVIDENCE = [
  { title: "The community's favorite", body: "In round 3, 46.96% of 230 people rated Option D “It's amazing!” and 9.57% “I'm not a fan”. For Option E, 41.85% of 227 said “We can do better”. PP&R called D “easily the favorite”.", source: "PP&R Community Engagement Summary, December 2023 (survey export)." },
  { title: "Why a roof and lights", body: "The first survey showed overwhelming support for a covered, lighted skatepark. Portland averages about 140 rainy or snowy days a year, and PP&R says lighting adds several hours of skating a day from October to March.", source: "PP&R project page, June 2023 update." },
  { title: "Why Creston", body: "65% of Portland households aren't within two miles of a skatepark, the largest gap of the 13 assets in PP&R's level-of-service study. Of three candidate sites, Creston has the most people within two miles, with more youth and people of color.", source: "PP&R project page, May 2023." },
];

export const PROJECT = {
  id: "creston-skatepark",
  title: "Creston Park Skatepark",
  status: "Under construction",
  statusTone: "danger",
  round: "Round 3 replay",
  place: PLACE,
  summary: "PP&R is building Portland's first covered skatepark on Creston Park's old tennis courts. Explore the two concepts people rated in November 2023, and how the final design grew from Option D.",
  team: "Portland Parks & Recreation",
  closes: "2023-11-27",
  agency: "PP&R",
  url: "https://www.portland.gov/parks/construction/creston-park-skatepark-project",
  budget: "$5 million in park development charges",
};

// ——— Place words, used by the proposal and feedback screens ———
export function describePlace(lngLat) {
  if (!lngLat) return "No location yet";
  const [x, y] = F.toLocal(lngLat);
  if (Math.abs(x) <= FENCE + 8 && Math.abs(y) <= FENCE) {
    const ns = y > 6 ? "north" : y < -6 ? "south" : "middle";
    const ew = x > 6 ? "east" : x < -6 ? "west" : "centre";
    return ns === "middle" && ew === "centre" ? "Middle of the skate area" : `Skate area, ${ns === "middle" ? ew : ew === "centre" ? ns : `${ns}${ew}`} side`;
  }
  if (x < -FENCE - 8 && x > -55 && Math.abs(y) < 20) return "Between the pool and the skate area";
  if (x <= -55) return "By Creston Pool";
  if (y < -FENCE) return "South of the skate area, toward the upper park";
  return "Creston Park, north of the skate area";
}

export const WHERE = {
  "K-01": "The old tennis courts, east of the pool",
  "P-01": "West of the skate area",
  "S-01": "Southwest of the courts, up to the school",
  "B-01": "Between the pool and the courts",
  "X-45": "SE Powell Blvd at 45th, north edge of the park",
  "T-01": "SE Powell Blvd, north of the courts",
};

// "Before construction" lines for each kind of change.
export const TODAY_RULES = [
  [/roof/i, "No roof: the DIY spot was open to the weather (PP&R)."],
  [/sq ft skatepark/i, "Old tennis courts, about 35 × 35 m inside the fence (OSM, estimate)."],
  [/bowl/i, "No bowl: DIY features built on the flat court surface (PP&R)."],
  [/plaza|seating/i, "A fenced court with a gate (OSM)."],
  [/elements/i, "Community-built street features on the court surface (PP&R)."],
];
export const FID_RULES = [
  [/roof|sq ft|bowl|elements/i, "K-01"],
  [/plaza|seating/i, "P-01"],
];

// "Three things you'd notice first", per option.
export const NOTICE = {
  D: [
    { title: "One big roof", body: "10,500 sq ft under a single roof over the south of the park.", fid: "K-01", xy: [-2, -5] },
    { title: "A mini ramp bowl", body: "A mini ramp bowl with pool coping in the southeast corner.", fid: "K-01", xy: [8, -10.7] },
    { title: "Seating around the entrance", body: "Round skateable seating curves around the entry plaza in the northwest.", fid: "P-01", xy: [-19.1, 12.5] },
  ],
  E: [
    { title: "Two roofs", body: "3,045 sq ft over the northeast bowl and 7,075 sq ft over the south, with open deck between.", fid: "K-01", xy: [-4, 1.5] },
    { title: "A deeper bowl", body: "A bowl about 2 ft below the deck, under the north roof.", fid: "K-01", xy: [6.5, 9] },
    { title: "A smaller park", body: "14,180 sq ft, about 2,760 sq ft less than Option D.", fid: "K-01", xy: [-16, 0] },
  ],
};

// Comparison matrix: relative scores, each cell from PP&R's published figures.
export const MATRIX_ROWS = [
  { id: "rating", label: "How round 3 rated it", truth: "source", cells: {
    D: { score: 3, text: "46.96% amazing, 9.57% not a fan" },
    E: { score: 1, text: "19.82% amazing, 41.85% can do better" } } },
  { id: "size", label: "Skatepark area", truth: "source", cells: {
    D: { score: 3, text: "16,940 sq ft" },
    E: { score: 2, text: "14,180 sq ft" } } },
  { id: "cover", label: "Covered area", truth: "source", cells: {
    D: { score: 3, text: "10,500 sq ft, one roof" },
    E: { score: 2, text: "10,120 sq ft, two roofs" } } },
  { id: "features", label: "Kinds of elements", truth: "source", cells: {
    D: { score: 2, text: "14, including a mini ramp bowl" },
    E: { score: 2, text: "17, including a bowl and kidney bowl" } } },
];

const cell = (row) => MATRIX_ROWS.find((r) => r.id === row)?.cells[DECISION.chosen].text;
DECISION.why = [
  { title: "The clear favorite", detail: cell("rating"), body: EVIDENCE[0].body, theme: null },
  { title: "One roof for year-round skating", detail: cell("cover"), body: EVIDENCE[1].body, theme: "T-COVER" },
  { title: "Street features people asked for", detail: null, body: THEME_BY_ID["T-STREET"].response, theme: "T-STREET" },
  { title: "Somewhere to gather", detail: null, body: THEME_BY_ID["T-GATHER"].response, theme: "T-GATHER" },
];

export function inProjectArea(lngLat) {
  if (!lngLat) return false;
  const [x, y] = F.toLocal(lngLat);
  return x >= -100 && x <= 26 && y >= -32 && y <= 30;
}

// Existing conditions from OpenStreetMap (npm run osm -- creston-skatepark).
export const OSM = () => import("./osm-creston-skatepark.json");

export const LEGEND = [
  { swatch: "existing", label: "Courts, pool and paths (OSM)" },
  { swatch: "parking", label: "Skate area", style: { background: "rgba(148, 163, 184, 0.32)", boxShadow: "inset 0 0 0 1.5px #475569" } },
  { swatch: "proposed", label: "Roof" },
  { swatch: "parking", label: "Bowl", style: { background: "rgba(71, 85, 105, 0.45)" } },
  { swatch: "turn", label: "Entry plaza", style: { background: "rgba(234, 179, 8, 0.22)", boxShadow: "none" } },
  { swatch: "ramp", label: "Skate element (position approximate)", style: { background: "#fff", boxShadow: "inset 0 0 0 1.5px var(--ink)" } },
  { swatch: "comment", label: "Resident comment (sample)" },
  { swatch: "feature", label: "Feature you can inspect" },
];

// Project-specific words the shared screens use.
export const COPY = {
  mapLabel: "Map of Creston Park, Portland",
  alt: "Option",
  altShort: "Option",
  alts: "concepts",
  round: "round 3",
  agencyShort: "PP&R",
  raisedYear: "2023",
  placeShort: "Creston Park",
  tourIntro: "The map moves for you: the site before construction, why Creston, the chosen design, the other concept, and what people said. About two minutes.",
  themesSource: "Themes summarise what PP&R reported learning in December 2023; the responses describe what the final design shows.",
  builtNote: "Construction began in January 2026.",
  exploreTitle: "Creston Park before construction",
  exploreLead: "Start with what was there: the old courts, the pool and the paths, as mapped before work began in January 2026.",
  featuresLabel: "Features around the Creston skatepark site",
  drawingNote: "The concepts are drawn from PP&R's published square footage. PP&R's drawings are marked “not to scale”, so element positions are approximate.",
  compareLead: "Drag the handle across the same site, before construction and as PP&R drew it. Nothing else on the map changes.",
  compareNote: (alt) => `The left side comes from OpenStreetMap, as mapped before construction. ${alt} is drawn from PP&R's published square footage; element positions are approximate.`,
  decisionDoc: "project page",
  matrixBasis: "published figures and survey results",
  altsLead: "Same site, same camera. Switching concepts only changes what's drawn on the map.",
  altsChosenNote: "PP&R built the final design on Option D in 2024; Option E stays here so you can see what was traded.",
  revisionNote: "Both versions are drawn from PP&R's published square footage; element positions are approximate.",
  timelineLinks: {
    "Round 1 opened": { to: "../evidence", label: "Why Creston", icon: "compass" },
    "Round 3 opened": { to: "../alternatives", label: "The 2 concepts", icon: "layers" },
    "Final round": { to: "../revision", label: "How Option D was refined", icon: "swap" },
    "Final concept published": { to: "../decision", label: "Decision summary", icon: "doc" },
    "Construction began": { to: "../explore", label: "The site before construction", icon: "map" },
  },
  replayContext: "when people rated PP&R's two revised concepts. The map shows the site as mapped before construction.",
  describePlaceholder: "e.g. the corner of the old courts closest to the pool",
  commentPlaceholder: "e.g. The courts flood after rain. A roof is great, but where will the water go?",
  pickMapLabel: "Map of the Creston Park skatepark site.",
  wholeThing: "the park",
  illustrativeLabel: "Concept drawing · from PP&R's published square footage",
  stages: ["Site selection", "Concepts A–C", "Round 3 feedback", "Final concept", "Construction", "Open"],
  replayStage: "Round 3 feedback",
  replayStep: "Round 3 opened",
  textSources: "Facts about the site come from OpenStreetMap, as mapped before construction. The concepts, decision, timeline and survey results come from PP&R's published documents, listed under Sources. The concept drawings use PP&R's published square footage; element positions are approximate.",
  textToday: "The skatepark replaces the old tennis courts in Creston Park, east of Creston Pool and south of SE Powell Blvd. The community had turned the courts into Creston DIY, a hand-built skate spot, until construction began in January 2026.",
  describeExample: "the corner of the old courts closest to the pool",
  idExample: "K-01 for the old tennis courts",
  results: null,
  todayRow: () => ({
    rating: "Not rated: the DIY spot was community-built",
    size: "Old courts, about 35 × 35 m inside the fence (OSM, estimate)",
    cover: "No roof",
    features: "Community-built street features on the court surface (PP&R)",
  }),
  // Overview "what PP&R chose": each change → icon and the map feature kinds it describes.
  changeRules: [
    [/roof/i, "sparkle", ["cover"]],
    [/bowl/i, "layers", ["bowl"]],
    [/plaza|seating/i, "users", ["plaza"]],
    [/sq ft skatepark/i, "grid", ["skate-area"]],
    [/elements/i, "list", ["skate-element"]],
  ],
  stepLinks: { today: ["explore", "See the site before construction"], problem: ["inspect/K-01", "Inspect the old courts"], proposal: ["explore?show=D", "Open Option D"], compare: ["compare", "Compare the concepts"], feedback: ["feedback", "Try the round 3 feedback flow"] },
  kindLabels: { park: "Park feature", path: "Path" },
  evidence: {
    lede: "PP&R's choice rests on what people rated highest, and on what the first survey asked for most: a roof and lights. Here is how each applies at Creston, and where this page's knowledge stops.",
    sections: [
      { id: "favorite", label: "The favorite", ev: 0, matrix: ["rating", "cover"] },
      { id: "roof", label: "Roof and lights", ev: 1, facts: [{ label: "Rainy or snowy days a year", value: "~140" }, { label: "Final skatepark", value: "15,600 sq ft" }, { label: "Under the roof", value: "10,700 sq ft" }] },
      { id: "site", label: "Why Creston", ev: 2, facts: [{ label: "Households beyond 2 mi of a skatepark", value: "65%" }, { label: "First survey responses", value: "669" }, { label: "Responses, all three surveys", value: "1,250+" }] },
    ],
    placeLabel: "This site",
    placeLead: "What OpenStreetMap records around the old Creston courts, as mapped before construction, and what this demo doesn't have.",
    known: [
      "The old tennis courts, fenced, about 35 × 35 m",
      "A community-built skate spot, Creston DIY, on the court surface",
      "Creston Pool directly to the west",
      "Stairs from the lower park up toward the school",
      "SE Powell Blvd along the north edge of the park",
    ],
    unknown: [
      "A dimensioned site plan: PP&R's drawings are marked “not to scale”",
      "Results of the final feedback round, January–February 2024",
      "Round 2's survey counts and preferences between A, B and C",
      "The final project cost",
      "Roof drainage and lighting details",
    ],
    noEstimate: "areas or ratings",
    sources: [
      { k: "Project", src: "decision", text: "Sites, themes, timeline and the final design's size." },
      { k: "Survey", src: "engagement", text: "Round 3 ratings of D and E, and what PP&R learned." },
      { k: "Drawings", src: "final", text: "Final concept. Concept D and E suites list each option's area and elements." },
      { k: "Sizes", text: "Footprints use PP&R's published square footage; positions within them are approximate." },
    ],
    osmCovers: "Courts, pool, paths, stairs, crossings and bus stops.",
  },
  glossary: [
    { term: "Covered skatepark", def: "A skatepark under a roof, so it stays skateable in rain. Creston's is the first in Portland's park system." },
    { term: "Street and transition", def: "Street features copy things found in a city, like ledges, rails and stairs. Transition means curved walls, like bowls and quarter pipes. A hybrid park mixes both." },
    { term: "Bowl and mini ramp", def: "A bowl is a sunken, curved-walled area. A mini ramp bowl has lower walls, good for learning transition." },
    { term: "Pool coping", def: "A rounded edge along the top of a bowl or ramp, like a backyard swimming pool's." },
    { term: "Ledge and manual pad", def: "A ledge is a raised edge to grind or slide along. A manual pad is a low platform for balancing on two wheels." },
    { term: "Euro gap", def: "A gap to jump, with a bank or ramp leading up to a drop on the other side." },
    { term: "Volcano", def: "A cone-shaped bump with a flat or rounded top to ride over." },
    { term: "DIY spot", def: "A skate spot people build themselves, without permission or official design. Creston DIY grew up on the old tennis courts." },
  ],
};
