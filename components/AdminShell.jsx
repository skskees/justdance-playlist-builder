"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import AdminClient from "./AdminClient";
import CollectionsEditor from "./CollectionsEditor";

const TABS = [
  { id: "songs", label: "Songs" },
  { id: "playlists", label: "Playlists" },
];

export default function AdminShell({ adminName }) {
  const [tab, setTab] = useState("songs");
  // Mirrors the active editor's unsaved-changes flag so we can guard tab
  // switches (each editor reports its own `dirty` via onDirtyChange).
  const [dirty, setDirty] = useState(false);

  function switchTab(id) {
    if (id === tab) return;
    if (
      dirty &&
      !window.confirm("You have unsaved changes. Discard them and switch tabs?")
    ) {
      return;
    }
    setDirty(false);
    setTab(id);
  }

  return (
    <main className="admin">
      <header className="admin-header">
        <div>
          <h1>Catalog Admin</h1>
          <span className="admin-hint">signed in as {adminName}</span>
        </div>
        <div className="admin-actions">
          <a className="admin-linkbtn" href="/">
            View site
          </a>
          <button className="admin-secondary" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? "active" : ""}
            onClick={() => switchTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "songs" ? (
        <AdminClient onDirtyChange={setDirty} />
      ) : (
        <CollectionsEditor onDirtyChange={setDirty} />
      )}
    </main>
  );
}
