import { z } from "zod";

export const academicYearSchema = z.object({
  year: z
    .string()
    .min(4, "ปีการศึกษาต้องมี 4 หลัก")
    .max(4, "ปีการศึกษาต้องมี 4 หลัก")
    .regex(/^\d{4}$/, "ปีการศึกษาต้องเป็นตัวเลข 4 หลัก"),
  isActive: z.boolean().default(false),
});

export type AcademicYearValues = z.infer<typeof academicYearSchema>;
