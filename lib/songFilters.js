// Shared filtering + sorting logic used by both the public homepage and the
// admin panel, so the two stay consistent.
//
// The catalog's "difficulty" and "effort" fields are messy — many entries are
// composite strings like "Medium (JD1) | Easy (later releases)". Rather than
// enumerate every variant, we filter these by a canonical bucket using a
// substring match, and sort by the first canonical word found.

export const DIFFICULTY_BUCKETS = ["Easy", "Medium", "Hard", "Extreme"];
export const EFFORT_BUCKETS = ["Chill", "Moderate", "Intense"];

// Sentinel filter value meaning "songs with no recorded value for this field".
export const NO_VALUE = "__none__";

// Values that mean a field wasn't actually filled in.
const PLACEHOLDERS = new Set(["", "n/a", "na", "tbd", "tba", "?", "unknown", "none"]);

// True when a scalar field holds a real, recorded value.
function isRecorded(value) {
  if (value == null) return false;
  return !PLACEHOLDERS.has(String(value).trim().toLowerCase());
}

// True when a song has at least one real genre.
function hasGenres(song) {
  return Array.isArray(song.genres) && song.genres.some((g) => isRecorded(g));
}

const DIFFICULTY_RANK = { easy: 1, medium: 2, hard: 3, extreme: 4 };
const EFFORT_RANK = { chill: 1, moderate: 2, intense: 3 };

function rankFrom(value, rankMap) {
  const lower = (value || "").toLowerCase();
  for (const [word, rank] of Object.entries(rankMap)) {
    if (lower.includes(word)) return rank;
  }
  return 99; // unknown / TBD / N/A sort last
}

// Build the list of distinct values for a dropdown from the catalog.
export function distinctValues(songs, key) {
  const set = new Set();
  for (const s of songs) {
    const v = s[key];
    if (v) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function distinctGenres(songs) {
  const set = new Set();
  for (const s of songs) {
    for (const g of s.genres || []) set.add(g);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "title-asc", label: "Title (A–Z)" },
  { value: "title-desc", label: "Title (Z–A)" },
  { value: "artist-asc", label: "Artist (A–Z)" },
  { value: "year-desc", label: "Year (newest)" },
  { value: "year-asc", label: "Year (oldest)" },
  { value: "difficulty-asc", label: "Difficulty (easy→hard)" },
  { value: "difficulty-desc", label: "Difficulty (hard→easy)" },
  { value: "game-asc", label: "Game (A–Z)" },
];

export function filterSongs(songs, filters = {}) {
  const { q, genre, game, mode, difficulty, effort } = filters;
  const query = (q || "").trim().toLowerCase();

  return songs.filter((s) => {
    if (query) {
      const hit =
        s.title?.toLowerCase().includes(query) ||
        s.artist?.toLowerCase().includes(query) ||
        s.id?.toLowerCase().includes(query) ||
        s.genres?.some((g) => g.toLowerCase().includes(query));
      if (!hit) return false;
    }
    if (genre) {
      if (genre === NO_VALUE) {
        if (hasGenres(s)) return false;
      } else if (!s.genres?.includes(genre)) return false;
    }
    if (game) {
      if (game === NO_VALUE) {
        if (isRecorded(s.game)) return false;
      } else if (s.game !== game) return false;
    }
    if (mode) {
      if (mode === NO_VALUE) {
        if (isRecorded(s.mode)) return false;
      } else if (s.mode !== mode) return false;
    }
    if (difficulty) {
      if (difficulty === NO_VALUE) {
        if (isRecorded(s.difficulty)) return false;
      } else if (!(s.difficulty || "").toLowerCase().includes(difficulty.toLowerCase())) {
        return false;
      }
    }
    if (effort) {
      if (effort === NO_VALUE) {
        if (isRecorded(s.effort)) return false;
      } else if (!(s.effort || "").toLowerCase().includes(effort.toLowerCase())) {
        return false;
      }
    }
    return true;
  });
}

export function sortSongs(songs, sort) {
  if (!sort) return songs;
  const list = [...songs];
  const cmp = {
    "title-asc": (a, b) => (a.title || "").localeCompare(b.title || ""),
    "title-desc": (a, b) => (b.title || "").localeCompare(a.title || ""),
    "artist-asc": (a, b) => (a.artist || "").localeCompare(b.artist || ""),
    "year-asc": (a, b) => (Number(a.year) || 0) - (Number(b.year) || 0),
    "year-desc": (a, b) => (Number(b.year) || 0) - (Number(a.year) || 0),
    "difficulty-asc": (a, b) =>
      rankFrom(a.difficulty, DIFFICULTY_RANK) - rankFrom(b.difficulty, DIFFICULTY_RANK),
    "difficulty-desc": (a, b) =>
      rankFrom(b.difficulty, DIFFICULTY_RANK) - rankFrom(a.difficulty, DIFFICULTY_RANK),
    "game-asc": (a, b) => (a.game || "").localeCompare(b.game || ""),
  }[sort];

  return cmp ? list.sort(cmp) : list;
}

export function hasActiveFilters(filters = {}) {
  return Boolean(
    (filters.q && filters.q.trim()) ||
      filters.genre ||
      filters.game ||
      filters.mode ||
      filters.difficulty ||
      filters.effort
  );
}
