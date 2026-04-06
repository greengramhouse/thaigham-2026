"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  UserX,
  UserMinus,
  AlertCircle,
  Filter,
  TrendingUp,
  School,
} from "lucide-react";
import { getDashboardStats } from "@/app/actions/dashboard";

// กำหนดสีและ icon ให้แต่ละสถานะ
const STATUS_CONFIG: Record<string, { color: string; bgColor: string; borderColor: string; icon: any; darkBg: string }> = {
  "กำลังศึกษา": { color: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200", icon: UserCheck, darkBg: "dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
  "จบการศึกษา": { color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200", icon: GraduationCap, darkBg: "dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" },
  "ลาออก": { color: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200", icon: UserX, darkBg: "dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" },
  "ย้ายออก": { color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", icon: UserMinus, darkBg: "dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
  "พ้นสภาพ": { color: "text-rose-700", bgColor: "bg-rose-50", borderColor: "border-rose-200", icon: AlertCircle, darkBg: "dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" },
  "พักการเรียน": { color: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200", icon: BookOpen, darkBg: "dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20" },
};

const DEFAULT_STATUS_CONFIG = { color: "text-zinc-700", bgColor: "bg-zinc-50", borderColor: "border-zinc-200", icon: Users, darkBg: "dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20" };

interface DashboardStatsProps {
  academicYears: any[];
  initialStats: any;
  initialYearId: number | null;
  title?: string;
  description?: string;
}

export default function DashboardStats({ 
  academicYears, 
  initialStats, 
  initialYearId,
  title = "ภาพรวมระบบ",
  description = "ข้อมูลสถิตินักเรียน"
}: DashboardStatsProps) {
  const [selectedYear, setSelectedYear] = useState<string>(initialYearId ? String(initialYearId) : "");
  const [stats, setStats] = useState<any>(initialStats);
  const [isPending, startTransition] = useTransition();

  // เมื่อเปลี่ยนปีการศึกษา
  const handleYearChange = (yearId: string) => {
    setSelectedYear(yearId);
    startTransition(async () => {
      const res = await getDashboardStats(Number(yearId));
      if (res.success) {
        setStats(res.data);
      }
    });
  };

  // หาชื่อปีการศึกษาที่เลือก
  const selectedYearLabel = useMemo(() => {
    const year = academicYears.find((y) => String(y.id) === selectedYear);
    return year ? `ปีการศึกษา ${year.year}` : "ไม่พบปีการศึกษา";
  }, [selectedYear, academicYears]);

  // หา max สำหรับ bar chart
  const maxClassCount = useMemo(() => {
    if (!stats?.classLevelBreakdown?.length) return 1;
    return Math.max(...stats.classLevelBreakdown.map((c: any) => c.count), 1);
  }, [stats]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header + Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {description} {selectedYearLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
            <select
              className="pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer appearance-none min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              disabled={isPending}
            >
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  ปีการศึกษา {year.year} {year.isActive ? " (ปัจจุบัน)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <div className={`transition-opacity duration-300 ${isPending ? "opacity-50 pointer-events-none" : "opacity-100"}`}>

        {/* Summary Metric Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* จำนวนนักเรียนทั้งหมดในระบบ */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">นักเรียนทั้งหมดในระบบ</h3>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {stats?.totalStudents?.toLocaleString() || 0}
            </div>
            <p className="text-sm mt-2 text-zinc-500">คน (ทุกปีการศึกษา)</p>
          </div>

          {/* ลงทะเบียนเรียนในปีนี้ */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">ลงทะเบียน {selectedYearLabel}</h3>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {stats?.enrolledCount?.toLocaleString() || 0}
            </div>
            <p className="text-sm mt-2 text-zinc-500">คน (ปีนี้)</p>
          </div>

          {/* กำลังศึกษาอยู่ */}
          <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">กำลังศึกษาอยู่</h3>
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              {stats?.statusBreakdown?.find((s: any) => s.status === "กำลังศึกษา")?.count?.toLocaleString() || 0}
            </div>
            <p className="text-sm mt-2 text-zinc-500">คน (สถานะ กำลังศึกษา)</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-7">

          {/* จำนวนนักเรียนแยกตามระดับชั้น (Bar Chart) */}
          <div className="lg:col-span-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900/50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <School className="w-5 h-5 text-zinc-500" />
                  จำนวนนักเรียนแยกตามระดับชั้น
                </h3>
                <p className="text-sm text-zinc-500 mt-0.5">{selectedYearLabel}</p>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-end relative">
              {/* Background Grid Lines */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full border-t border-zinc-100 dark:border-zinc-800/50 h-0"></div>
                ))}
              </div>

              {/* Bars */}
              {stats?.classLevelBreakdown?.length > 0 ? (
                <div className="h-[280px] w-full flex items-end justify-around gap-3 relative z-10 mt-4">
                  {stats.classLevelBreakdown.map((item: any, i: number) => {
                    const pct = Math.max((item.count / maxClassCount) * 100, 5);
                    return (
                      <div key={i} className="flex-1 max-w-[80px] group relative flex flex-col items-center justify-end h-full">
                        {/* Tooltip */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs py-1 px-2.5 rounded-lg transition-opacity pointer-events-none whitespace-nowrap font-medium shadow-lg">
                          {item.count} คน
                        </div>
                        {/* Bar */}
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-500 group-hover:from-blue-600 group-hover:to-blue-500 rounded-t-md transition-all duration-500 relative overflow-hidden"
                          style={{ height: `${pct}%` }}
                        >
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {/* Label */}
                        <span className="mt-3 text-xs font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {item.classLevel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-zinc-400">
                  <p className="text-sm italic">ไม่มีข้อมูลระดับชั้นในปีการศึกษานี้</p>
                </div>
              )}
            </div>
          </div>

          {/* สถานะนักเรียน */}
          <div className="lg:col-span-3 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900/50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-zinc-500" />
                  สถานะนักเรียน
                </h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  {stats?.enrolledCount || 0} คน ใน{selectedYearLabel}
                </p>
              </div>
            </div>
            <div className="p-6 flex-1">
              {stats?.statusBreakdown?.length > 0 ? (
                <div className="space-y-4">
                  {stats.statusBreakdown.map((item: any, i: number) => {
                    const config = STATUS_CONFIG[item.status] || DEFAULT_STATUS_CONFIG;
                    const Icon = config.icon;
                    const percentage = stats.enrolledCount > 0 ? ((item.count / stats.enrolledCount) * 100).toFixed(1) : 0;

                    return (
                      <div key={i} className={`flex items-center gap-4 p-3.5 rounded-xl border ${config.bgColor} ${config.borderColor} ${config.darkBg} transition-all hover:shadow-sm`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bgColor} ${config.darkBg}`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold ${config.color}`}>
                            {item.status}
                          </div>
                          {/* Progress bar */}
                          <div className="mt-1.5 h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                item.status === "กำลังศึกษา" ? "bg-emerald-500" :
                                item.status === "จบการศึกษา" ? "bg-blue-500" :
                                item.status === "ลาออก" ? "bg-red-500" :
                                item.status === "ย้ายออก" ? "bg-amber-500" :
                                item.status === "พ้นสภาพ" ? "bg-rose-500" :
                                "bg-zinc-400"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-lg font-bold ${config.color}`}>
                            {item.count.toLocaleString()}
                          </div>
                          <div className="text-xs text-zinc-500">{percentage}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400">
                  <p className="text-sm italic">ไม่มีข้อมูลสถานะในปีการศึกษานี้</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
