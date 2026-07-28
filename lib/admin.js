// Admin access is controlled by an allowlist of email addresses set in the
// ADMIN_EMAILS environment variable (comma-separated). A signed-in Google
// account whose email is on the list is treated as an admin.

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdmin(email) {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
