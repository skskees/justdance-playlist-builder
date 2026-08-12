# The Dance Playlist Builder

Browse Just Dance's song catalog Netflix-style, hover to preview, and build a
real playlist on your own YouTube account.

## Site
[The Dance Playlist Builder](https://the-dance-playlist-builder.vercel.app/)

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
