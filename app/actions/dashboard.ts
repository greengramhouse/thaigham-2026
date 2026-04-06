"use server";

import { prisma } from "@/lib/db";

export async function getDashboardStats(academicYearId?: number) {
  try {
    // หาปีการศึกษาที่ active (ปัจจุบัน) ถ้าไม่ได้ระบุ
    let targetYearId = academicYearId;
    if (!targetYearId) {
      const activeYear = await prisma.academicYear.findFirst({
        where: { isActive: true },
      });
      if (activeYear) {
        targetYearId = activeYear.id;
      }
    }

    // จำนวนนักเรียนทั้งหมดในระบบ
    const totalStudents = await prisma.student.count();

    // ถ้าไม่มีปีการศึกษาเลย ส่งกลับข้อมูลพื้นฐาน
    if (!targetYearId) {
      return {
        success: true,
        data: {
          totalStudents,
          enrolledCount: 0,
          statusBreakdown: [],
          classLevelBreakdown: [],
          academicYearId: null,
        },
      };
    }

    // จำนวน Enrollment ในปีการศึกษานั้นๆ
    const enrolledCount = await prisma.enrollment.count({
      where: { academicYearId: targetYearId },
    });

    // แยกตามสถานะ (กำลังศึกษา, ลาออก, ย้ายออก, พ้นสภาพ, จบการศึกษา ฯลฯ)
    const statusBreakdown = await prisma.enrollment.groupBy({
      by: ["status"],
      where: { academicYearId: targetYearId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // แยกตามระดับชั้น
    const classLevelBreakdown = await prisma.enrollment.groupBy({
      by: ["classLevel"],
      where: { academicYearId: targetYearId },
      _count: { id: true },
      orderBy: { classLevel: "asc" },
    });

    return {
      success: true,
      data: {
        totalStudents,
        enrolledCount,
        statusBreakdown: statusBreakdown.map((s) => ({
          status: s.status || "ไม่ระบุ",
          count: s._count.id,
        })),
        classLevelBreakdown: classLevelBreakdown.map((c) => ({
          classLevel: c.classLevel || "ไม่ระบุ",
          count: c._count.id,
        })),
        academicYearId: targetYearId,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}
