"use client";

import { useEffect, useMemo, useState } from "react";
import SongList from "./SongList";
import SongEditor from "./SongEditor";
import { filterSongs, sortSongs, hasActiveFilters } from "../lib/songFilters";

const EMPTY_FILTERS = {
  q: "",
  genre: "",
  game: "",
  mode: "",
  difficulty: "",
  effort: "",
};

function blankSong() {
  return {
    id: "",
    game: "",
    title: "",
    titleWikiUrl: "",
    artist: "",
    year: "",
    mode: "Solo",
    difficulty: "",
    effort: "",
    iconUrl: "",
    genres: [],
    youtubeId: "",
    thumbnail: "",
    previewStart: 0,
    previewEnd: 15,
  };
}

export default function AdminClient({ onDirtyChange }) {
  const [songs, setSongs] = useState(null); // null = loading
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState("");
  // Selection is tracked by array index, not id: the catalog can contain
  // duplicate ids, so ids are not a safe identity for keys or selection.
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load the current catalog from the server (fresh from disk).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/songs")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSongs(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    function handler(e) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Report unsaved-changes state up so the shell can guard tab switches.
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const selected =
    songs && selectedIndex != null ? songs[selectedIndex] ?? null : null;

  const active = hasActiveFilters(filters) || Boolean(sort);

  // Filtered/sorted list, paired with each song's index in the master `songs`
  // array so the list can key + select by that stable, unique index.
  const filtered = useMemo(() => {
    if (!songs) return [];
    const indexBySong = new Map(songs.map((s, i) => [s, i]));
    const matched = sortSongs(filterSongs(songs, filters), sort);
    return matched.map((song) => ({ song, index: indexBySong.get(song) }));
  }, [songs, filters, sort]);

  // Ids that appear more than once — these block saving until made unique.
  const duplicateIds = useMemo(() => {
    if (!songs) return [];
    const counts = new Map();
    for (const s of songs) {
      if (s.id) counts.set(s.id, (counts.get(s.id) || 0) + 1);
    }
    return [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  }, [songs]);

  function updateFilters(patch) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setSort("");
  }

  function selectSong(index) {
    setSelectedIndex(index);
    setMessage("");
  }

  // Merge a patch into the currently-selected song.
  function updateSelected(patch) {
    setSongs((prev) =>
      prev.map((s, i) => (i === selectedIndex ? { ...s, ...patch } : s))
    );
    setDirty(true);
  }

  function addSong() {
    const fresh = blankSong();
    // Use a distinct placeholder id so the new row is easy to find and rename.
    fresh.id = `new-song-${songs.length + 1}`;
    setSongs((prev) => [fresh, ...prev]);
    setSelectedIndex(0);
    resetFilters();
    setDirty(true);
    setMessage("");
  }

  // Copy an existing song as a starting point for a variant (e.g. an "Extreme"
  // version). Deep-clones every field, assigns a unique id, and inserts the
  // copy right after the original so it's easy to find and edit.
  function duplicateSong(index) {
    const original = songs[index];
    const existingIds = new Set(songs.map((s) => s.id));
    let newId = `${original.id}-copy`;
    for (let n = 2; existingIds.has(newId); n++) {
      newId = `${original.id}-copy-${n}`;
    }
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = newId;

    setSongs((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setSelectedIndex(index + 1);
    resetFilters();
    setDirty(true);
    setMessage(`Copied to "${newId}" — edit the details and save.`);
  }

  function deleteSong(index) {
    const song = songs[index];
    if (!window.confirm(`Delete "${song?.title || song?.id}"? This can't be undone once saved.`)) {
      return;
    }
    setSongs((prev) => prev.filter((_, i) => i !== index));
    // Keep selection consistent after removal.
    setSelectedIndex((cur) => {
      if (cur == null) return cur;
      if (cur === index) return null;
      return cur > index ? cur - 1 : cur;
    });
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/songs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(songs),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Save failed (${res.status})`);
      }
      setDirty(false);
      setMessage(`Saved ${data.count} songs.`);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return <p className="admin-error">Could not load songs: {loadError}</p>;
  }

  if (!songs) {
    return <p>Loading catalog…</p>;
  }

  return (
    <>
      <div className="admin-actions collections-actions">
        <span className="admin-hint">{songs.length} songs</span>
        {dirty && <span className="admin-dirty">● Unsaved changes</span>}
        {message && (
          <span className={message.startsWith("Error") ? "admin-error" : "admin-ok"}>
            {message}
          </span>
        )}
        <button onClick={save} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {duplicateIds.length > 0 && (
        <p className="admin-warn">
          ⚠ Duplicate id{duplicateIds.length > 1 ? "s" : ""}:{" "}
          {duplicateIds.join(", ")}. Each song needs a unique id — rename these
          before saving.
        </p>
      )}

      <div className="admin-body">
        <SongList
          allSongs={songs}
          filtered={filtered}
          filters={filters}
          sort={sort}
          active={active}
          selectedIndex={selectedIndex}
          onFiltersChange={updateFilters}
          onSort={setSort}
          onReset={resetFilters}
          onSelect={selectSong}
          onAdd={addSong}
        />

        <section className="admin-editor">
          {!selected ? (
            <p className="admin-hint">Select a song to edit, or add a new one.</p>
          ) : (
            <SongEditor
              key={selectedIndex}
              song={selected}
              isDuplicateId={duplicateIds.includes(selected.id)}
              onChange={updateSelected}
              onDuplicate={() => duplicateSong(selectedIndex)}
              onDelete={() => deleteSong(selectedIndex)}
            />
          )}
        </section>
      </div>
    </>
  );
}
