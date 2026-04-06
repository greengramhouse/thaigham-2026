import { AdminShell } from "@/components/admin/admin-shell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }
  
  return (
    <AdminShell name={session.user.name} email={session.user.email} image={session.user.image} role="user">
      {children}
    </AdminShell>
  );
}
