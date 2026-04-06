"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getAcademicYears() {
  try {
    const academicYears = await prisma.academicYear.findMany({
      orderBy: { year: "desc" },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });
    return { success: true, data: academicYears };
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return { success: false, error: "ไม่สามารถดึงข้อมูลปีการศึกษาได้" };
  }
}

export async function createAcademicYear(data: {
  year: string;
  isActive: boolean;
}) {
  try {
    // If setting as active, deactivate all others first
    if (data.isActive) {
      await prisma.academicYear.updateMany({
        data: { isActive: false },
      });
    }

    const newYear = await prisma.academicYear.create({
      data: {
        year: data.year,
        isActive: data.isActive,
      },
    });
    revalidatePath("/admin/settings");
    return { success: true, data: newYear };
  } catch (error: any) {
    console.error("Error creating academic year:", error);
    if (error?.code === "P2002") {
      return { success: false, error: "ปีการศึกษานี้มีอยู่ในระบบแล้ว" };
    }
    return { success: false, error: "ไม่สามารถเพิ่มปีการศึกษาได้" };
  }
}

export async function updateAcademicYear(
  id: number,
  data: { year: string; isActive: boolean }
) {
  try {
    // If setting as active, deactivate all others first
    if (data.isActive) {
      await prisma.academicYear.updateMany({
        where: { id: { not: id } },
        data: { isActive: false },
      });
    }

    const updated = await prisma.academicYear.update({
      where: { id },
      data: {
        year: data.year,
        isActive: data.isActive,
      },
    });
    revalidatePath("/admin/settings");
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("Error updating academic year:", error);
    if (error?.code === "P2002") {
      return { success: false, error: "ปีการศึกษานี้มีอยู่ในระบบแล้ว" };
    }
    return { success: false, error: "ไม่สามารถแก้ไขปีการศึกษาได้" };
  }
}

export async function deleteAcademicYear(id: number) {
  try {
    await prisma.academicYear.delete({
      where: { id },
    });
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting academic year:", error);
    if (error?.code === "P2003") {
      return {
        success: false,
        error:
          "ไม่สามารถลบได้ เนื่องจากมีข้อมูลการลงทะเบียนอ้างอิงอยู่",
      };
    }
    return { success: false, error: "ไม่สามารถลบปีการศึกษาได้" };
  }
}

export async function toggleActiveAcademicYear(id: number) {
  try {
    // Deactivate all
    await prisma.academicYear.updateMany({
      data: { isActive: false },
    });
    // Activate selected
    const updated = await prisma.academicYear.update({
      where: { id },
      data: { isActive: true },
    });
    revalidatePath("/admin/settings");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Error toggling academic year:", error);
    return { success: false, error: "ไม่สามารถเปลี่ยนสถานะได้" };
  }
}
