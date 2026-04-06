"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, UserPlus, MoreHorizontal, Edit, Trash2, Shield, Ban, CheckCircle2, AlertCircle } from "lucide-react";
import { updateUser, deleteUser, createUser } from "@/app/actions/admin-users";

type User = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  createdAt: Date;
  image: string | null;
};

export function UserTable({ initialUsers, total, pageCount, currentPage }: any) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Search state
  const [search, setSearch] = useState(searchParams.get("search") || "");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({ name: "", email: "", role: "user", banned: false, password: "" });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) {
      params.set("search", search);
    } else {
      params.delete("search");
    }
    params.set("page", "1"); // reset to page 1 on search
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pageCount) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", role: "user", banned: false, password: "" });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      role: user.role || "user", 
      banned: user.banned || false,
      password: "" // Keep empty for update
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    
    try {
      if (editingUser) {
        await updateUser(editingUser.id, { 
          name: formData.name, 
          role: formData.role, 
          banned: formData.banned,
          password: formData.password || undefined
        });
      } else {
        await createUser({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password || undefined
        });
      }
      setIsModalOpen(false);
      // Data is revalidated in server action
    } catch (err: any) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setIsSubmitting(true);
    try {
      await deleteUser(deletingUser.id);
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Table Actions (Search & Add) */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-sm shadow-sm transition-all"
          />
          {isPending && <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin"></span>}
        </form>

        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium rounded-lg hover:bg-zinc-800 dark:hover:bg-white/90 transition-colors shadow-sm text-sm whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined At</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No users found
                  </td>
                </tr>
              ) : (
                initialUsers.map((user: User) => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-medium flex-shrink-0">
                          {user.image ? <img src={user.image} className="w-full h-full rounded-full" /> : user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.name}</p>
                          <p className="text-zinc-500 text-xs mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 align-middle">
                        {user.role === 'admin' ? <Shield className="w-3.5 h-3.5 text-indigo-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />}
                        <span className="capitalize text-zinc-700 dark:text-zinc-300 font-medium">{user.role || 'user'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${
                        user.banned 
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" 
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                      }`}>
                        {user.banned ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {user.banned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(user)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md hover:shadow-sm transition-all" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => openDeleteModal(user)} className="p-2 text-zinc-400 hover:text-rose-600 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md hover:shadow-sm transition-all hover:border-rose-200 dark:hover:border-rose-900/50" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-sm">
            <span className="text-zinc-500">
              Showing page <span className="font-medium text-zinc-900 dark:text-zinc-100">{currentPage}</span> of <span className="font-medium text-zinc-900 dark:text-zinc-100">{pageCount}</span>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
                className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pageCount || isPending}
                className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      
      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/50">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {editingUser ? "Edit User" : "Add New User"}
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                {editingUser ? "Update user roles and statuses" : "Create a new user account"}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all" 
                />
              </div>

              {!editingUser && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all" 
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300 flex justify-between">
                  Password
                  <span className="text-zinc-400 font-normal text-xs">
                    {editingUser ? "(Leave empty to keep current)" : "(Leave empty to auto-generate)"}
                  </span>
                </label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all placeholder:text-zinc-400" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Role</label>
                  <select 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all appearance-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {editingUser && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Status</label>
                    <select 
                      value={formData.banned ? "true" : "false"} 
                      onChange={e => setFormData({...formData, banned: e.target.value === "true"})}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all appearance-none text-red-600 dark:text-red-400"
                    >
                      <option value="false" className="text-zinc-900 dark:text-zinc-100">Active</option>
                      <option value="true">Banned</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  Cancel
                </button>
                <button disabled={isSubmitting} type="submit" className="flex-1 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-white/90 disabled:opacity-50 transition-colors flex justify-center items-center">
                  {isSubmitting ? <span className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-white dark:border-t-zinc-900 rounded-full animate-spin"></span> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-2xl shadow-xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">Delete User</h3>
            <p className="text-zinc-500 text-sm mb-6">
              Are you sure you want to delete <span className="font-semibold text-zinc-800 dark:text-zinc-200">{deletingUser?.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button disabled={isSubmitting} type="button" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button disabled={isSubmitting} type="button" onClick={handleDelete} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 flex justify-center items-center">
                {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
