"use client";

import { useState } from "react";

export default function PlaylistTray({ playlist, onRemove, onClear, isSignedIn }) {
  const [name, setName] = useState("My Just Dance Playlist");
  const [status, setStatus] = useState(null); // { loading, error, url }

  if (playlist.length === 0) return null;

  // Empty the tray AND reset creation status, so the user can immediately
  // build and create a fresh playlist (available before or after creating).
  function handleClear() {
    onClear();
    setStatus(null);
  }

  async function createPlaylist() {
    setStatus({ loading: true });
    try {
      const res = await fetch("/api/playlist/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: name,
          videoIds: playlist.map((s) => s.youtubeId),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create playlist");
      setStatus({ loading: false, url: data.playlistUrl });
    } catch (err) {
      setStatus({ loading: false, error: err.message });
    }
  }

  return (
    <div className="tray">
      <div className="tray-list">
        {playlist.map((song) => (
          <span key={song.id} className="tray-item">
            {song.title}
            <button onClick={() => onRemove(song.id)}>x</button>
          </span>
        ))}
      </div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button
        disabled={!isSignedIn || status?.loading}
        onClick={createPlaylist}
        title={!isSignedIn ? "Sign in with Google first" : ""}
      >
        {status?.loading ? "Creating..." : `Create playlist (${playlist.length})`}
      </button>
      {/* Clear is available any time there are songs — before creating, and
          after (so the user can start a fresh playlist). Disabled mid-create. */}
      <button
        className="tray-clear"
        onClick={handleClear}
        disabled={status?.loading}
      >
        Clear playlist
      </button>
      {status?.url && (
        <a href={status.url} target="_blank" rel="noreferrer">
          Open on YouTube
        </a>
      )}
      {status?.error && <span className="error">{status.error}</span>}
    </div>
  );
}
