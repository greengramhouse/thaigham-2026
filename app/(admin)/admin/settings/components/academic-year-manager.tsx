"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { academicYearSchema } from "@/lib/validations/academic-year";
import {
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  toggleActiveAcademicYear,
} from "@/app/actions/academic-year";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  CalendarDays,
  CheckCircle2,
  Circle,
  Star,
} from "lucide-react";

interface AcademicYearWithCount {
  id: number;
  year: string;
  isActive: boolean;
  _count: { enrollments: number };
}

interface AcademicYearManagerProps {
  initialData: AcademicYearWithCount[];
}

export default function AcademicYearManager({
  initialData,
}: AcademicYearManagerProps) {
  const [academicYears, setAcademicYears] = useState(initialData);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYearWithCount | null>(
    null
  );
  const [isPending, setIsPending] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const form = useForm({
    resolver: zodResolver(academicYearSchema),
    defaultValues: { year: "", isActive: false },
  });

  const openAddForm = () => {
    setEditingYear(null);
    form.reset({ year: "", isActive: false });
    setIsFormOpen(true);
  };

  const openEditForm = (yearData: AcademicYearWithCount) => {
    setEditingYear(yearData);
    form.reset({ year: yearData.year, isActive: yearData.isActive });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingYear(null);
    form.reset({ year: "", isActive: false });
  };

  const refreshList = (updatedItem?: any, deletedId?: number) => {
    // We rely on server revalidation for full refresh,
    // but optimistically update local state for instant UI feedback
    if (deletedId) {
      setAcademicYears((prev) => prev.filter((y) => y.id !== deletedId));
    }
  };

  const onSubmit = async (values: any) => {
    setIsPending(true);
    try {
      if (editingYear) {
        const res = await updateAcademicYear(editingYear.id, values);
        if (res.success) {
          toast.success("แก้ไขปีการศึกษาเรียบร้อย");
          // Optimistic update
          setAcademicYears((prev) =>
            prev.map((y) => {
              if (y.id === editingYear.id)
                return { ...y, year: values.year, isActive: values.isActive };
              if (values.isActive) return { ...y, isActive: false };
              return y;
            })
          );
          closeForm();
        } else {
          toast.error(res.error || "ไม่สามารถแก้ไขได้");
        }
      } else {
        const res = await createAcademicYear(values);
        if (res.success) {
          toast.success("เพิ่มปีการศึกษาเรียบร้อย");
          const newItem = {
            ...res.data!,
            _count: { enrollments: 0 },
          };
          setAcademicYears((prev) => {
            let list = values.isActive
              ? prev.map((y) => ({ ...y, isActive: false }))
              : [...prev];
            return [newItem, ...list.filter((y) => y.id !== newItem.id)].sort(
              (a, b) => b.year.localeCompare(a.year)
            );
          });
          closeForm();
        } else {
          toast.error(res.error || "ไม่สามารถเพิ่มได้");
        }
      }
    } catch {
      toast.error("มีข้อผิดพลาดเกิดขึ้น");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบปีการศึกษานี้?")) return;
    const res = await deleteAcademicYear(id);
    if (res.success) {
      toast.success("ลบปีการศึกษาเรียบร้อย");
      refreshList(undefined, id);
    } else {
      toast.error(res.error || "ไม่สามารถลบได้");
    }
  };

  const handleToggleActive = async (id: number) => {
    setTogglingId(id);
    try {
      const res = await toggleActiveAcademicYear(id);
      if (res.success) {
        toast.success("เปลี่ยนสถานะเรียบร้อย");
        setAcademicYears((prev) =>
          prev.map((y) => ({
            ...y,
            isActive: y.id === id,
          }))
        );
      } else {
        toast.error(res.error || "ไม่สามารถเปลี่ยนสถานะได้");
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>ปีการศึกษา</CardTitle>
              <CardDescription>
                จัดการปีการศึกษาสำหรับระบบ — เพิ่ม แก้ไข ลบ
                และกำหนดปีการศึกษาปัจจุบัน
              </CardDescription>
            </div>
          </div>
          <Button onClick={openAddForm} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            เพิ่ม
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* List */}
        {academicYears.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              ยังไม่มีปีการศึกษาในระบบ
            </p>
            <Button onClick={openAddForm} variant="outline" className="mt-4" size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              เพิ่มปีการศึกษาแรก
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {academicYears.map((ay) => (
              <div
                key={ay.id}
                className={`flex items-center justify-between py-3.5 transition-colors ${
                  ay.isActive
                    ? "bg-primary/[0.03] -mx-6 px-6 rounded-lg"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Active indicator / toggle */}
                  <button
                    onClick={() => handleToggleActive(ay.id)}
                    disabled={togglingId !== null}
                    className="group relative flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-primary/10 disabled:opacity-50"
                    title={
                      ay.isActive
                        ? "ปีการศึกษาปัจจุบัน"
                        : "กดเพื่อตั้งเป็นปีการศึกษาปัจจุบัน"
                    }
                  >
                    {togglingId === ay.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : ay.isActive ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary/60" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm tabular-nums">
                        {ay.year}
                      </span>
                      {ay.isActive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          <Star className="h-3 w-3 fill-primary" />
                          ปัจจุบัน
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ay._count.enrollments > 0
                        ? `${ay._count.enrollments} รายการลงทะเบียน`
                        : "ยังไม่มีการลงทะเบียน"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditForm(ay)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="sr-only">แก้ไข</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(ay.id)}
                    className="h-8 w-8"
                    disabled={ay._count.enrollments > 0}
                    title={
                      ay._count.enrollments > 0
                        ? "ไม่สามารถลบได้ — มีข้อมูลลงทะเบียนอ้างอิง"
                        : "ลบ"
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    <span className="sr-only">ลบ</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md flex flex-col animate-in fade-in-0 zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingYear ? "แก้ไขปีการศึกษา" : "เพิ่มปีการศึกษา"}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {editingYear
                    ? "แก้ไขข้อมูลปีการศึกษาที่เลือก"
                    : "กรอกข้อมูลเพื่อเพิ่มปีการศึกษาใหม่"}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeForm}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="year">
                  ปีการศึกษา (พ.ศ.){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="year"
                  {...form.register("year")}
                  placeholder="เช่น 2567"
                  maxLength={4}
                  className="text-lg font-semibold tracking-wider tabular-nums"
                />
                {form.formState.errors.year && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.year.message}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.watch("isActive")}
                  onClick={() =>
                    form.setValue("isActive", !form.getValues("isActive"))
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    form.watch("isActive")
                      ? "bg-primary"
                      : "bg-input"
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                      form.watch("isActive")
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
                <Label
                  className="cursor-pointer"
                  onClick={() =>
                    form.setValue("isActive", !form.getValues("isActive"))
                  }
                >
                  ตั้งเป็นปีการศึกษาปัจจุบัน
                </Label>
              </div>
              {form.watch("isActive") && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2">
                  ⚠️ การตั้งเป็นปีการศึกษาปัจจุบัน
                  จะยกเลิกสถานะปัจจุบันของปีการศึกษาอื่นโดยอัตโนมัติ
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  type="button"
                  onClick={closeForm}
                  disabled={isPending}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingYear ? "บันทึก" : "เพิ่ม"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
