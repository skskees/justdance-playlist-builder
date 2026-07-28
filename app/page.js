import songs from "../data/songs.json";
import collections from "../data/collections.json";
import HomeClient from "../components/HomeClient";

// Grouping into rows now lives in lib/views.js (the view registry) and runs
// client-side, so the server page just hands the raw data to HomeClient.
export default function Home() {
  return <HomeClient allSongs={songs} collections={collections} />;
}
