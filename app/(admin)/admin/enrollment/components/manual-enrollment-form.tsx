"use client";

import { useState, useMemo } from "react";
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
  Loader2,
  Save,
  Search,
  UserPlus2,
  X,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

/**
 * --- สำหรับนำไปใช้จริง (โปรดลบคอมเมนต์บรรทัดเหล่านี้ออกเมื่ออยู่ในโปรเจกต์ของคุณ) ---
 */
import { createManualEnrollment } from "@/app/actions/student";

const CLASS_LEVELS = [
  "อ.1", "อ.2", "อ.3",
  "ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6",
  "ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6",
];

const STATUS_OPTIONS = [
  "กำลังศึกษา",
  "ย้ายออก",
  "ลาออก",
  "พักการเรียน",
  "พ้นสภาพ",
];

interface ManualEnrollmentFormProps {
  academicYears?: any[];
  students?: any[];
}

export default function ManualEnrollmentForm({
  academicYears = [],
  students = [],
}: ManualEnrollmentFormProps) {
  // === Search State ===
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // === Form State ===
  const [yearId, setYearId] = useState(() => {
    const active = academicYears.find((y) => y.isActive);
    return active ? String(active.id) : "";
  });
  const [classLevel, setClassLevel] = useState("");
  const [classRoom, setClassRoom] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [status, setStatus] = useState("กำลังศึกษา");
  const [isPending, setIsPending] = useState(false);

  // === Helper ฟังก์ชันดึงข้อมูลชั้นเรียนล่าสุด ===
  const getCurrentClassInfo = (student: any) => {
    const enrollment = student?.enrollments?.[0]; // ข้อมูลเรียงล่าสุดมาจาก Database แล้ว
    if (!enrollment) return "ไม่มีข้อมูลห้อง";
    return `${enrollment.classLevel}${enrollment.classRoom ? `/${enrollment.classRoom}` : ""}`;
  };

  // === Search Logic ===
  const searchResults = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 1) return [];
    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.firstName?.toLowerCase().includes(term) ||
        s.lastName?.toLowerCase().includes(term) ||
        s.studentCode?.toLowerCase().includes(term) ||
        s.codeCitizen?.includes(term)
    ).slice(0, 5); // แสดงแค่ 5 รายการเพื่อไม่ให้ล้นหน้าจอ
  }, [searchTerm, students]);

  const canSubmit = selectedStudent && yearId && classLevel && classRoom;

  const handleSelectStudent = (student: any) => {
    setSelectedStudent(student);
    setSearchTerm("");
    setIsSearchFocused(false);
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setSearchTerm("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsPending(true);
    try {
      // เรียกใช้ Server Action เพื่อบันทึกลงฐานข้อมูล
      const res = await createManualEnrollment({
        studentId: selectedStudent.id,
        academicYearId: parseInt(yearId),
        classLevel: classLevel,
        classRoom: parseInt(classRoom),
        studentNumber: studentNumber ? parseInt(studentNumber) : null,
        status: status,
      });

      if (res.success) {
        toast.success(
          `จัดห้องให้ ${selectedStudent.firstName} เข้าเรียนชั้น ${classLevel}/${classRoom} สำเร็จ`
        );

        // Reset form หลังจากบันทึกเสร็จ
        setSelectedStudent(null);
        setClassLevel("");
        setClassRoom("");
        setStudentNumber("");
        setStatus("กำลังศึกษา");
      } else {
        toast.error(res.error || "ไม่สามารถจัดห้องเรียนได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
    } finally {
      setIsPending(false);
    }
  };

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* กล่องค้นหานักเรียน */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-blue-600">
            1. ค้นหานักเรียน <span className="text-destructive">*</span>
          </Label>

          {selectedStudent ? (
            <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:bg-blue-950/20 dark:border-blue-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {selectedStudent.prefixName || ""} {selectedStudent.firstName} {selectedStudent.lastName}
                </p>
                <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 gap-y-1 items-center">
                  <span>รหัส: {selectedStudent.studentCode || "-"}</span>
                  <span className="hidden sm:inline">|</span>
                  <span>บัตรประชาชน: {selectedStudent.codeCitizen || "-"}</span>
                  <span className="hidden sm:inline">|</span>
                  <span className="bg-white dark:bg-black px-2 py-0.5 rounded-full border">
                    ปัจจุบัน: <strong className="text-blue-600 dark:text-blue-400">{getCurrentClassInfo(selectedStudent)}</strong>
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClearStudent}
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="พิมพ์ชื่อ, นามสกุล หรือรหัสนักเรียน เพื่อค้นหา..."
                className="pl-9 bg-muted/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />

              {/* Dropdown ผลลัพธ์การค้นหา */}
              {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-background shadow-md z-50 overflow-hidden">
                  {searchResults.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onMouseDown={() => handleSelectStudent(student)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b last:border-0 cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium shrink-0">
                        {student.firstName?.charAt(0) || "-"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {student.prefixName} {student.firstName} {student.lastName}
                        </p>
                        <div className="text-xs text-muted-foreground mt-0.5 flex gap-2 items-center">
                          <span>รหัส: {student.studentCode || "-"}</span>
                          <span>|</span>
                          <span>ปัจจุบัน: <strong className="text-blue-600 dark:text-blue-400">{getCurrentClassInfo(student)}</strong></span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isSearchFocused && searchTerm.length >= 1 && searchResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-background shadow-md z-50">
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    ไม่พบข้อมูลนักเรียน "{searchTerm}"
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ข้อมูลการจัดห้องเรียน */}
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-sm font-semibold text-green-600">
            2. กำหนดห้องเรียนและสถานะ
          </Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manualYear" className="text-xs font-medium text-muted-foreground">
                ปีการศึกษา <span className="text-destructive">*</span>
              </Label>
              <select
                id="manualYear"
                value={yearId}
                onChange={(e) => setYearId(e.target.value)}
                className={selectClass}
              >
                <option value="">เลือกปีการศึกษา</option>
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.year} {y.isActive ? " (ปัจจุบัน)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualStatus" className="text-xs font-medium text-muted-foreground">
                สถานะการเรียน
              </Label>
              <select
                id="manualStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={selectClass}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-lg border">
            <div className="space-y-2">
              <Label htmlFor="manualLevel" className="text-xs font-medium text-muted-foreground">
                ระดับชั้น <span className="text-destructive">*</span>
              </Label>
              <select
                id="manualLevel"
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className={selectClass}
              >
                <option value="">เลือกชั้น</option>
                {CLASS_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manualRoom" className="text-xs font-medium text-muted-foreground">
                ห้องที่ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="manualRoom"
                type="number"
                min={1}
                value={classRoom}
                onChange={(e) => setClassRoom(e.target.value)}
                placeholder="เช่น 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manualNumber" className="text-xs font-medium text-muted-foreground">
                เลขที่ (เว้นว่างได้)
              </Label>
              <Input
                id="manualNumber"
                type="number"
                min={1}
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="เช่น 15"
              />
            </div>
          </div>
        </div>

        {/* ปุ่มบันทึก */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              handleClearStudent();
              setClassLevel("");
              setClassRoom("");
              setStudentNumber("");
              setStatus("กำลังศึกษา");
            }}
            disabled={isPending}
            className="cursor-pointer"
          >
            ล้างข้อมูล
          </Button>
          <Button type="submit" disabled={!canSubmit || isPending} className="cursor-pointer">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            บันทึกการจัดห้อง
          </Button>
        </div>
      </form>
    </div>
  );
}