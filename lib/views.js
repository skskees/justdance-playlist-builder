// Homepage "views" — each view turns the full song catalog into an ordered
// list of Netflix-style rows: [{ title, songs }].
//
// To ADD a new view: write a `build(songs, ctx)` function that returns rows,
// then add one entry to the VIEWS array at the bottom. To REMOVE a view, delete
// its entry. `ctx` carries extra data some views need (currently `collections`).

// Curated playlists from data/collections.json. Each collection lists song ids
// in the order they should appear; unknown ids are skipped.
export function buildCollectionRows(songs, collections) {
  const byId = new Map();
  for (const s of songs) {
    if (!byId.has(s.id)) byId.set(s.id, s);
  }
  return (collections || []).map((c) => ({
    title: c.name,
    songs: (c.songIds || []).map((id) => byId.get(id)).filter(Boolean),
  }));
}

// One row per artist, most-prolific artists first.
export function buildArtistRows(songs) {
  const groups = new Map();
  for (const s of songs) {
    const key = s.artist || "Unknown Artist";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  return [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([title, rowSongs]) => ({ title, songs: rowSongs }));
}

// One row per genre (a song appears in every genre it lists). Songs with no
// genre land in a trailing "Uncategorized" row so nothing is hidden.
export function buildGenreRows(songs) {
  const groups = new Map();
  const uncategorized = [];
  for (const s of songs) {
    const genres = s.genres || [];
    if (genres.length === 0) {
      uncategorized.push(s);
      continue;
    }
    for (const g of genres) {
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(s);
    }
  }
  const rows = [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([title, rowSongs]) => ({ title, songs: rowSongs }));
  if (uncategorized.length) rows.push({ title: "Uncategorized", songs: uncategorized });
  return rows;
}

export const VIEWS = [
  {
    id: "playlists",
    label: "Playlists",
    build: (songs, ctx) => buildCollectionRows(songs, ctx?.collections),
  },
  {
    id: "artist",
    label: "By Artist",
    build: (songs) => buildArtistRows(songs),
  },
  {
    id: "genre",
    label: "By Genre",
    build: (songs) => buildGenreRows(songs),
  },
];
