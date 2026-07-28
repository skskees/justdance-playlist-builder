"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AdminAccessDenied({ email }) {
  const { status } = useSession();

  return (
    <main className="admin-gate">
      <h1>Admin</h1>
      {status === "authenticated" || email ? (
        <>
          <p>
            You are signed in{email ? ` as ${email}` : ""}, but this account is
            not an admin.
          </p>
          <p className="admin-hint">
            Add your email to the <code>ADMIN_EMAILS</code> environment variable
            to grant access.
          </p>
          <button onClick={() => signOut({ callbackUrl: "/admin" })}>
            Sign out
          </button>
        </>
      ) : (
        <>
          <p>You must sign in with an admin account to edit the song catalog.</p>
          <button onClick={() => signIn("google", { callbackUrl: "/admin" })}>
            Sign in with Google
          </button>
        </>
      )}
      <p className="admin-hint">
        <a href="/">← Back to the playlist builder</a>
      </p>
    </main>
  );
}
