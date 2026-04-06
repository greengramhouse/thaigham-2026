import { prisma } from "@/lib/db";
import { getDashboardStats } from "@/app/actions/dashboard";
import DashboardStats from "@/components/dashboard/dashboard-stats";

export default async function AdminDashboard() {
  // ดึงปีการศึกษาทั้งหมด
  const academicYears = await prisma.academicYear.findMany({
    orderBy: { year: "desc" },
  });

  // หาปีปัจจุบัน (isActive)
  const activeYear = academicYears.find((y) => y.isActive);
  const activeYearId = activeYear ? activeYear.id : academicYears[0]?.id || null;

  // ดึงสถิติเบื้องต้นของปีที่ active
  const statsRes = activeYearId ? await getDashboardStats(activeYearId) : null;
  const initialStats = statsRes?.success ? statsRes.data : null;

  return (
    <div className="p-6 sm:p-8">
      <DashboardStats
        academicYears={academicYears}
        initialStats={initialStats}
        initialYearId={activeYearId}
      />
    </div>
  );
}