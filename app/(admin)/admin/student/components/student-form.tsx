"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { studentSchema } from "@/lib/validations/student"; 
import { createStudent, updateStudent } from "@/app/actions/student";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface StudentFormProps {
  initialData?: any;
  academicYears?: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

const CLASS_LEVELS = ["อ.1", "อ.2", "อ.3", "ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6", "ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6"];

export default function StudentForm({ initialData, academicYears = [], onSuccess, onCancel }: StudentFormProps) {
  const [isPending, setIsPending] = useState(false);
  
  const activeYear = academicYears.find(y => y.isActive)?.id?.toString() || "";

  const formattedInitialData = initialData ? {
    ...initialData,
    birthDate: initialData.birthDate 
      ? new Date(initialData.birthDate).toISOString().split('T')[0] 
      : "",
  } : undefined;

  const form = useForm({
    resolver: zodResolver(studentSchema), // เปิดใช้งาน Zod
    defaultValues: formattedInitialData || {
      studentCode: "",
      codeCitizen: "",
      prefixName: "",
      firstName: "",
      lastName: "",
      gender: "",
      birthDate: "",
      religion: "",
      ethnicity: "",
      nationality: "",
      guardianFirstName: "",
      guardianLastName: "",
      guardianRelation: "",
      fatherFirstName: "",
      fatherLastName: "",
      motherFirstName: "",
      motherLastName: "",
      academicYearId: activeYear,
      classLevel: "",
      classRoom: "",
      studentNumber: "",
    },
  });

  const onSubmit = async (values: any) => {
    setIsPending(true);
    try {
      if (initialData?.id) {
        const res = await updateStudent(initialData.id, values);
        if (res.success) {
          toast.success("อัปเดตข้อมูลส่วนตัวเรียบร้อย");
          onSuccess();
        } else {
          toast.error(res.error || "ไม่สามารถอัปเดตข้อมูลได้");
        }
      } else {
        const res = await createStudent(values);
        if (res.success) {
          toast.success("เพิ่มข้อมูลและจัดห้องเรียนเรียบร้อย");
          onSuccess();
        } else {
          toast.error(res.error || "ไม่สามารถเพิ่มข้อมูลได้");
        }
      }
    } catch (error) {
      toast.error("มีข้อผิดพลาดเกิดขึ้น");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div className="col-span-full font-semibold text-lg border-b pb-2 mt-4 text-blue-600">1. ข้อมูลส่วนตัวพื้นฐาน</div>
        
        <div className="space-y-2">
          <Label htmlFor="studentCode">รหัสนักเรียน</Label>
          <Input id="studentCode" {...form.register("studentCode")} placeholder="รหัสนักเรียน" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prefixName">คำนำหน้า <span className="text-destructive">*</span></Label>
          <Input id="prefixName" {...form.register("prefixName")} placeholder="ด.ช. / ด.ญ. / นาย / นางสาว" />
          {form.formState.errors.prefixName && (
            <p className="text-xs text-destructive">{form.formState.errors.prefixName.message as string}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstName">ชื่อ <span className="text-destructive">*</span></Label>
          {/* เอา required ออก แล้วปล่อยให้ Zod ทำงาน */}
          <Input id="firstName" {...form.register("firstName")} placeholder="ชื่อจริง" />
          {form.formState.errors.firstName && (
            <p className="text-xs text-destructive">{form.formState.errors.firstName.message as string}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">นามสกุล <span className="text-destructive">*</span></Label>
          <Input id="lastName" {...form.register("lastName")} placeholder="นามสกุล" />
          {form.formState.errors.lastName && (
            <p className="text-xs text-destructive">{form.formState.errors.lastName.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="codeCitizen">เลขประจำตัวประชาชน</Label>
          <Input id="codeCitizen" {...form.register("codeCitizen")} placeholder="13 หลัก" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">เพศ</Label>
          <Input id="gender" {...form.register("gender")} placeholder="ชาย / หญิง / อื่นๆ" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthDate">วันเกิด</Label>
          <Input id="birthDate" type="date" {...form.register("birthDate")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="religion">ศาสนา</Label>
          <Input id="religion" {...form.register("religion")} placeholder="เช่น พุทธ" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ethnicity">เชื้อชาติ</Label>
          <Input id="ethnicity" {...form.register("ethnicity")} placeholder="เช่น ไทย" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationality">สัญชาติ</Label>
          <Input id="nationality" {...form.register("nationality")} placeholder="เช่น ไทย" />
        </div>

        <div className="col-span-full font-semibold text-lg border-b pb-2 mt-4 text-blue-600">2. ข้อมูลครอบครัว</div>

        <div className="space-y-2">
          <Label htmlFor="fatherFirstName">ชื่อบิดา</Label>
          <Input id="fatherFirstName" {...form.register("fatherFirstName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fatherLastName">นามสกุลบิดา</Label>
          <Input id="fatherLastName" {...form.register("fatherLastName")} />
        </div>
        <div className="hidden lg:block space-y-2"></div>

        <div className="space-y-2">
          <Label htmlFor="motherFirstName">ชื่อมารดา</Label>
          <Input id="motherFirstName" {...form.register("motherFirstName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="motherLastName">นามสกุลมารดา</Label>
          <Input id="motherLastName" {...form.register("motherLastName")} />
        </div>
        <div className="hidden lg:block space-y-2"></div>

        <div className="space-y-2">
          <Label htmlFor="guardianFirstName">ชื่อผู้ปกครอง</Label>
          <Input id="guardianFirstName" {...form.register("guardianFirstName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardianLastName">นามสกุลผู้ปกครอง</Label>
          <Input id="guardianLastName" {...form.register("guardianLastName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardianRelation">ความเกี่ยวข้อง</Label>
          <Input id="guardianRelation" {...form.register("guardianRelation")} placeholder="เช่น บิดา, มารดา, ลุง" />
        </div>

        {/* ข้อมูลการเข้าเรียน (แสดงเฉพาะตอนเพิ่มเด็กใหม่) */}
        {!initialData?.id && (
          <>
            <div className="col-span-full font-semibold text-lg border-b pb-2 mt-4 text-green-600">
              3. ข้อมูลการเข้าเรียน (เฉพาะปีแรกเข้า)
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="academicYearId">ปีการศึกษา <span className="text-destructive">*</span></Label>
              <select 
                {...form.register("academicYearId")} 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">เลือกปี</option>
                {academicYears.map(y => (
                  <option key={y.id} value={y.id}>{y.year} {y.isActive && "(ปัจจุบัน)"}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classLevel">ระดับชั้น <span className="text-destructive">*</span></Label>
              <select 
                {...form.register("classLevel")} 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">เลือกชั้น</option>
                {CLASS_LEVELS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classRoom">ห้องที่ <span className="text-destructive">*</span></Label>
              <Input type="number" {...form.register("classRoom")} placeholder="เช่น 1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentNumber">เลขที่</Label>
              <Input type="number" {...form.register("studentNumber")} placeholder="ปล่อยว่างได้" />
            </div>
          </>
        )}
      </div>
      
      <div className="pt-4 flex justify-end gap-2 border-t mt-6">
        <Button variant="outline" type="button" onClick={onCancel} className="cursor-pointer" disabled={isPending}>
          ยกเลิก
        </Button>
        <Button type="submit" className="cursor-pointer" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? "บันทึกแก้ไขข้อมูลส่วนตัว" : "เพิ่มนักเรียนและจัดห้อง"}
        </Button>
      </div>
    </form>
  );
}