import { Bell, Menu } from "lucide-react";
import Image from "next/image";

export function Header({ name, email, image, onMobileMenuToggle }: { name: string; email: string; image?: string | null; onMobileMenuToggle?: () => void }) {
  // ดึงตัวอักษรแรกของชื่อมาทำเป็น Avatar fallback
  const initials = name ? name.charAt(0).toUpperCase() : "U";

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-6 transition-all">
      
      {/* Left section: Hamburger */}
      <div className="flex items-center gap-3 flex-1">
        <button 
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right section: Actions & Profile */}
      <div className="flex items-center gap-3 sm:gap-5">
        <button className="relative p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
        </button>
        
        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>
        
        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none mb-1">{name}</div>
            <div className="text-xs text-zinc-500 leading-none">{email}</div>
          </div>
          {image ? (
            <Image
              src={image}
              alt={name || "Profile"}
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover shadow-sm ring-2 ring-transparent hover:ring-zinc-200 dark:hover:ring-zinc-800 transition-all"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 font-semibold shadow-sm ring-2 ring-transparent hover:ring-zinc-200 dark:hover:ring-zinc-800 transition-all">
              {initials}
            </div>
          )}
        </button>
      </div>
    </header>
  );
}