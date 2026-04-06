"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Plus, Trash2, Search, X, Filter, Users, UserCog, Loader2, AlertTriangle } from "lucide-react";
import { deleteStudent, updateStudentStatus } from "@/app/actions/student";
import StudentForm from "./Student-form";
import ButtonPdfStudent from "./Button-pdf-student";

const STATUS_OPTIONS = [
  "กำลังศึกษา",
  "ลาออก",
  "พักการเรียน",
  "พ้นสภาพ",
  "จบการศึกษา"
];

export default function StudentTable({ 
  initialStudents = [], 
  academicYears = [], 
  readOnly = false 
}: { 
  initialStudents?: any[], 
  academicYears?: any[], 
  readOnly?: boolean 
}) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  // State สำหรับแก้ไขสถานะแบบด่วน
  const [statusModalStudent, setStatusModalStudent] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // === State สำหรับเก็บปีการศึกษาที่เลือก ===
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const active = academicYears.find(y => y.isActive);
    return active ? String(active.id) : "all";
  });

  // === State สำหรับเก็บระดับชั้น/ห้อง ที่เลือก ===
  const [selectedClass, setSelectedClass] = useState<string>("all");

  // รีเซ็ตการค้นหาชั้นเรียน เมื่อมีการเปลี่ยนปีการศึกษา
  useEffect(() => {
    setSelectedClass("all");
  }, [selectedYear]);

  // ฟังก์ชันช่วยดึงข้อมูล Enrollment ให้ตรงกับปีที่เลือก
  const getEnrollmentToDisplay = (student: any, targetYear: string) => {
    if (!student.enrollments || student.enrollments.length === 0) return null;
    if (targetYear === "all") return student.enrollments[0]; 
    return student.enrollments.find((e: any) => String(e.academicYearId) === targetYear) || null;
  };

  // ดึงรายการระดับชั้นและห้องเรียนที่มีอยู่จริงในปีการศึกษานั้นๆ เพื่อมาทำ Dropdown
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    initialStudents.forEach((student) => {
      const displayEnrollment = getEnrollmentToDisplay(student, selectedYear);
      if (displayEnrollment?.classLevel) {
        const level = displayEnrollment.classLevel;
        const room = displayEnrollment.classRoom != null ? ` / ${displayEnrollment.classRoom}` : "";
        classes.add(`${level}${room}`);
      }
    });
    // จัดเรียงตัวอักษรภาษาไทย
    return Array.from(classes).sort((a, b) => a.localeCompare(b, 'th'));
  }, [initialStudents, selectedYear]);

  // กรองนักเรียนตาม "คำค้นหา", "ปีการศึกษา" และ "ชั้นเรียน"
  const filteredStudents = useMemo(() => {
    return initialStudents.filter((student) => {
      // 1. กรองตามปีการศึกษา
      if (selectedYear !== "all") {
         const hasEnrollmentInYear = student.enrollments?.some((e: any) => String(e.academicYearId) === selectedYear);
         if (!hasEnrollmentInYear) return false;
      }

      const displayEnrollment = getEnrollmentToDisplay(student, selectedYear);

      // 2. กรองตามระดับชั้น/ห้อง
      if (selectedClass !== "all") {
        if (!displayEnrollment) return false;
        const level = displayEnrollment.classLevel;
        const room = displayEnrollment.classRoom != null ? ` / ${displayEnrollment.classRoom}` : "";
        const classRoomStr = `${level}${room}`;
        if (classRoomStr !== selectedClass) return false;
      }

      // 3. กรองตามคำค้นหา (ค้นจากชื่อ, นามสกุล, รหัส)
      const term = search.toLowerCase();
      return (
        student.firstName?.toLowerCase().includes(term) ||
        student.lastName?.toLowerCase().includes(term) ||
        student.studentCode?.toLowerCase().includes(term) ||
        student.codeCitizen?.includes(term)
      );
    });
  }, [initialStudents, search, selectedYear, selectedClass]);

  // เปลี่ยนมาใช้ Sonner Toast แบบ Action แทน Window.confirm()
  const handleDelete = (student: any) => {
    toast("ยืนยันการลบข้อมูลนักเรียน", {
      description: `คุณกำลังจะลบข้อมูลของ ${student.firstName} ${student.lastName} (ประวัติการเรียนจะถูกลบไปด้วย)`,
      action: {
        label: "ยืนยันลบทันที",
        onClick: async () => {
          const res = await deleteStudent(student.id);
          if (res.success) {
            toast.success("ลบข้อมูลนักเรียนเรียบร้อยแล้ว");
          } else {
            toast.error("ไม่สามารถลบข้อมูลได้ โปรดลองอีกครั้ง");
          }
        },
      },
      cancel: {
        label: "ยกเลิก",
        onClick: () => console.log("Cancel delete"),
      },
      duration: 5000,
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    });
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  // จัดการบันทึกสถานะแบบด่วน
  const handleSaveStatus = async () => {
    if (!statusModalStudent) return;
    
    const enrollment = getEnrollmentToDisplay(statusModalStudent, selectedYear);
    if (!enrollment) {
      toast.error("ไม่พบข้อมูลประวัติการเรียนในปีการศึกษานี้");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await updateStudentStatus(statusModalStudent.id, enrollment.academicYearId, newStatus);
      if (res.success) {
        toast.success("อัปเดตสถานะสำเร็จ");
        setStatusModalStudent(null);
      } else {
        toast.error("ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 p-2">
      {/* Header Actions & Stats */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">รายชื่อนักเรียน</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{filteredStudents.length}</span>
                <span className="text-sm text-muted-foreground font-medium">จากทั้งหมด {initialStudents.length} คน</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
          <ButtonPdfStudent filteredStudents={filteredStudents} />

          {!readOnly && (
            <Button onClick={handleAddNew} className="w-full sm:w-auto shadow-sm h-11 px-6 cursor-pointer">
              <Plus className="mr-2 h-5 w-5" /> เพิ่มนักเรียนใหม่
            </Button>
          )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Dropdown เลือกปีการศึกษา */}
          <div className="relative w-full sm:w-64">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
            <select
              className="flex h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:bg-muted/50 appearance-none"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="all">ทุกปีการศึกษา (ล่าสุด)</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  ปีการศึกษา {year.year} {year.isActive ? " (ปัจจุบัน)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown เลือกระดับชั้น/ห้อง */}
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-green-500" />
            <select
              className="flex h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:bg-muted/50 appearance-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">ทุกชั้นเรียน / ห้อง</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>ชั้น {cls}</option>
              ))}
            </select>
          </div>

          {/* ช่องค้นหาชื่อนักเรียน */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อ, นามสกุล, รหัส..."
              className="pl-10 h-11 rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-md overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b transition-colors">
                <th className="h-14 px-4 text-left align-middle font-bold text-muted-foreground">รหัสนักเรียน</th>
                <th className="h-14 px-4 text-left align-middle font-bold text-muted-foreground">ชื่อ-นามสกุล</th>
                <th className="h-14 px-4 text-left align-middle font-bold text-muted-foreground">ระดับชั้น/ห้อง</th>
                <th className="h-14 px-4 text-left align-middle font-bold text-muted-foreground">เลขที่</th>
                <th className="h-14 px-4 text-left align-middle font-bold text-muted-foreground">สถานะ</th>
                {!readOnly && (
                  <th className="h-14 px-4 text-right align-middle font-bold text-muted-foreground">จัดการ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const displayEnrollment = getEnrollmentToDisplay(student, selectedYear);

                  return (
                    <tr key={student.id} className="transition-colors hover:bg-primary/[0.02]">
                      <td className="p-4 align-middle font-mono text-xs font-medium text-blue-600">{student.studentCode || "-"}</td>
                      <td className="p-4 align-middle">
                        <div className="font-semibold text-foreground">
                          {student.prefixName || ""} {student.firstName} {student.lastName}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {displayEnrollment ? (
                          <span className="text-muted-foreground font-medium">
                            {displayEnrollment.classLevel} {displayEnrollment.classRoom != null ? `/ ${displayEnrollment.classRoom}` : ""}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="p-4 align-middle font-medium">{displayEnrollment?.studentNumber || "-"}</td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border-2 ${
                          displayEnrollment?.status === 'กำลังศึกษา' ? 'bg-green-50 text-green-700 border-green-200' :
                          displayEnrollment?.status === 'ย้ายออก' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          displayEnrollment?.status === 'จบการศึกษา' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          displayEnrollment?.status === 'พ้นสภาพ' || displayEnrollment?.status === 'ลาออก' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                            displayEnrollment?.status === 'กำลังศึกษา' ? 'bg-green-600' :
                            displayEnrollment?.status === 'ย้ายออก' ? 'bg-yellow-600' :
                            displayEnrollment?.status === 'จบการศึกษา' ? 'bg-blue-600' :
                            displayEnrollment?.status === 'พ้นสภาพ' || displayEnrollment?.status === 'ลาออก' ? 'bg-red-600' :
                            'bg-gray-600'
                          }`} />
                          {displayEnrollment?.status || "ไม่มีข้อมูล"}
                        </span>
                      </td>
                      {!readOnly && (
                        <td className="p-4 align-middle text-right">
                          <div className="flex justify-end gap-2">
                            {/* ปุ่มเปลี่ยนสถานะแบบด่วน */}
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => {
                                setStatusModalStudent(student);
                                setNewStatus(displayEnrollment?.status || "กำลังศึกษา");
                              }} 
                              className="h-9 w-9 bg-orange-200 text-orange-600 hover:text-orange-700 hover:bg-orange-50 cursor-pointer border-orange-100"
                              title="เปลี่ยนสถานะการเรียน"
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                            
                            <Button variant="outline" size="icon" onClick={() => handleEdit(student)} className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100 cursor-pointer" title="แก้ไขข้อมูล">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            
                            <Button variant="outline" size="icon" onClick={() => handleDelete(student)} className="h-9 w-9 text-destructive hover:text-destructive hover:bg-red-50 border-red-100 cursor-pointer" title="ลบข้อมูล">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={readOnly ? 5 : 6} className="p-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="bg-muted p-4 rounded-full">
                        <Search className="h-8 w-8 opacity-20" />
                      </div>
                      <p className="font-medium italic">ไม่พบข้อมูลนักเรียนที่ตรงตามเงื่อนไข</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ปรับปรุงสถานะแบบด่วน */}
      {statusModalStudent && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm flex flex-col animate-in zoom-in-95 duration-200 border">
            <div className="flex items-center justify-between p-5 border-b bg-muted/20">
              <h2 className="text-lg font-bold text-foreground">
                เปลี่ยนสถานะนักเรียน
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setStatusModalStudent(null)} className="rounded-full hover:bg-background h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium">ชื่อ-นามสกุล:</p>
                <p className="text-muted-foreground">{statusModalStudent.prefixName} {statusModalStudent.firstName} {statusModalStudent.lastName}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ระบุสถานะใหม่:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {STATUS_OPTIONS.map((statusOp) => (
                    <option key={statusOp} value={statusOp}>{statusOp}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex gap-2 w-full">
                <Button variant="outline" className="flex-1" onClick={() => setStatusModalStudent(null)} disabled={isUpdatingStatus}>
                  ยกเลิก
                </Button>
                <Button className="flex-1" onClick={handleSaveStatus} disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  บันทึกสถานะ
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal สำหรับฟอร์มเต็ม */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border">
            <div className="flex items-center justify-between p-6 border-b bg-muted/20">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {editingStudent ? "แก้ไขประวัตินักเรียน" : "เพิ่มนักเรียนใหม่"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">กรอกข้อมูลพื้นฐานและข้อมูลการเรียน</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full hover:bg-background">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto">
              <StudentForm
                initialData={editingStudent} 
                academicYears={academicYears}
                onSuccess={closeModal} 
                onCancel={closeModal} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}