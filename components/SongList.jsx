"use client";

import SongFilters from "./SongFilters";

// Left sidebar: search box, filter/sort controls, and the selectable list of
// songs. `filtered` is an array of { song, index } where `index` is the song's
// position in the master array — a stable, unique key/selection id even when
// two songs share the same `id`.
export default function SongList({
  allSongs,
  filtered,
  filters,
  sort,
  active,
  selectedIndex,
  onFiltersChange,
  onSort,
  onReset,
  onSelect,
  onAdd,
}) {
  return (
    <aside className="admin-list">
      <div className="admin-list-controls">
        <input
          className="admin-search"
          placeholder="Search by title, artist, id, genre…"
          value={filters.q}
          onChange={(e) => onFiltersChange({ q: e.target.value })}
        />
        <button onClick={onAdd}>+ New song</button>
      </div>

      <SongFilters
        allSongs={allSongs}
        filters={filters}
        sort={sort}
        onChange={onFiltersChange}
        onSort={onSort}
        onReset={onReset}
        showReset={active}
      />

      <p className="admin-hint">
        {active ? `${filtered.length} match` : `${allSongs.length} songs`}
      </p>

      <ul>
        {filtered.map(({ song, index }) => (
          <li
            key={index}
            className={index === selectedIndex ? "active" : ""}
            onClick={() => onSelect(index)}
          >
            <span className="admin-list-title">{song.title || "(untitled)"}</span>
            <span className="admin-list-artist">{song.artist}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
