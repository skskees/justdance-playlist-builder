import GoogleProvider from "next-auth/providers/google";
import { isAdmin } from "./admin";

// Webpack's ESM interop sometimes nests the provider under `.default`; this
// unwraps it either way so `Google(...)` works in both builds.
const Google = GoogleProvider.default || GoogleProvider;

// Exchange the stored refresh token for a fresh access token. Returns a new
// token object; on failure it flags `error` so the session/route can tell the
// user to re-authenticate instead of silently sending a dead access token.
async function refreshAccessToken(token) {
  if (!token.refreshToken) {
    console.error("No refresh token on session — user must sign in again.");
    return { ...token, error: "RefreshAccessTokenError" };
  }
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });
    const refreshed = await response.json();
    if (!response.ok) {
      console.error("Google token refresh failed:", refreshed);
      return { ...token, error: "RefreshAccessTokenError" };
    }
    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + refreshed.expires_in,
      // Google usually omits a new refresh token on refresh — keep the old one.
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (err) {
    console.error("Google token refresh threw:", err);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/youtube",
          // access_type + prompt=consent are required to reliably get a
          // refresh_token back (Google only sends it the FIRST time a user
          // consents unless you force the consent screen every time).
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    // Runs whenever a JWT is created/updated. We stash the access + refresh
    // token here so server-side API routes can use them later to call the
    // YouTube Data API on the user's behalf.
    async jwt({ token, account }) {
      // Initial sign-in: persist the tokens the provider handed us.
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          // account.expires_at is unix seconds; fall back to ~1h if absent.
          expiresAt: account.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
          error: undefined,
        };
      }

      // Still valid (with a 60s safety margin)? Reuse it as-is.
      if (token.expiresAt && Date.now() / 1000 < token.expiresAt - 60) {
        return token;
      }

      // Expired or about to — refresh it.
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Expose the access token to server components/API routes via the
      // session object. Do NOT expose this to client components unnecessarily.
      session.accessToken = token.accessToken;
      // Surface a refresh failure so routes/UI can prompt a fresh sign-in.
      session.error = token.error;
      // Flag admins so the UI can show/hide the admin panel. The API routes
      // re-check this server-side too — this flag is a convenience, not the
      // security boundary.
      if (session.user) {
        session.user.isAdmin = isAdmin(session.user.email);
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};
