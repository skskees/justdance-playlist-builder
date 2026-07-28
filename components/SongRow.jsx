"use client";

import SongCard from "./SongCard";

export default function SongRow({ title, songs, onAdd }) {
  if (!songs?.length) return null;

  return (
    <section className="row">
      <div className="row-header">
        <h2 className="row-title">{title}</h2>
        <button
          className="row-add-all"
          onClick={() => songs.forEach((song) => onAdd(song))}
        >
          + Add all to playlist
        </button>
      </div>
      <div className="row-scroll">
        {songs.map((song, i) => (
          <SongCard key={`${song.id}-${i}`} song={song} onAdd={onAdd} />
        ))}
      </div>
    </section>
  );
}
