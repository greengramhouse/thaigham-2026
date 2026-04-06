import { z } from "zod";

export const studentSchema = z.object({
  // ข้อมูลส่วนตัว
  studentCode: z.string().optional().nullable(),
  codeCitizen: z.string().optional().nullable(),
  prefixName: z.string().min(1, "กรุณาระบุคำนำหน้าชื่อ").optional().nullable(),
  firstName: z.string().min(1, "กรุณาระบุชื่อ").optional().nullable(),
  lastName: z.string().min(1, "กรุณาระบุนามสกุล").optional().nullable(),
  gender: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  ethnicity: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  
  // ข้อมูลครอบครัว
  guardianFirstName: z.string().optional().nullable(),
  guardianLastName: z.string().optional().nullable(),
  guardianRelation: z.string().optional().nullable(),
  fatherFirstName: z.string().optional().nullable(),
  fatherLastName: z.string().optional().nullable(),
  motherFirstName: z.string().optional().nullable(),
  motherLastName: z.string().optional().nullable(),

  // ฟิลด์ใหม่สำหรับ Enrollment (ใช้เฉพาะตอนสร้างเด็กใหม่)
  // เราตั้งเป็น optional() เพราะตอน "แก้ไขข้อมูล (Edit)" เราไม่ได้ส่งฟิลด์พวกนี้มาด้วย
  academicYearId: z.string().optional().nullable(),
  classLevel: z.string().optional().nullable(),
  classRoom: z.string().optional().nullable(),
  studentNumber: z.string().optional().nullable(),
});

export type StudentValues = z.infer<typeof studentSchema>;