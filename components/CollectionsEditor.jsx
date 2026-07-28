"use client";

import { useEffect, useMemo, useState } from "react";

// Max catalog matches to show in the "add a song" search results.
const SEARCH_LIMIT = 25;

function slugify(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "playlist"
  );
}

export default function CollectionsEditor({ onDirtyChange }) {
  const [collections, setCollections] = useState(null); // null = loading
  const [songs, setSongs] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [addQuery, setAddQuery] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load both the playlists (to edit) and the catalog (to search + resolve ids).
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/admin/collections").then((r) => {
        if (!r.ok) throw new Error(`playlists (${r.status})`);
        return r.json();
      }),
      fetch("/api/admin/songs").then((r) => {
        if (!r.ok) throw new Error(`songs (${r.status})`);
        return r.json();
      }),
    ])
      .then(([cols, catalog]) => {
        if (cancelled) return;
        setCollections(cols);
        setSongs(catalog);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Fast id -> song lookup (first match wins if ids are duplicated).
  const songById = useMemo(() => {
    const map = new Map();
    for (const s of songs) if (!map.has(s.id)) map.set(s.id, s);
    return map;
  }, [songs]);

  const selected =
    collections && selectedIndex != null ? collections[selectedIndex] ?? null : null;

  // Catalog matches for the add-search, excluding songs already in the playlist.
  const searchResults = useMemo(() => {
    const q = addQuery.trim().toLowerCase();
    if (!q || !selected) return [];
    const inPlaylist = new Set(selected.songIds);
    const out = [];
    for (const s of songs) {
      if (inPlaylist.has(s.id)) continue;
      if (
        s.title?.toLowerCase().includes(q) ||
        s.artist?.toLowerCase().includes(q)
      ) {
        out.push(s);
        if (out.length >= SEARCH_LIMIT) break;
      }
    }
    return out;
  }, [addQuery, selected, songs]);

  function updateSelected(patch) {
    setCollections((prev) =>
      prev.map((c, i) => (i === selectedIndex ? { ...c, ...patch } : c))
    );
    setDirty(true);
  }

  function selectPlaylist(index) {
    setSelectedIndex(index);
    setAddQuery("");
    setMessage("");
  }

  function addPlaylist() {
    const fresh = { id: `playlist-${collections.length + 1}`, name: "New Playlist", songIds: [] };
    setCollections((prev) => [fresh, ...prev]);
    setSelectedIndex(0);
    setAddQuery("");
    setDirty(true);
    setMessage("");
  }

  function deletePlaylist(index) {
    const c = collections[index];
    if (!window.confirm(`Delete playlist "${c?.name}"? This can't be undone once saved.`)) {
      return;
    }
    setCollections((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex((cur) => {
      if (cur == null) return cur;
      if (cur === index) return null;
      return cur > index ? cur - 1 : cur;
    });
    setDirty(true);
  }

  // Reorder the playlists themselves — this order is what the homepage
  // "Playlists" view renders top-to-bottom.
  function movePlaylist(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= collections.length) return;
    setCollections((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSelectedIndex((cur) => {
      if (cur === index) return target;
      if (cur === target) return index;
      return cur;
    });
    setDirty(true);
  }

  function addSong(songId) {
    if (selected.songIds.includes(songId)) return;
    updateSelected({ songIds: [...selected.songIds, songId] });
  }

  function removeSong(pos) {
    updateSelected({ songIds: selected.songIds.filter((_, i) => i !== pos) });
  }

  function moveSong(pos, dir) {
    const target = pos + dir;
    if (target < 0 || target >= selected.songIds.length) return;
    const next = [...selected.songIds];
    [next[pos], next[target]] = [next[target], next[pos]];
    updateSelected({ songIds: next });
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/collections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collections),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Save failed (${res.status})`);
      setDirty(false);
      setMessage(`Saved ${data.count} playlists.`);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  // When a name changes, keep a matching slug id if the id still looks
  // auto-generated (untouched). This is best-effort convenience only.
  function renamePlaylist(name) {
    const patch = { name };
    if (!selected.id || selected.id === slugify(selected.name) || /^playlist-\d+$/.test(selected.id)) {
      patch.id = slugify(name);
    }
    updateSelected(patch);
  }

  if (loadError) {
    return <p className="admin-error">Could not load playlists: {loadError}</p>;
  }
  if (!collections) {
    return <p>Loading playlists…</p>;
  }

  return (
    <>
      <div className="admin-actions collections-actions">
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

      <div className="admin-body">
        <aside className="admin-list">
          <div className="admin-list-controls">
            <button onClick={addPlaylist}>+ New playlist</button>
          </div>
          <p className="admin-hint">{collections.length} playlists</p>
          <ul>
            {collections.map((c, index) => (
              <li
                key={index}
                className={`playlist-row${index === selectedIndex ? " active" : ""}`}
              >
                <span
                  className="playlist-item-main"
                  onClick={() => selectPlaylist(index)}
                >
                  <span className="admin-list-title">{c.name || "(unnamed)"}</span>
                  <span className="admin-list-artist">
                    {c.songIds.length} {c.songIds.length === 1 ? "song" : "songs"}
                  </span>
                </span>
                <span className="playlist-item-actions">
                  <button
                    onClick={() => movePlaylist(index, -1)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => movePlaylist(index, 1)}
                    disabled={index === collections.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </aside>

        <section className="admin-editor">
          {!selected ? (
            <p className="admin-hint">Select a playlist to edit, or create one.</p>
          ) : (
            <>
              <div className="admin-editor-head">
                <h2>{selected.name || "(unnamed)"}</h2>
                <button
                  className="admin-danger"
                  onClick={() => deletePlaylist(selectedIndex)}
                >
                  Delete
                </button>
              </div>

              <label className="admin-field">
                <span>Playlist name</span>
                <input
                  value={selected.name}
                  onChange={(e) => renamePlaylist(e.target.value)}
                />
              </label>

              <p className="admin-subhead">
                Songs in this playlist ({selected.songIds.length})
              </p>
              {selected.songIds.length === 0 ? (
                <p className="admin-hint">No songs yet — search below to add some.</p>
              ) : (
                <ol className="collection-songs">
                  {selected.songIds.map((id, pos) => {
                    const song = songById.get(id);
                    return (
                      <li key={`${id}-${pos}`}>
                        <span className="collection-song-info">
                          {song ? (
                            <>
                              {song.title}
                              <span className="admin-list-artist"> · {song.artist}</span>
                            </>
                          ) : (
                            <span className="admin-error">missing song: {id}</span>
                          )}
                        </span>
                        <span className="collection-song-actions">
                          <button onClick={() => moveSong(pos, -1)} disabled={pos === 0}>
                            ↑
                          </button>
                          <button
                            onClick={() => moveSong(pos, 1)}
                            disabled={pos === selected.songIds.length - 1}
                          >
                            ↓
                          </button>
                          <button className="admin-danger" onClick={() => removeSong(pos)}>
                            Remove
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}

              <label className="admin-field">
                <span>Add a song (search title or artist)</span>
                <input
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                  placeholder="Type to search the catalog…"
                />
              </label>
              {addQuery.trim() && (
                <ul className="collection-search-results">
                  {searchResults.length === 0 ? (
                    <li className="admin-hint">No matches (or already added).</li>
                  ) : (
                    searchResults.map((s, i) => (
                      <li key={`${s.id}-${i}`} onClick={() => addSong(s.id)}>
                        <span className="admin-list-title">{s.title}</span>
                        <span className="admin-list-artist">{s.artist}</span>
                        <span className="collection-add">+ Add</span>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
