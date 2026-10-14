// Project text search. People type addresses ("SE Hawthorne Blvd"), plurals ("bus stops") and
// everyday words ("crosswalk"), so both sides are normalised before matching: filler
// words are dropped, simple plurals are stemmed, and each query word may be a prefix.

const FILLER = new Set([
  "n", "s", "e", "w", "ne", "nw", "se", "sw", "north", "south", "east", "west",
  "st", "street", "ave", "av", "avenue", "blvd", "boulevard", "rd", "road", "dr", "drive", "pl", "place", "way", "ln", "lane",
  "and", "at", "of", "the", "in", "on", "near", "by",
  "portland", "or", "oregon", "pdx",
]);

const SYNONYMS = {
  crosswalk: "crossing", crosswalks: "crossing", intersection: "crossing",
  light: "signal", lights: "signal", playground: "park",
};

const stem = (w) => (w.length > 4 && w.endsWith("es") && !w.endsWith("ses") ? w.slice(0, -2)
  : w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);

const words = (text) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

export const queryWords = (q) => words(q || "").filter((w) => !FILLER.has(w)).map((w) => stem(SYNONYMS[w] || w));

export const matchesQuery = (p, q) => {
  const wanted = queryWords(q);
  if (!wanted.length) return true;
  const hay = words(`${p.title} ${p.area} ${p.topic} ${p.summary} ${p.status}`).map(stem);
  return wanted.every((w) => hay.some((h) => h.startsWith(w)));
};
