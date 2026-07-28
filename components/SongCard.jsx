"use client";

import { useState, useRef } from "react";

export default function SongCard({ song, onAdd }) {
  const [hovering, setHovering] = useState(false);
  const timeoutRef = useRef(null);

  function handleMouseEnter() {
    // small delay so rapid mouse-passes across a row don't spin up a bunch
    // of players you're about to immediately tear down
    timeoutRef.current = setTimeout(() => setHovering(true), 350);
  }

  function handleMouseLeave() {
    clearTimeout(timeoutRef.current);
    setHovering(false);
  }

  const previewStart = song.previewStart ?? 0;
  const previewEnd = song.previewEnd ?? previewStart + 15;

  return (
    <div
      className="card"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card-media">
        {hovering ? (
            <iframe
              title={song.title}
              src={`https://www.youtube.com/embed/${song.youtubeId}?autoplay=1&mute=0&start=${previewStart}&end=${previewEnd}&controls=0&modestbranding=1&rel=0`}
              allow="autoplay; encrypted-media"
              frameBorder="0"
            />
        ) : (
          <img src={song.thumbnail} alt={song.title} loading="lazy" />
        )}
      </div>
      <div className="card-info">
        <p className="card-title">{song.title}</p>
        <p className="card-artist">{song.artist}</p>
        <p className="card-game-version">{song.game}</p>
        <button className="card-add" onClick={() => onAdd(song)}>
          + Add to playlist
        </button>
      </div>
    </div>
  );
}
