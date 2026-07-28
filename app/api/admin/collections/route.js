import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { isAdmin } from "../../../../lib/admin";

// Reads/writes data/collections.json (the curated homepage playlists). Same
// filesystem-persistence caveats as the songs route apply.
const COLLECTIONS_PATH = path.join(process.cwd(), "data", "collections.json");

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return isAdmin(session?.user?.email) ? session : null;
}

function validateCollections(collections) {
  if (!Array.isArray(collections)) return "Payload must be an array of playlists.";

  const ids = new Set();
  for (let i = 0; i < collections.length; i++) {
    const c = collections[i];
    const where = `Playlist #${i + 1}`;
    if (typeof c !== "object" || c === null) return `${where} is not an object.`;
    if (!c.id || typeof c.id !== "string") return `${where} is missing a string "id".`;
    if (ids.has(c.id)) return `${where} has a duplicate id "${c.id}".`;
    ids.add(c.id);
    if (!c.name || typeof c.name !== "string") return `${where} ("${c.id}") is missing a "name".`;
    if (!Array.isArray(c.songIds)) return `${where} ("${c.id}") has "songIds" that is not an array.`;
    if (c.songIds.some((x) => typeof x !== "string")) {
      return `${where} ("${c.id}") has a non-string song id.`;
    }
  }
  return null;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await fs.readFile(COLLECTIONS_PATH, "utf8");
  return new Response(raw, { headers: { "Content-Type": "application/json" } });
}

export async function PUT(request) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // On Vercel (and other serverless hosts) the filesystem is read-only, so a
  // write here would silently vanish. Editing is a local-authoring workflow:
  // edit locally, commit the JSON, push, and let the host rebuild.
  if (process.env.VERCEL) {
    return Response.json(
      {
        error:
          "Editing is disabled in production. Edit data locally, commit data/collections.json, and push to redeploy.",
      },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const error = validateCollections(body);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  const tmpPath = `${COLLECTIONS_PATH}.tmp`;
  const serialized = JSON.stringify(body, null, 2) + "\n";
  try {
    await fs.writeFile(tmpPath, serialized, "utf8");
    await fs.rename(tmpPath, COLLECTIONS_PATH);
  } catch (err) {
    console.error("Failed to write collections.json", err);
    return Response.json({ error: "Failed to write file." }, { status: 500 });
  }

  return Response.json({ ok: true, count: body.length });
}
