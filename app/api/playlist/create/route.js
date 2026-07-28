import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";

// POST body: { title: string, description?: string, videoIds: string[] }
export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // The token refresh failed (e.g. expired/revoked refresh token). Tell the
  // user to re-authenticate rather than sending a dead token to YouTube.
  if (session.error) {
    return Response.json(
      { error: "Your Google session expired. Please sign out and sign in again." },
      { status: 401 }
    );
  }

  const { title, description, videoIds } = await request.json();

  if (!title || !Array.isArray(videoIds) || videoIds.length === 0) {
    return Response.json(
      { error: "title and a non-empty videoIds array are required" },
      { status: 400 }
    );
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  try {
    // 1. Create the playlist itself
    const playlistRes = await youtube.playlists.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description: description || "Built with Just Dance Playlist Builder",
        },
        status: { privacyStatus: "unlisted" },
      },
    });

    const playlistId = playlistRes.data.id;

    // 2. Add each video. YouTube API only allows one insert per call, and
    // has a per-call quota cost of 50 units, so for long playlists this can
    // add up against your daily quota (10,000 units/day default) — worth
    // showing the user a progress indicator for big playlists.
    const results = [];
    for (const videoId of videoIds) {
      try {
        await youtube.playlistItems.insert({
          part: ["snippet"],
          requestBody: {
            snippet: {
              playlistId,
              resourceId: { kind: "youtube#video", videoId },
            },
          },
        });
        results.push({ videoId, status: "added" });
      } catch (err) {
        results.push({ videoId, status: "failed", error: err.message });
      }
    }

    return Response.json({
      playlistId,
      playlistUrl: `https://www.youtube.com/playlist?list=${playlistId}`,
      results,
    });
  } catch (err) {
    console.error(err);
    // A 401 here means YouTube rejected the token — surface a re-auth hint.
    if (err?.code === 401 || err?.status === 401) {
      return Response.json(
        { error: "Your Google session expired. Please sign out and sign in again." },
        { status: 401 }
      );
    }
    return Response.json({ error: err.message }, { status: 500 });
  }
}
