import { AdminShell } from "@/components/admin/admin-shell";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // ตรวจสอบสิทธิ์ว่าเป็น Admin หรือไม่
  if (!session || session.user.role !== "admin") {
    redirect("/dashboarduser");
  }
  
  return (
    <AdminShell name={session.user.name} email={session.user.email} image={session.user.image} role="admin">
      {children}
    </AdminShell>
  );
}