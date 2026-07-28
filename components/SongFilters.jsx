"use client";

import {
  DIFFICULTY_BUCKETS,
  EFFORT_BUCKETS,
  SORT_OPTIONS,
  NO_VALUE,
  distinctGenres,
  distinctValues,
} from "../lib/songFilters";
import { useMemo } from "react";

// Renders the filter + sort dropdowns. `filters` is the current state object
// ({ genre, game, mode, difficulty, effort }), `sort` the current sort value.
// `onChange(patch)` updates filters; `onSort(value)` updates the sort.
export default function SongFilters({
  allSongs,
  filters,
  sort,
  onChange,
  onSort,
  onReset,
  showReset,
}) {
  const genres = useMemo(() => distinctGenres(allSongs), [allSongs]);
  const games = useMemo(() => distinctValues(allSongs, "game"), [allSongs]);
  const modes = useMemo(() => distinctValues(allSongs, "mode"), [allSongs]);

  return (
    <div className="filters">
      <select
        value={filters.genre || ""}
        onChange={(e) => onChange({ genre: e.target.value })}
      >
        <option value="">All genres</option>
        <option value={NO_VALUE}>(no genre)</option>
        {genres.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        value={filters.game || ""}
        onChange={(e) => onChange({ game: e.target.value })}
      >
        <option value="">All games</option>
        <option value={NO_VALUE}>(no game)</option>
        {games.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        value={filters.mode || ""}
        onChange={(e) => onChange({ mode: e.target.value })}
      >
        <option value="">All modes</option>
        <option value={NO_VALUE}>(no mode)</option>
        {modes.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        value={filters.difficulty || ""}
        onChange={(e) => onChange({ difficulty: e.target.value })}
      >
        <option value="">Any difficulty</option>
        <option value={NO_VALUE}>(no difficulty)</option>
        {DIFFICULTY_BUCKETS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={filters.effort || ""}
        onChange={(e) => onChange({ effort: e.target.value })}
      >
        <option value="">Any effort</option>
        <option value={NO_VALUE}>(no effort)</option>
        {EFFORT_BUCKETS.map((eff) => (
          <option key={eff} value={eff}>
            {eff}
          </option>
        ))}
      </select>

      <select value={sort || ""} onChange={(e) => onSort(e.target.value)}>
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {showReset && (
        <button type="button" className="filters-reset" onClick={onReset}>
          Clear
        </button>
      )}
    </div>
  );
}
