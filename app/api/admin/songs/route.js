import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { isAdmin } from "../../../../lib/admin";

// This route reads and writes data/songs.json directly on the server's
// filesystem. That works when the app runs on a persistent server
// (`next dev` / `next start`). On read-only serverless hosts (e.g. Vercel)
// filesystem writes won't persist — you'd need to move the data to a DB or
// object store there.
const SONGS_PATH = path.join(process.cwd(), "data", "songs.json");

// Never run this route from a static/edge cache — it touches the filesystem
// and must reflect the latest data on every request.
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return isAdmin(session?.user?.email) ? session : null;
}

// Per-field rules checked on every song. `test` returns true when the value is
// acceptable. A null/absent value is allowed and skipped unless `required`.
const FIELD_RULES = [
  {
    key: "title",
    required: true,
    test: (v) => typeof v === "string" && v.length > 0,
    message: 'is missing a "title"',
  },
  {
    key: "genres",
    test: (v) => Array.isArray(v),
    message: 'has "genres" that is not an array',
  },
  {
    key: "previewStart",
    test: (v) => typeof v === "number",
    message: 'has non-numeric "previewStart"',
  },
  {
    key: "previewEnd",
    test: (v) => typeof v === "number",
    message: 'has non-numeric "previewEnd"',
  },
];

function validateSongs(songs) {
  if (!Array.isArray(songs)) return "Payload must be an array of songs.";

  const ids = new Set();
  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];
    const where = `Song #${i + 1}`;

    // Structural + identity checks (stateful, so kept inline).
    if (typeof s !== "object" || s === null) return `${where} is not an object.`;
    if (!s.id || typeof s.id !== "string") return `${where} is missing a string "id".`;
    if (ids.has(s.id)) return `${where} has a duplicate id "${s.id}".`;
    ids.add(s.id);

    // Per-field checks driven by the rule table above.
    for (const rule of FIELD_RULES) {
      const value = s[rule.key];
      if (value == null) {
        if (rule.required) return `${where} ("${s.id}") ${rule.message}.`;
        continue; // optional field, not present — fine
      }
      if (!rule.test(value)) return `${where} ("${s.id}") ${rule.message}.`;
    }
  }
  return null;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await fs.readFile(SONGS_PATH, "utf8");
  return new Response(raw, {
    headers: { "Content-Type": "application/json" },
  });
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
          "Editing is disabled in production. Edit data locally, commit data/songs.json, and push to redeploy.",
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

  const error = validateSongs(body);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  // Write to a temp file then rename so a crash mid-write can't leave a
  // truncated/corrupt songs.json.
  const tmpPath = `${SONGS_PATH}.tmp`;
  const serialized = JSON.stringify(body, null, 2) + "\n";
  try {
    await fs.writeFile(tmpPath, serialized, "utf8");
    await fs.rename(tmpPath, SONGS_PATH);
  } catch (err) {
    console.error("Failed to write songs.json", err);
    return Response.json({ error: "Failed to write file." }, { status: 500 });
  }

  return Response.json({ ok: true, count: body.length });
}
