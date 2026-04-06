import { getUsers } from "@/app/actions/admin-users";
import { UserTable } from "@/components/admin/user-table";
import { Users, UserPlus } from "lucide-react";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";

  const { users, total, pageCount } = await getUsers(page, 10, search);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Users className="w-8 h-8 text-zinc-500" />
            User Management
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your team members and their account permissions here. ({total} users total)
          </p>
        </div>
      </div>

      {/* Main Content Component */}
      <UserTable initialUsers={users} total={total} pageCount={pageCount} currentPage={page} />
    </div>
  );
}