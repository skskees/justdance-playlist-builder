import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { isAdmin } from "../../lib/admin";
import AdminShell from "../../components/AdminShell";
import AdminAccessDenied from "../../components/AdminAccessDenied";

// Always evaluate the session per-request; never statically pre-render.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin · The Dance Playlist Builder",
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!isAdmin(session?.user?.email)) {
    return <AdminAccessDenied email={session?.user?.email} />;
  }

  return <AdminShell adminName={session.user?.name || session.user?.email} />;
}
