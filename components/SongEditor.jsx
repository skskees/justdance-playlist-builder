"use client";

import { useState } from "react";

// Plain text fields, in display order. Any field not listed here is preserved
// untouched because edits are merged into the song, never rebuilt from scratch.
const TEXT_FIELDS = [
  { key: "title", label: "Title" },
  { key: "artist", label: "Artist" },
  { key: "game", label: "Game" },
  { key: "year", label: "Year" },
  { key: "mode", label: "Mode" },
  { key: "difficulty", label: "Difficulty" },
  { key: "effort", label: "Effort" },
  { key: "youtubeId", label: "YouTube ID" },
  { key: "thumbnail", label: "Thumbnail URL" },
  { key: "iconUrl", label: "Icon URL" },
  { key: "titleWikiUrl", label: "Wiki URL" },
];

// Editor for a single song. The parent remounts this via `key={selectedIndex}`
// whenever the selection changes, so the local `genresText` always starts from
// the newly-selected song. `onChange(patch)` merges fields into that song.
export default function SongEditor({
  song,
  isDuplicateId,
  onChange,
  onDuplicate,
  onDelete,
}) {
  const [genresText, setGenresText] = useState((song.genres || []).join(", "));

  function updateNumber(key, raw) {
    onChange({ [key]: raw === "" ? undefined : Number(raw) });
  }

  function updateGenres(text) {
    setGenresText(text);
    const genres = text
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);
    onChange({ genres });
  }

  return (
    <>
      <div className="admin-editor-head">
        <h2>{song.title || "(untitled)"}</h2>
        <div className="admin-editor-head-actions">
          <button className="admin-secondary" onClick={onDuplicate}>
            Duplicate
          </button>
          <button className="admin-danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <label className="admin-field">
        <span>ID</span>
        <input value={song.id} onChange={(e) => onChange({ id: e.target.value })} />
        {isDuplicateId && (
          <span className="admin-field-warn">
            This id is used by another song — make it unique.
          </span>
        )}
      </label>

      {TEXT_FIELDS.map(({ key, label }) => (
        <label className="admin-field" key={key}>
          <span>{label}</span>
          <input
            value={song[key] ?? ""}
            onChange={(e) => onChange({ [key]: e.target.value })}
          />
        </label>
      ))}

      <label className="admin-field">
        <span>Genres (comma-separated)</span>
        <input value={genresText} onChange={(e) => updateGenres(e.target.value)} />
      </label>

      <div className="admin-field-row">
        <label className="admin-field">
          <span>Preview start (s)</span>
          <input
            type="number"
            value={song.previewStart ?? ""}
            onChange={(e) => updateNumber("previewStart", e.target.value)}
          />
        </label>
        <label className="admin-field">
          <span>Preview end (s)</span>
          <input
            type="number"
            value={song.previewEnd ?? ""}
            onChange={(e) => updateNumber("previewEnd", e.target.value)}
          />
        </label>
      </div>

      {song.thumbnail && (
        <img className="admin-preview-img" src={song.thumbnail} alt="" />
      )}
    </>
  );
}
