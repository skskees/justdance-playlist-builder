# The Dance Playlist Builder

Browse Just Dance's song catalog Netflix-style, hover to preview, and build a
real playlist on your own YouTube account.

## Stack
- **Next.js** (App Router) — one app for both UI and server-side OAuth/API routes
- **NextAuth** — Google OAuth login, requesting the `youtube` scope
- **googleapis** — server-side calls to YouTube Data API v3 to create the playlist
- **Fuse.js** — fuzzy search over the local song catalog
- Plain JSON file (`data/songs.json`) as the "database" — no server DB needed
  for a catalog this size (a few thousand songs at most)

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` from your Google Cloud OAuth client
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `ADMIN_EMAILS` — comma-separated emails allowed into `/admin`
3. `npm run dev` → http://localhost:3000

You won't be able to fully test playlist creation until:
- Your Google Cloud OAuth consent screen is set up with the `youtube` scope
- Your own Google account is added as a **test user** (Testing mode allows this
  without going through Google's full verification review)

## Deploying to Vercel

The public site (browse + build a YouTube playlist) runs great on Vercel. Two
things to know first:

- **Google verification lead time.** The app requests the `youtube` scope, which
  Google treats as sensitive. To let the general public sign in you must publish
  the OAuth consent screen and go through Google's verification review — this can
  take days to weeks, so start it early. Until then you're in "Testing" mode
  (allow-listed test users only, consent re-prompts every 7 days).
- **The admin panel is local-only.** The `/admin` editor writes `songs.json` /
  `collections.json` to the filesystem, and Vercel's serverless filesystem is
  read-only. In production the save routes return a clear "editing is disabled"
  message. The workflow is: **edit data locally → commit the JSON → push →
  Vercel rebuilds and redeploys.**

### Steps

1. Push this repo to GitHub.
2. In [vercel.com](https://vercel.com), **Add New → Project** and import the repo.
   Vercel auto-detects Next.js — no build config needed.
3. Add these Environment Variables in the Vercel project settings:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` → your production URL, e.g. `https://your-app.vercel.app`
   - `ADMIN_EMAILS`
   - (`YOUTUBE_API_KEY` is only needed if you run the data scripts — not at runtime)
4. In the **Google Cloud Console → Credentials → your OAuth client**, add:
   - Authorized JavaScript origin: `https://your-app.vercel.app`
   - Authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
   (keep the `http://localhost:3000` entries for local dev)
5. Deploy, then test the full sign-in → create-playlist flow on the live URL.

## Building the song catalog

`data/songs.json` doesn't exist yet on purpose — see `data/songs.example.json`
for the shape. Recommended pipeline:

```
npm run scrape:wiki                        # -> data/raw-songs.json (title/artist/game)
node scripts/match-youtube-videos.js       # -> data/songs-review.json (candidate videos)
# manually review songs-review.json, pick the correct youtubeId per song
# add genres/tags/previewStart/previewEnd, save the result as data/songs.json
```

Important, honest caveats about this pipeline:
- **The wiki scraper's selectors are unverified** — I wrote it against the
  general shape of Fandom wiki tables, but I don't have live network access
  to confirm the current page structure. Run it, `console.log` a sample row,
  and adjust `SELECTORS` in `scripts/scrape-justdance-wiki.js` to match what
  you actually see when you inspect the page.
- **YouTube search won't always find the exact right video** — official
  channel uploads, alt routines (Kids/Mashup/Sweat/Extreme versions), and
  fan re-uploads all show up in search. The review step is there so you
  don't end up linking wrong or reported/removed videos into someone's
  actual playlist.
- **Genres aren't in the wiki data** — Just Dance doesn't publish a genre
  taxonomy consistently across games, so plan on tagging these yourself, or
  pulling genre from Spotify/MusicBrainz's public APIs by artist+title if
  you want to automate more of it later.
- Respect the wiki's terms of use for automated access and keep request
  rates low — the scraper already adds a 1s delay between page fetches.

## Project structure

```
app/
  page.js                    server component: loads songs.json, groups by genre
  layout.js                  wraps app in NextAuth SessionProvider
  api/auth/[...nextauth]/    NextAuth route
  api/playlist/create/       creates YouTube playlist + adds videos
  api/songs/search/          fuzzy search endpoint (used if you move search server-side)
components/
  HomeClient.jsx             top-level client UI: search, auth, rows, playlist tray
  SongRow.jsx                horizontal scrollable row
  SongCard.jsx                thumbnail -> hover -> live YouTube preview
  PlaylistTray.jsx           in-progress playlist + "Create on YouTube" button
data/
  songs.example.json         schema reference
scripts/
  scrape-justdance-wiki.js   step 1 of data pipeline
  match-youtube-videos.js    step 2 of data pipeline
lib/
  auth.js                    NextAuth config (Google provider, token refresh)
```

## Known things to improve next
- **YouTube API quota**: default is 10,000 units/day. Playlist creation costs
  50 units + 50 units per video added. A 20-song playlist costs ~1050 units —
  fine for personal use, but if you ever open this up to many users you'll
  want to request a quota increase from Google.
- **Preview autoplay policies**: some browsers block unmuted autoplay
  regardless — the iframe embed above is muted for this reason, which is
  also just generally less annoying for a page with several previews.
- **Playlist privacy**: currently created as "unlisted" — you can change
  `privacyStatus` in `app/api/playlist/create/route.js` to `"private"` or
  `"public"`.
- **Genre taxonomy**: decide up front on a fixed genre list (e.g. Pop, Hip-Hop,
  Latin, Rock, Electronic, K-Pop, Throwback) so your rows stay clean rather
  than having one-off genres with 1-2 songs each.
