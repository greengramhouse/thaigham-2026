"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Edit2, Plus, Trash2, Search, X, Filter, 
  Users, UserCog, Loader2, AlertTriangle, 
  ChevronLeft, ChevronRight, FileText, History
} from "lucide-react";

/**
 * --- สำหรับนำไปใช้จริง (โปรดลบคอมเมนต์บรรทัดเหล่านี้ออกเมื่ออยู่ในโปรเจกต์ของคุณ) ---
 */
import { deleteStudent, updateStudentStatus, deleteEnrollment } from "@/app/actions/student";
import StudentForm from "./student-form";
import ButtonPdfStudent from "./Button-pdf-student";

const STATUS_OPTIONS = [
  "กำลังศึกษา",
  "ย้ายออก",
  "ลาออก",
  "พักการเรียน",
  "พ้นสภาพ",
  "จบการศึกษา"
];

const ITEMS_PER_PAGE = 5; // กำหนดจำนวนนักเรียนต่อ 1 หน้า

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

  // === State สำหรับแก้ไขสถานะแบบด่วน ===
  const [statusModalStudent, setStatusModalStudent] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [transferOutDate, setTransferOutDate] = useState("");
  const [transferToSchool, setTransferToSchool] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // === State สำหรับ Modal ประวัติการเรียน ===
  const [historyModalStudent, setHistoryModalStudent] = useState<any>(null);

  // State สำหรับเก็บปีการศึกษาที่เลือก
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const active = academicYears.find(y => y.isActive);
    return active ? String(active.id) : "all";
  });

  // State สำหรับเก็บระดับชั้น/ห้อง ที่เลือก
  const [selectedClass, setSelectedClass] = useState<string>("all");
  
  // === State ใหม่: สำหรับกรองสถานะ ===
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // State สำหรับ Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // รีเซ็ตการค้นหาชั้นเรียน เมื่อมีการเปลี่ยนปีการศึกษา
  useEffect(() => {
    setSelectedClass("all");
  }, [selectedYear]);

  // รีเซ็ตหน้ากลับไปหน้าที่ 1 เสมอเมื่อมีการค้นหาหรือเปลี่ยนฟิลเตอร์
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedYear, selectedClass, selectedStatus]); // เพิ่ม selectedStatus

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

  // กรองนักเรียนตาม "คำค้นหา", "ปีการศึกษา", "ชั้นเรียน" และ "สถานะ" (ข้อมูลทั้งหมดหลังกรอง)
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

      // 3. กรองตามสถานะ
      if (selectedStatus !== "all") {
        if (!displayEnrollment) return false; // ถ้าไม่มีประวัติ ให้ถือว่าไม่ตรงสถานะ
        if (displayEnrollment.status !== selectedStatus) return false;
      }

      // 4. กรองตามคำค้นหา (ค้นจากชื่อ, นามสกุล, รหัส)
      const term = search.toLowerCase();
      return (
        student.firstName?.toLowerCase().includes(term) ||
        student.lastName?.toLowerCase().includes(term) ||
        student.studentCode?.toLowerCase().includes(term) ||
        student.codeCitizen?.includes(term)
      );
    });
  }, [initialStudents, search, selectedYear, selectedClass, selectedStatus]);

  // คำนวณข้อมูลสำหรับการแบ่งหน้า (Pagination)
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const handleDelete = (student: any) => {
    toast("ยืนยันการลบข้อมูลนักเรียน", {
      description: `คุณกำลังจะลบข้อมูลของ ${student.firstName} ${student.lastName} (ประวัติการเรียนทั้งหมดจะถูกลบไปด้วย)`,
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

  const handleSaveStatus = async () => {
    if (!statusModalStudent) return;
    
    const enrollment = getEnrollmentToDisplay(statusModalStudent, selectedYear);
    if (!enrollment) {
      toast.error("ไม่พบข้อมูลประวัติการเรียนในปีการศึกษานี้");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      // เปลี่ยนกลับมาสร้างเป็น Date Object เพื่อให้ Type ตรงกับ Server Action
      const formattedDate = newStatus === "ย้ายออก" && transferOutDate ? new Date(transferOutDate) : null;
      const formattedSchool = newStatus === "ย้ายออก" ? transferToSchool : null;

      const res = await updateStudentStatus(
        statusModalStudent.id, 
        enrollment.academicYearId, 
        newStatus,
        formattedDate,
        formattedSchool
      );
      
      if (res.success) {
        toast.success("อัปเดตสถานะสำเร็จ");
        setStatusModalStudent(null);
        setTransferOutDate("");
        setTransferToSchool("");
      } else {
        toast.error("ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const closeStatusModal = () => {
    setStatusModalStudent(null);
    setTransferOutDate("");
    setTransferToSchool("");
  }

  // === ฟังก์ชันใหม่: สำหรับลบเฉพาะประวัติปีนั้นๆ ===
  const handleDeleteEnrollment = (enrollmentId: number, yearName: string) => {
    toast("ยืนยันลบประวัติของปีนี้", {
      description: `ต้องการลบข้อมูลการเข้าเรียนของปีการศึกษา ${yearName} ใช่หรือไม่? (ข้อมูลนักเรียนจะยังอยู่)`,
      action: {
        label: "ยืนยันลบ",
        onClick: async () => {
          const res = await deleteEnrollment(enrollmentId);
          if (res.success) {
            toast.success("ลบประวัติการเรียนสำเร็จ");
            // อัปเดต State หน้าต่าง Modal ให้รายการนั้นหายไปทันทีโดยไม่ต้องโหลดใหม่
            setHistoryModalStudent((prev: any) => ({
              ...prev,
              enrollments: prev.enrollments.filter((e: any) => e.id !== enrollmentId)
            }));
          } else {
            toast.error("ไม่สามารถลบประวัติได้");
          }
        },
      },
      cancel: {
        label: "ยกเลิก",
        onClick: () => console.log("Cancel delete enrollment"),
      },
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    });
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
          
          <ButtonPdfStudent 
            filteredStudents={filteredStudents} // ส่งข้อมูลทั้งหมดที่กรองแล้ว (ไม่โดนตัด pagination) ไปทำ PDF
            selectedClass={selectedClass} 
            selectedYear={selectedYear}
            selectedStatus={selectedStatus} // ส่งให้เผื่อไปแสดงบนหัวกระดาษ PDF
          />

          {!readOnly && (
            <Button onClick={handleAddNew} className="w-full sm:w-auto shadow-sm h-11 px-6 cursor-pointer">
              <Plus className="mr-2 h-5 w-5" /> เพิ่มนักเรียนใหม่
            </Button>
          )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row flex-wrap gap-3">
          {/* Dropdown เลือกปีการศึกษา */}
          <div className="relative w-full sm:w-48 md:w-56">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
            <select
              className="flex h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:bg-muted/50 appearance-none"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="all">ทุกปีการศึกษา</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>
                  ปีการศึกษา {year.year} {year.isActive ? " (ปัจจุบัน)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown เลือกระดับชั้น/ห้อง */}
          <div className="relative w-full sm:w-40 md:w-48">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-green-500" />
            <select
              className="flex h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:bg-muted/50 appearance-none"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">ทุกห้อง</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>ชั้น {cls}</option>
              ))}
            </select>
          </div>

          {/* Dropdown เลือกสถานะ (เพิ่มใหม่) */}
          <div className="relative w-full sm:w-40 md:w-48">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
            <select
              className="flex h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer hover:bg-muted/50 appearance-none"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">ทุกสถานะ</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* ช่องค้นหาชื่อนักเรียน */}
          <div className="relative flex-1 min-w-[200px] max-w-full">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อ, นามสกุล, รหัส..."
              className="pl-10 h-11 rounded-lg w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-xl border bg-card shadow-md flex flex-col overflow-hidden">
        <div className="relative w-full overflow-x-auto">
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
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => {
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
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          {/* ปุ่มดูประวัติการเรียน */}
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => setHistoryModalStudent(student)} 
                            className="h-9 w-9 bg-indigo-50 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 cursor-pointer border-indigo-200"
                            title="ดูประวัติการเรียน"
                          >
                            <History className="h-4 w-4" />
                          </Button>

                          {!readOnly && (
                            <>
                              {/* ปุ่มเปลี่ยนสถานะแบบด่วน */}
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => {
                                  setStatusModalStudent(student);
                                  setNewStatus(displayEnrollment?.status || "กำลังศึกษา");
                                  // ถ้าเคยย้ายออกแล้ว ให้ดึงข้อมูลมาแสดงด้วย
                                  if (displayEnrollment?.transferOutDate) {
                                    setTransferOutDate(new Date(displayEnrollment.transferOutDate).toISOString().split('T')[0]);
                                  } else {
                                    setTransferOutDate("");
                                  }
                                  setTransferToSchool(displayEnrollment?.transferToSchool || "");
                                }} 
                                className="h-9 w-9 bg-orange-50 text-orange-600 hover:text-orange-700 hover:bg-orange-100 cursor-pointer border-orange-200"
                                title="เปลี่ยนสถานะการเรียน"
                              >
                                <UserCog className="h-4 w-4" />
                              </Button>
                              
                              <Button variant="outline" size="icon" onClick={() => handleEdit(student)} className="h-9 w-9 bg-blue-50 text-blue-600 hover:text-blue-700 hover:bg-blue-100 border-blue-200 cursor-pointer" title="แก้ไขข้อมูล">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              
                              <Button variant="outline" size="icon" onClick={() => handleDelete(student)} className="h-9 w-9 bg-red-50 text-destructive hover:text-destructive hover:bg-red-100 border-red-200 cursor-pointer" title="ลบข้อมูล">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-muted-foreground">
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
            <div className="text-sm text-muted-foreground">
              แสดงผล <span className="font-medium text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> ถึง <span className="font-medium text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)}</span> จาก <span className="font-medium text-foreground">{filteredStudents.length}</span> รายการ
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-9 px-3 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                ก่อนหน้า
              </Button>
              <div className="text-sm font-medium px-4">
                หน้า {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-9 px-3 cursor-pointer"
              >
                ถัดไป
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal ประวัติชั้นเรียนของนักเรียน */}
      {historyModalStudent && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg flex flex-col animate-in zoom-in-95 duration-200 border max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b bg-muted/20">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-foreground">
                  ประวัติการเรียน
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setHistoryModalStudent(null)} className="rounded-full hover:bg-background h-8 w-8 cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-muted-foreground">ชื่อ-นามสกุล</p>
                <p className="font-semibold text-lg">{historyModalStudent.prefixName} {historyModalStudent.firstName} {historyModalStudent.lastName}</p>
                <p className="text-sm text-muted-foreground mt-1">รหัสนักเรียน: <span className="text-foreground">{historyModalStudent.studentCode || "-"}</span></p>
              </div>

              {historyModalStudent.enrollments && historyModalStudent.enrollments.length > 0 ? (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  {/* เรียงปีล่าสุดขึ้นก่อน */}
                  {[...historyModalStudent.enrollments]
                    .sort((a, b) => b.academicYearId - a.academicYearId)
                    .map((enrollment: any, idx: number) => {
                      const yearObj = academicYears.find(y => y.id === enrollment.academicYearId);
                      return (
                        <div key={enrollment.id || idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-indigo-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ml-[3px] md:ml-0"></div>
                          <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] bg-card border p-3 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-600 text-sm">ปีการศึกษา {yearObj?.year || "ไม่ทราบปี"}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  enrollment.status === 'กำลังศึกษา' ? 'bg-green-100 text-green-700' :
                                  enrollment.status === 'ย้ายออก' ? 'bg-orange-100 text-orange-700' :
                                  enrollment.status === 'จบการศึกษา' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {enrollment.status || "ไม่มีสถานะ"}
                                </span>
                              </div>
                              
                              {/* ปุ่มลบประวัติของปีนี้ (แสดงเมื่อไม่ใช่โหมด readOnly) */}
                              {!readOnly && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteEnrollment(enrollment.id, yearObj?.year || "ไม่ทราบปี")}
                                  className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                  title="ลบข้อมูลปีการศึกษานี้"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <div className="text-sm text-foreground">
                              ชั้น {enrollment.classLevel} {enrollment.classRoom ? `/ ${enrollment.classRoom}` : ""}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                              <span>เลขที่: {enrollment.studentNumber || "-"}</span>
                            </div>
                            {/* แสดงข้อมูลเพิ่มเติมถ้าย้ายออก */}
                            {enrollment.status === 'ย้ายออก' && (enrollment.transferOutDate || enrollment.transferToSchool) && (
                              <div className="mt-2 pt-2 border-t text-[11px] text-orange-600 dark:text-orange-400">
                                {enrollment.transferOutDate && <div>ย้ายเมื่อ: {new Date(enrollment.transferOutDate).toLocaleDateString('th-TH')}</div>}
                                {enrollment.transferToSchool && <div>ไปยัง: {enrollment.transferToSchool}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground italic bg-muted/30 rounded-lg">
                  ไม่มีประวัติการเรียนในระบบ
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-muted/10">
              <Button className="w-full cursor-pointer" onClick={() => setHistoryModalStudent(null)}>
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ปรับปรุงสถานะแบบด่วน */}
      {statusModalStudent && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm flex flex-col animate-in zoom-in-95 duration-200 border">
            <div className="flex items-center justify-between p-5 border-b bg-muted/20">
              <h2 className="text-lg font-bold text-foreground">
                เปลี่ยนสถานะนักเรียน
              </h2>
              <Button variant="ghost" size="icon" onClick={closeStatusModal} className="rounded-full hover:bg-background h-8 w-8 cursor-pointer">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium">ชื่อ-นามสกุล:</p>
                <p className="text-muted-foreground">{statusModalStudent.prefixName} {statusModalStudent.firstName} {statusModalStudent.lastName}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">ระบุสถานะใหม่:</Label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {STATUS_OPTIONS.map((statusOp) => (
                    <option key={statusOp} value={statusOp}>{statusOp}</option>
                  ))}
                </select>
              </div>

              {/* ส่วนกรอกข้อมูลย้ายออก (แสดงเฉพาะตอนเลือกสถานะ ย้ายออก) */}
              {newStatus === "ย้ายออก" && (
                <div className="grid grid-cols-1 gap-3 p-3 mt-3 border border-orange-200 bg-orange-50/50 rounded-lg dark:bg-orange-950/20 dark:border-orange-900 animate-in zoom-in-95 duration-200">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-orange-700 dark:text-orange-500">
                      วันที่ย้ายออก
                    </Label>
                    <Input
                      type="date"
                      value={transferOutDate}
                      onChange={(e) => setTransferOutDate(e.target.value)}
                      className="border-orange-200 focus-visible:ring-orange-500 h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-orange-700 dark:text-orange-500">
                      โรงเรียนที่รับย้าย
                    </Label>
                    <Input
                      type="text"
                      value={transferToSchool}
                      onChange={(e) => setTransferToSchool(e.target.value)}
                      placeholder="เช่น โรงเรียนตัวอย่างวิทยา"
                      className="border-orange-200 focus-visible:ring-orange-500 h-9"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-2 w-full">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={closeStatusModal} disabled={isUpdatingStatus}>
                  ยกเลิก
                </Button>
                <Button className="flex-1 cursor-pointer" onClick={handleSaveStatus} disabled={isUpdatingStatus}>
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
              <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-full hover:bg-background cursor-pointer">
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