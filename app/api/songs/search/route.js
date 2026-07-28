import Fuse from "fuse.js";
import songs from "../../../../data/songs.json";

const fuse = new Fuse(songs, {
  keys: ["title", "artist", "genres", "tags"],
  threshold: 0.35,
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const genre = searchParams.get("genre");

  let results = songs;

  if (q) {
    results = fuse.search(q).map((r) => r.item);
  }

  if (genre) {
    results = results.filter((s) => s.genres.includes(genre));
  }

  return Response.json(results);
}
