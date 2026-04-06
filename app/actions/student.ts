"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ดึงปีการศึกษาเพื่อไปแสดงใน Dropdown
export async function getAcademicYears() {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { year: 'desc' }
    });
    return { success: true, data: years };
  } catch (error) {
    console.error("Error fetching academic years:", error);
    return { success: false, error: "Failed to fetch academic years" };
  }
}

export async function getStudents() {
  try {
    const students = await prisma.student.findMany({
      orderBy: { id: 'desc' },
      include: {
        enrollments: {
          orderBy: { academicYearId: 'desc' },
          include: {
            academicYear: true
          }
        }
      }
    });
    return { success: true, data: students };
  } catch (error) {
    console.error("Error fetching students:", error);
    return { success: false, error: "Failed to fetch students" };
  }
}

export async function createStudent(data: any) {
  try {
    // แยกข้อมูลห้องเรียน ออกจากข้อมูลส่วนตัว
    const { academicYearId, classLevel, classRoom, studentNumber, ...studentData } = data;
    
    const parsedData = { ...studentData };
    
    // Convert empty strings to null for Student table
    for (const key of Object.keys(parsedData)) {
      if (parsedData[key] === "") {
        parsedData[key] = null;
      }
    }

    if (parsedData.birthDate) {
      parsedData.birthDate = new Date(parsedData.birthDate);
    } else {
      parsedData.birthDate = null;
    }

    // สร้างข้อมูล Student และ Enrollment ไปพร้อมกัน (Nested Writes)
    const newStudent = await prisma.student.create({
      data: {
        ...parsedData,
        // ถ้ามีการเลือกปีการศึกษาและชั้นเรียนมา ให้สร้าง Enrollment ทันที
        enrollments: (academicYearId && classLevel) ? {
          create: {
            academicYearId: parseInt(academicYearId),
            classLevel: classLevel,
            classRoom: classRoom ? parseInt(classRoom) : null,
            studentNumber: studentNumber ? parseInt(studentNumber) : null,
            status: "กำลังศึกษา"
          }
        } : undefined
      },
    });

    revalidatePath("/admin/student/table");
    revalidatePath("/dashboarduser/student/table");
    return { success: true, data: newStudent };
  } catch (error) {
    console.error("Error creating student:", error);
    return { success: false, error: "Failed to create student" };
  }
}

export async function updateStudent(id: number, data: any) {
  try {
    // ตัดข้อมูลห้องเรียนทิ้งไป (เพราะหน้า Edit เราตั้งใจให้แก้แค่ Profile ส่วนตัว)
    const { academicYearId, classLevel, classRoom, studentNumber, ...studentData } = data;
    
    const parsedData = { ...studentData };

    for (const key of Object.keys(parsedData)) {
      if (parsedData[key] === "") {
        parsedData[key] = null;
      }
    }

    if (parsedData.birthDate) {
      parsedData.birthDate = new Date(parsedData.birthDate);
    } else {
      parsedData.birthDate = null;
    }

    const updatedStudent = await prisma.student.update({
      where: { id: id },
      data: parsedData,
    });

    revalidatePath("/admin/student/table");
    revalidatePath("/dashboarduser/student/table");
    return { success: true, data: updatedStudent };
  } catch (error) {
    console.error("Error updating student:", error);
    return { success: false, error: "Failed to update student" };
  }
}

export async function deleteStudent(id: number) {
  try {
    // ลบนักเรียน (ประวัติใน Enrollment จะถูกลบตามอัตโนมัติ เพราะเราตั้ง onDelete: Cascade ไว้ใน Schema)
    await prisma.student.delete({
      where: { id: id },
    });
    revalidatePath("/admin/student/table");
    revalidatePath("/dashboarduser/student/table");
    return { success: true };
  } catch (error) {
    console.error("Error deleting student:", error);
    return { success: false, error: "Failed to delete student" };
  }
}

// จัดห้องเรียนรายคน
export async function createManualEnrollment(data: any) {
  try {
    const { studentId, academicYearId, classLevel, classRoom, studentNumber, status } = data;

    // ใช้คำสั่ง upsert เพื่อให้ระบบทำ 2 อย่างอย่างฉลาด:
    // 1. ถ้านักเรียนคนนี้ยังไม่เคยมีประวัติในปีการศึกษานี้ -> สร้างใหม่
    // 2. ถ้านักเรียนคนนี้มีประวัติในปีการศึกษานี้อยู่แล้ว -> อัปเดตข้อมูล (เช่น ย้ายห้อง)
    const enrollment = await prisma.enrollment.upsert({
      where: {
        // อ้างอิงจากกฎ @@unique([studentId, academicYearId]) ใน Schema
        studentId_academicYearId: {
          studentId: studentId,
          academicYearId: academicYearId,
        }
      },
      update: {
        classLevel: classLevel,
        classRoom: classRoom,
        studentNumber: studentNumber,
        status: status,
      },
      create: {
        studentId: studentId,
        academicYearId: academicYearId,
        classLevel: classLevel,
        classRoom: classRoom,
        studentNumber: studentNumber,
        status: status,
      }
    });

    // รีเฟรชข้อมูลหน้าเว็บหลังบันทึกเสร็จ
    revalidatePath("/admin/enrollment");
    revalidatePath("/admin/student/table");
    
    return { success: true, data: enrollment };
  } catch (error) {
    console.error("Error managing manual enrollment:", error);
    return { success: false, error: "ไม่สามารถบันทึกข้อมูลการจัดห้องเรียนได้" };
  }
}

// จัดห้องเรียนรายห้อง
export async function promoteStudentsGroup(data: {
  studentIds: number[];
  academicYearId: number;
  classLevel: string;
  classRoom: number;
}) {
  try {
    const { studentIds, academicYearId, classLevel, classRoom } = data;

    // ใช้ Transaction ในการวนลูปสร้าง/อัปเดต ประวัติการเรียนของเด็กที่ถูกเลือกทั้งหมด
    const operations = studentIds.map((id) =>
      prisma.enrollment.upsert({
        where: {
          studentId_academicYearId: {
            studentId: id,
            academicYearId: academicYearId,
          },
        },
        update: {
          classLevel,
          classRoom,
          status: "กำลังศึกษา",
          studentNumber: null, // รีเซ็ตเลขที่ใหม่ตอนเลื่อนชั้น
        },
        create: {
          studentId: id,
          academicYearId,
          classLevel,
          classRoom,
          status: "กำลังศึกษา",
        },
      })
    );

    await prisma.$transaction(operations);

    revalidatePath("/admin/enrollment");
    revalidatePath("/admin/student/table");

    return { success: true, count: studentIds.length };
  } catch (error) {
    console.error("Error promoting students:", error);
    return { success: false, error: "ไม่สามารถเลื่อนชั้นกลุ่มนักเรียนได้" };
  }
}

export async function updateStudentStatus(
  studentId: number, 
  academicYearId: number, 
  status: string,
  transferOutDate?: Date | null,    // รับเป็น Date object
  transferToSchool?: string | null
) {
  try {
    await prisma.enrollment.updateMany({
      where: {
        studentId: studentId,
        academicYearId: academicYearId,
      },
      data: {
        status: status,
        transferOutDate: status === "ย้ายออก" ? transferOutDate : null,
        transferToSchool: status === "ย้ายออก" ? transferToSchool : null,
      }
    });

    revalidatePath("/admin/student/table");
    revalidatePath("/admin/enrollment");
    return { success: true };
  } catch (error) {
    console.error("Error updating student status:", error);
    return { success: false, error: "ไม่สามารถอัปเดตสถานะได้" };
  }
}

// ฟังก์ชันสำหรับลบประวัติการเรียน (ใช้ในหน้า History)
export async function deleteEnrollment(enrollmentId: number) {
  try {
    await prisma.enrollment.delete({
      where: { id: enrollmentId },
    });
    
    // อัปเดตข้อมูลหน้าเว็บใหม่
    revalidatePath("/admin/student/table");
    revalidatePath("/admin/enrollment");
    return { success: true };
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    return { success: false, error: "ไม่สามารถลบประวัติการเรียนได้" };
  }
}