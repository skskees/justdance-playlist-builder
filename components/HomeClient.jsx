"use client";

import { useState, useMemo } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import SongRow from "./SongRow";
import SongCard from "./SongCard";
import SongFilters from "./SongFilters";
import PlaylistTray from "./PlaylistTray";
import { filterSongs, sortSongs, hasActiveFilters } from "../lib/songFilters";
import { VIEWS } from "../lib/views";

const EMPTY_FILTERS = {
  q: "",
  genre: "",
  game: "",
  mode: "",
  difficulty: "",
  effort: "",
};

export default function HomeClient({ allSongs, collections }) {
  const { data: session } = useSession();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState("");
  const [viewId, setViewId] = useState(VIEWS[0].id);
  const [playlist, setPlaylist] = useState([]); // array of song objects

  const active = hasActiveFilters(filters) || Boolean(sort);

  const results = useMemo(() => {
    if (!active) return null;
    return sortSongs(filterSongs(allSongs, filters), sort);
  }, [active, allSongs, filters, sort]);

  // Rows for the currently-selected view (only built when not searching).
  const view = VIEWS.find((v) => v.id === viewId) || VIEWS[0];
  const rows = useMemo(
    () => (active ? [] : view.build(allSongs, { collections })),
    [active, view, allSongs, collections]
  );
  const viewHasSongs = rows.some((r) => r.songs.length > 0);

  function updateFilters(patch) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setSort("");
  }

  function addToPlaylist(song) {
    setPlaylist((prev) =>
      prev.some((s) => s.id === song.id) ? prev : [...prev, song]
    );
  }

  function removeFromPlaylist(songId) {
    setPlaylist((prev) => prev.filter((s) => s.id !== songId));
  }

  return (
    <main className="home">
      <header className="topbar">
        <h1>The Dance Playlist Builder</h1>
        <input
          className="search"
          placeholder="Search by title, artist, genre..."
          value={filters.q}
          onChange={(e) => updateFilters({ q: e.target.value })}
        />
        <div className="auth">
          {session ? (
            <>
              <span>{session.user?.name}</span>
              {session.user?.isAdmin && <a href="/admin" className="admin-link">Admin</a>}
              <button onClick={() => signOut()}>Sign out</button>
            </>
          ) : (
            <button onClick={() => signIn("google")}>Sign in with Google</button>
          )}
        </div>
      </header>

      <nav className="view-tabs">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            className={v.id === viewId ? "active" : ""}
            onClick={() => setViewId(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>

      <SongFilters
        allSongs={allSongs}
        filters={filters}
        sort={sort}
        onChange={updateFilters}
        onSort={setSort}
        onReset={resetFilters}
        showReset={active}
      />

      {results ? (
        <section className="row">
          <h2 className="row-title">
            {results.length} {results.length === 1 ? "song" : "songs"}
          </h2>
          {results.length === 0 ? (
            <p className="filters-empty">No songs match those filters.</p>
          ) : (
            <div className="song-grid">
              {results.map((song, i) => (
                <SongCard key={`${song.id}-${i}`} song={song} onAdd={addToPlaylist} />
              ))}
            </div>
          )}
        </section>
      ) : !viewHasSongs ? (
        <p className="filters-empty">
          This view has no songs yet.
          {view.id === "playlists" &&
            " Add songs to a playlist in the admin panel."}
        </p>
      ) : (
        rows.map((row, i) => (
          <SongRow
            key={`${row.title}-${i}`}
            title={row.title}
            songs={row.songs}
            onAdd={addToPlaylist}
          />
        ))
      )}

      <PlaylistTray
        playlist={playlist}
        onRemove={removeFromPlaylist}
        onClear={() => setPlaylist([])}
        isSignedIn={!!session}
      />
    </main>
  );
}
