"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ArrowRight, LogIn, Sparkles } from "lucide-react";

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  
  // ดึง session ว่าล็อกอินอยู่หรือไม่
  const { data: session, isPending } = authClient.useSession();

  const handleStart = () => {
    if (session) {
      router.push("/dashboarduser");
    } else {
      router.push("/login"); // ยังไม่ได้ login ให้ไปหน้า login
    }
  };
  
  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div 
      className="relative flex flex-col items-center justify-center min-h-screen bg-neutral-950 overflow-hidden"
      onMouseMove={(e) => {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        setMousePosition({ x: e.clientX - left, y: e.clientY - top });
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Gradient & Dynamic Spotlight Effect */}
      <div 
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 will-change-transform"
        style={{
          opacity: isHovered ? 1 : 0.3,
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(37, 99, 235, 0.15), transparent 40%)`
        }}
      />
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.05),transparent_50%)] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto transform translate-y-[-5vh]">
        
        {/* Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 backdrop-blur-sm mb-8 font-medium text-sm transition-all hover:bg-blue-500/20">
          <Sparkles className="w-4 h-4" />
          <span>The Next Generation Platform</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 drop-shadow-sm">
          Experience Magic with <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
            BetterAuth Next
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          สัมผัสประสบการณ์การใช้งานที่ลื่นไหล พร้อมระบบความปลอดภัยระดับสากล 
          เริ่มต้นใช้งานวันนี้เพื่อเปิดประตูสู่แดชบอร์ดสุดเอ็กซ์คลูซีฟ
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Button 
            size="lg" 
            onClick={handleStart}
            disabled={isPending}
            className="w-full sm:w-auto text-base h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] rounded-full hover:scale-105 active:scale-95"
          >
            {isPending ? "กำลังโหลด..." : "เริ่มใช้งาน"}
            {!isPending && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>

          {(!session || isPending) && (
             <Button 
                size="lg" 
                variant="outline"
                onClick={handleLogin}
                disabled={isPending}
                className="w-full sm:w-auto text-base h-14 px-8 rounded-full border-neutral-700 hover:bg-neutral-800 hover:text-white text-neutral-300 bg-neutral-900/50 backdrop-blur-sm transition-all duration-300 hover:border-neutral-500 hover:scale-105 active:scale-95"
             >
                เข้าสู่ระบบ
                <LogIn className="w-4 h-4 ml-2" />
             </Button>
          )}
        </div>
      </div>
    </div>
  );
}
