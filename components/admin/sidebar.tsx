"use client";

import Link from "next/link";
import { LayoutDashboard, Users, Settings, LogOut, ChevronLeft, ChevronRight, BarChart3, ArrowUpDown, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

export function Sidebar({ name, email, image, role = "admin", isMobileOpen = false, onMobileClose }: { 
  name: string; 
  email: string; 
  image?: string | null;
  role?: "user" | "admin";
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ปิด mobile sidebar เมื่อเปลี่ยนหน้า
  useEffect(() => {
    if (onMobileClose) onMobileClose();
  }, [pathname]);

  // สร้างโครงสร้างข้อมูลสำหรับเมนูโดยประเมินจาก role
  const navGroups = [
    {
      title: "OVERVIEW",
      items: [
        { label: "Dashboard", href: role === "admin" ? "/admin/dashboard" : "/dashboarduser", icon: LayoutDashboard },
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      ]
    },
    ...(role === "admin" ? [{
      title: "MANAGEMENT",
      items: [
        { label: "StudentData", href: "/admin/student/table", icon: Users },
        { label: "Enrollment", href: "/admin/enrollment", icon: ArrowUpDown },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ]
    }] : [{
      title: "MANAGEMENT",
      items: [
        { label: "StudentData", href: "/dashboarduser/student/table", icon: Users },
      ]
    }])
  ];

  const isActive = (path: string) => pathname === path;

  // เนื้อหาภายใน Sidebar (ใช้ร่วมกันทั้ง Desktop และ Mobile)
  const sidebarContent = (isMobile: boolean) => (
    <>
      {/* Logo Area */}
      <div className={`p-6 flex items-center h-20 ${!isMobile && isCollapsed ? "justify-center px-0" : ""}`}>
        <div className={`${!isMobile && isCollapsed ? "w-10 h-10" : "w-12 h-12"} relative flex items-center justify-center flex-shrink-0 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 transition-all duration-300`}>
          <Image 
            src="https://res.cloudinary.com/gukkghu/image/upload/q_auto/f_auto/v1646575846/gukkghu/%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%AD%E0%B8%AD%E0%B8%81%E0%B9%81%E0%B8%9A%E0%B8%9A%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B9%84%E0%B8%A1%E0%B9%88%E0%B8%A1%E0%B8%B5%E0%B8%8A%E0%B8%B7%E0%B9%88%E0%B8%AD_aytvpq.png" 
            alt="Logo" 
            width={200}
            height={200}
            className="object-cover" 
          />
        </div>
        {(isMobile || !isCollapsed) && (
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 ml-3 whitespace-nowrap tracking-tight">
            ไทยงาม
          </h1>
        )}
        {/* ปุ่มปิดสำหรับ Mobile */}
        {isMobile && (
          <button 
            onClick={onMobileClose}
            className="ml-auto p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 space-y-1.5 mt-4 overflow-y-auto ${!isMobile && isCollapsed ? "px-3" : "px-4"}`}>
        {navGroups.map((group: any, groupIndex: number) => (
          <div key={groupIndex} className={groupIndex > 0 ? "mt-8" : ""}>
            <p className={`text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-4 mt-2 ${!isMobile && isCollapsed ? "text-center" : "px-2"}`}>
              {!isMobile && isCollapsed ? "—" : group.title}
            </p>
            {group.items.map((item: any, itemIndex: number) => (
              <NavItem 
                key={itemIndex}
                href={item.href} 
                icon={item.icon} 
                label={item.label} 
                isActive={isActive(item.href)} 
                isCollapsed={!isMobile && isCollapsed} 
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 m-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 flex-shrink-0">
        <div className={`flex items-center ${!isMobile && isCollapsed ? "justify-center" : "gap-3"}`}>
          {image ? (
            <Image
              src={image}
              alt={name || "Profile"}
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-zinc-200 dark:ring-zinc-700"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-medium text-sm">
              {name ? name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          {(isMobile || !isCollapsed) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{name}</p>
              <p className="text-xs text-zinc-500 truncate">{email}</p>
            </div>
          )}
        </div>
        <button 
          title="Logout"
          onClick={async () => {
            await authClient.signOut({
              fetchOptions: { onSuccess: () => router.push("/login") },
            });
          }}
          className={`mt-4 flex w-full items-center gap-2 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors ${!isMobile && isCollapsed ? "justify-center px-0" : "px-3"}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {(isMobile || !isCollapsed) && <span>Sign out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-screen flex-col hidden md:flex transition-all duration-300 relative ${isCollapsed ? "w-20" : "w-64"}`}>
        {/* Toggle Button (Desktop only) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 z-10 flex items-center justify-center shadow-sm hover:shadow-md transition-all"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {sidebarContent(false)}
      </aside>

      {/* Mobile Overlay + Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={onMobileClose} 
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl">
            {sidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}

// Sub-component สำหรับเมนู
function NavItem({ href, icon: Icon, label, isActive, isCollapsed }: any) {
  return (
    <Link 
      href={href} 
      title={isCollapsed ? label : ""}
      className={`group flex items-center gap-3 py-2.5 rounded-lg transition-all font-medium text-sm
        ${isCollapsed ? "justify-center px-0" : "px-3"}
        ${isActive 
          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50" 
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50"
        }
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-50"}`} />
      {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}