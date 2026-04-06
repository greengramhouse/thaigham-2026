"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function AdminShell({ 
  children, 
  name, 
  email, 
  image,
  role = "admin" 
}: { 
  children: React.ReactNode; 
  name: string; 
  email: string; 
  image?: string | null;
  role?: "user" | "admin";
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800">
      
      <Sidebar 
        name={name} 
        email={email} 
        image={image}
        role={role}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          name={name} 
          email={email} 
          image={image}
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          {children}
        </main>
      </div>
      
    </div>
  );
}
