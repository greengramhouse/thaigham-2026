"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Edit2, Plus, Trash2, Search, X, Filter, 
  Users, UserCog, Loader2, AlertTriangle, 
  ChevronLeft, ChevronRight, FileText, History,
  Eye, MapPin, Phone, Calendar, Droplet, UserSquare, Contact
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

const ITEMS_PER_PAGE = 20; // กำหนดจำนวนนักเรียนต่อ 1 หน้า

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

  // === State สำหรับ Modal ดูรายละเอียดนักเรียนและประวัติการเรียน ===
  const [detailModalStudent, setDetailModalStudent] = useState<any>(null);
  const [viewTab, setViewTab] = useState<"info" | "history">("info"); // ควบคุม Tab ภายใน Modal

  // State สำหรับเก็บปีการศึกษาที่เลือก
  const [selectedYear, setSelectedYear] = useState<string>(() => {
    const active = academicYears.find(y => y.isActive);
    return active ? String(active.id) : "all";
  });

  // State สำหรับเก็บระดับชั้น/ห้อง ที่เลือก
  const [selectedClass, setSelectedClass] = useState<string>("all");
  
  // === State สำหรับกรองสถานะ ===
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
  }, [search, selectedYear, selectedClass, selectedStatus]);

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
    return Array.from(classes).sort((a, b) => a.localeCompare(b, 'th'));
  }, [initialStudents, selectedYear]);

  // กรองนักเรียนตาม "คำค้นหา", "ปีการศึกษา", "ชั้นเรียน" และ "สถานะ"
  const filteredStudents = useMemo(() => {
    return initialStudents.filter((student) => {
      if (selectedYear !== "all") {
         const hasEnrollmentInYear = student.enrollments?.some((e: any) => String(e.academicYearId) === selectedYear);
         if (!hasEnrollmentInYear) return false;
      }

      const displayEnrollment = getEnrollmentToDisplay(student, selectedYear);

      if (selectedClass !== "all") {
        if (!displayEnrollment) return false;
        const level = displayEnrollment.classLevel;
        const room = displayEnrollment.classRoom != null ? ` / ${displayEnrollment.classRoom}` : "";
        const classRoomStr = `${level}${room}`;
        if (classRoomStr !== selectedClass) return false;
      }

      if (selectedStatus !== "all") {
        if (!displayEnrollment) return false;
        if (displayEnrollment.status !== selectedStatus) return false;
      }

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

  const handleDeleteEnrollment = (enrollmentId: number, yearName: string) => {
    toast("ยืนยันลบประวัติของปีนี้", {
      description: `ต้องการลบข้อมูลการเข้าเรียนของปีการศึกษา ${yearName} ใช่หรือไม่? (ข้อมูลนักเรียนจะยังอยู่)`,
      action: {
        label: "ยืนยันลบ",
        onClick: async () => {
          const res = await deleteEnrollment(enrollmentId);
          if (res.success) {
            toast.success("ลบประวัติการเรียนสำเร็จ");
            // อัปเดตข้อมูลใน Modal ให้หายไปทันที
            setDetailModalStudent((prev: any) => ({
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

  // Helper ฟังก์ชันสำหรับสร้างปุ่มจัดการ
  const renderActionButtons = (student: any, displayEnrollment: any) => (
    <div className="flex justify-end gap-2">
      {/* ปุ่มรวมสำหรับดูข้อมูลและประวัติการเรียน */}
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => {
          setDetailModalStudent(student);
          setViewTab("info");
        }} 
        className="h-9 w-9 bg-indigo-50 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 cursor-pointer border-indigo-200"
        title="ดูข้อมูลและประวัติการเรียน"
      >
        <Eye className="h-4 w-4" />
      </Button>

      {/* ปุ่มแก้ไขต่างๆ (เฉพาะ Admin) */}
      {!readOnly && (
        <>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              setStatusModalStudent(student);
              setNewStatus(displayEnrollment?.status || "กำลังศึกษา");
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
  );

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
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <ButtonPdfStudent 
              filteredStudents={filteredStudents} 
              selectedClass={selectedClass} 
              selectedYear={selectedYear}
              // @ts-ignore
              selectedStatus={selectedStatus} 
            />

            {!readOnly && (
              <Button onClick={handleAddNew} className="flex-1 sm:flex-none shadow-sm h-11 px-6 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-5 w-5" /> <span className="hidden sm:inline">เพิ่มนักเรียนใหม่</span><span className="sm:hidden">เพิ่ม</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-wrap gap-3">
          {/* Dropdown เลือกปีการศึกษา */}
          <div className="relative w-full sm:w-auto lg:w-48 xl:w-56 flex-1">
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
          <div className="relative w-full sm:w-auto lg:w-40 xl:w-48 flex-1">
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

          {/* Dropdown เลือกสถานะ */}
          <div className="relative w-full sm:w-auto lg:w-40 xl:w-48 flex-1">
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
          <div className="relative w-full lg:flex-1 min-w-[200px]">
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

      {/* Table & Cards Section */}
      <div className="rounded-xl border bg-card shadow-md flex flex-col overflow-hidden">
        
        {/* ========================================= */}
        {/* รูปแบบที่ 1: ตารางสำหรับหน้าจอใหญ่ (Desktop/Tablet) */}
        {/* ========================================= */}
        <div className="hidden md:block relative w-full overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b transition-colors">
                <th className="h-14 px-4 text-left align-middle font-bold text-muted-foreground">รหัสนักเรียน</th>
                <th className="h-14 px-4 text-left align-middle font-bold text-muted-foreground">ชื่อ-นามสกุล</th>
                <th className="h-14 px-4 text-left align-middle font-bold text-muted-foreground">ระดับชั้น/ห้อง</th>
                <th className="h-14 px-4 text-left align-middle font-bold text-muted-foreground">เลขที่</th>
                <th className="h-14 px-4 text-left align-middle font-bold text-muted-foreground">สถานะ</th>
                <th className="h-14 px-4 text-right align-middle font-bold text-muted-foreground">จัดการ</th>
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
                        {renderActionButtons(student, displayEnrollment)}
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

        {/* ========================================= */}
        {/* รูปแบบที่ 2: การ์ดสำหรับหน้าจอมือถือ (Mobile) */}
        {/* ========================================= */}
        <div className="block md:hidden flex flex-col divide-y bg-card">
          {paginatedStudents.length > 0 ? (
            paginatedStudents.map((student) => {
              const displayEnrollment = getEnrollmentToDisplay(student, selectedYear);
              return (
                <div key={student.id} className="p-4 space-y-4 transition-colors hover:bg-muted/30">
                  {/* หัวการ์ด: รหัส, ชื่อ, สถานะ */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="font-mono text-xs font-medium text-blue-600 mb-1">รหัส: {student.studentCode || "-"}</div>
                      <div className="font-semibold text-base text-foreground leading-tight">
                        {student.prefixName || ""} {student.firstName} {student.lastName}
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      displayEnrollment?.status === 'กำลังศึกษา' ? 'bg-green-50 text-green-700 border-green-200' :
                      displayEnrollment?.status === 'ย้ายออก' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      displayEnrollment?.status === 'จบการศึกษา' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      displayEnrollment?.status === 'พ้นสภาพ' || displayEnrollment?.status === 'ลาออก' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      <span className={`mr-1 h-1.5 w-1.5 rounded-full ${
                        displayEnrollment?.status === 'กำลังศึกษา' ? 'bg-green-600' :
                        displayEnrollment?.status === 'ย้ายออก' ? 'bg-yellow-600' :
                        displayEnrollment?.status === 'จบการศึกษา' ? 'bg-blue-600' :
                        displayEnrollment?.status === 'พ้นสภาพ' || displayEnrollment?.status === 'ลาออก' ? 'bg-red-600' :
                        'bg-gray-600'
                      }`} />
                      {displayEnrollment?.status || "-"}
                    </span>
                  </div>

                  {/* ข้อมูลชั้นเรียน */}
                  <div className="grid grid-cols-2 gap-2 text-sm bg-muted/20 p-3 rounded-lg border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">ระดับชั้น/ห้อง</p>
                      <p className="font-medium text-foreground">
                        {displayEnrollment ? `${displayEnrollment.classLevel} ${displayEnrollment.classRoom != null ? `/ ${displayEnrollment.classRoom}` : ""}` : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">เลขที่</p>
                      <p className="font-medium text-foreground">{displayEnrollment?.studentNumber || "-"}</p>
                    </div>
                  </div>

                  {/* ปุ่มจัดการ */}
                  <div className="pt-2 border-t">
                    {renderActionButtons(student, displayEnrollment)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="bg-muted p-4 rounded-full">
                  <Search className="h-8 w-8 opacity-20" />
                </div>
                <p className="font-medium italic text-sm">ไม่พบข้อมูลนักเรียน</p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination Controls (ใช้ร่วมกันทั้งหน้าจอใหญ่และมือถือ) */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t bg-muted/20 gap-4">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              แสดง <span className="font-medium text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> ถึง <span className="font-medium text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)}</span> จากทั้งหมด <span className="font-medium text-foreground">{filteredStudents.length}</span>
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
                <span className="hidden sm:inline">ก่อนหน้า</span>
              </Button>
              <div className="text-sm font-medium px-2 sm:px-4">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-9 px-3 cursor-pointer"
              >
                <span className="hidden sm:inline">ถัดไป</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* Modal ดูรายละเอียดนักเรียน + ประวัติการเรียน (รวมร่าง) */}
      {/* ==================================================== */}
      {detailModalStudent && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col animate-in zoom-in-95 duration-200 border max-h-[90vh] overflow-hidden relative">
            
            {/* Header (Gradient & Avatar) */}
            <div className="relative bg-gradient-to-r from-blue-600 to-cyan-500 pt-12 pb-14 px-6 text-center text-white shrink-0">
              <button 
                onClick={() => setDetailModalStudent(null)} 
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
              
              {/* Avatar Placeholder */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full p-1 shadow-lg border-4 border-white z-10">
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-blue-600">
                  {detailModalStudent.firstName?.charAt(0) || "-"}
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-1">
                {detailModalStudent.prefixName} {detailModalStudent.firstName} {detailModalStudent.lastName}
              </h2>
              <div className="flex justify-center gap-4 text-blue-100 text-sm">
                <span>รหัสนักเรียน: {detailModalStudent.studentCode || "-"}</span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="pt-14 px-6 bg-white border-b flex gap-6 shrink-0 justify-center sm:justify-start">
              <button 
                onClick={() => setViewTab("info")}
                className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
                  viewTab === "info" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
                } flex items-center gap-2 cursor-pointer`}
              >
                <UserSquare className="w-4 h-4" /> ข้อมูลทั่วไป
              </button>
              <button 
                onClick={() => setViewTab("history")}
                className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
                  viewTab === "history" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
                } flex items-center gap-2 cursor-pointer`}
              >
                <History className="w-4 h-4" /> ประวัติการเรียน
              </button>
            </div>

            {/* Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto bg-slate-50/80 p-4 sm:p-6">
              
              {/* === TAB 1: ข้อมูลส่วนตัว === */}
              {viewTab === "info" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in duration-300">
                  {/* ข้อมูลส่วนตัว */}
                  <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                      <UserSquare className="w-5 h-5 text-blue-500" />
                      ข้อมูลส่วนตัว
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4"/> เลขบัตร ปชช.</span>
                        <span className="font-medium text-slate-900">{detailModalStudent.codeCitizen || "-"}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4"/> วันเกิด</span>
                        <span className="font-medium text-slate-900">
                          {detailModalStudent.birthDate ? new Date(detailModalStudent.birthDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : "-"}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-slate-500 flex items-center gap-2"><Droplet className="w-4 h-4"/> กรุ๊ปเลือด</span>
                        <span className="font-medium text-slate-900">{detailModalStudent.bloodType || "-"}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-slate-500">ศาสนา</span>
                        <span className="font-medium text-slate-900">{detailModalStudent.religion || "-"}</span>
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลติดต่อ */}
                  <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                      <Contact className="w-5 h-5 text-cyan-500" />
                      ข้อมูลติดต่อ
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 flex items-center gap-2"><Phone className="w-4 h-4"/> เบอร์โทรศัพท์นักเรียน</span>
                        <span className="font-medium text-slate-900 sm:ml-6">{detailModalStudent.phone || "-"}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4"/> ที่อยู่ปัจจุบัน</span>
                        <span className="font-medium text-slate-900 sm:ml-6 leading-relaxed bg-slate-50 p-2 rounded-md">
                          {detailModalStudent.address || "ไม่มีข้อมูลที่อยู่"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ข้อมูลผู้ปกครอง */}
                  <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4 md:col-span-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                      <Users className="w-5 h-5 text-indigo-500" />
                      ข้อมูลผู้ปกครอง
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                        <p className="text-slate-500 mb-1 text-xs font-semibold">ชื่อบิดา</p>
                        <p className="font-medium text-slate-900">{detailModalStudent.fatherName || "-"}</p>
                        <p className="text-slate-500 mt-1 flex items-center gap-1"><Phone className="w-3 h-3"/> {detailModalStudent.fatherPhone || "-"}</p>
                      </div>
                      <div className="bg-pink-50/50 p-3 rounded-lg border border-pink-100/50">
                        <p className="text-slate-500 mb-1 text-xs font-semibold">ชื่อมารดา</p>
                        <p className="font-medium text-slate-900">{detailModalStudent.motherName || "-"}</p>
                        <p className="text-slate-500 mt-1 flex items-center gap-1"><Phone className="w-3 h-3"/> {detailModalStudent.motherPhone || "-"}</p>
                      </div>
                      <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50">
                        <p className="text-slate-500 mb-1 text-xs font-semibold flex items-center gap-1">ผู้ปกครอง <span className="bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded text-[10px]">{detailModalStudent.guardianRelation || "ไม่ระบุความเกี่ยวข้อง"}</span></p>
                        <p className="font-medium text-slate-900">{detailModalStudent.guardianName || "-"}</p>
                        <p className="text-slate-500 mt-1 flex items-center gap-1"><Phone className="w-3 h-3"/> {detailModalStudent.guardianPhone || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 2: ประวัติการเรียน === */}
              {viewTab === "history" && (
                <div className="animate-in fade-in duration-300">
                  {detailModalStudent.enrollments && detailModalStudent.enrollments.length > 0 ? (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                      {/* เรียงปีล่าสุดขึ้นก่อน */}
                      {[...detailModalStudent.enrollments]
                        .sort((a, b) => b.academicYearId - a.academicYearId)
                        .map((enrollment: any, idx: number) => {
                          const yearObj = academicYears.find(y => y.id === enrollment.academicYearId);
                          return (
                            <div key={enrollment.id || idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-indigo-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ml-[3px] md:ml-0 z-10"></div>
                              <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] bg-white border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-indigo-600 text-sm bg-indigo-50 px-2 py-1 rounded">ปีการศึกษา {yearObj?.year || "ไม่ทราบปี"}</span>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
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
                                      size="sm" 
                                      onClick={() => handleDeleteEnrollment(enrollment.id, yearObj?.year || "ไม่ทราบปี")}
                                      className="h-8 sm:h-7 w-auto sm:w-7 px-2 sm:px-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg sm:rounded-full cursor-pointer self-end sm:self-auto flex items-center gap-1"
                                      title="ลบข้อมูลปีการศึกษานี้"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span className="text-xs sm:hidden">ลบประวัติ</span>
                                    </Button>
                                  )}
                                </div>
                                <div className="text-base font-medium text-foreground">
                                  ชั้น {enrollment.classLevel} {enrollment.classRoom ? `/ ${enrollment.classRoom}` : ""}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1 flex justify-between">
                                  <span>เลขที่ประจำชั้น: {enrollment.studentNumber || "ยังไม่ระบุ"}</span>
                                </div>
                                {/* แสดงข้อมูลเพิ่มเติมถ้าย้ายออก */}
                                {enrollment.status === 'ย้ายออก' && (enrollment.transferOutDate || enrollment.transferToSchool) && (
                                  <div className="mt-3 pt-3 border-t border-orange-100 bg-orange-50/50 p-3 rounded-lg text-[12px] text-orange-700 dark:text-orange-500">
                                    {enrollment.transferOutDate && <div className="font-medium mb-1">ย้ายเมื่อ: {new Date(enrollment.transferOutDate).toLocaleDateString('th-TH')}</div>}
                                    {enrollment.transferToSchool && <div>โรงเรียนปลายทาง: <span className="font-medium">{enrollment.transferToSchool}</span></div>}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground bg-white rounded-xl border shadow-sm">
                      <History className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="italic">ยังไม่มีประวัติการเข้าเรียนในระบบ</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t bg-white flex justify-end shrink-0">
              <Button onClick={() => setDetailModalStudent(null)} className="cursor-pointer px-6 w-full sm:w-auto">
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* ==================================================== */}

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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
          <div className="bg-background sm:rounded-2xl shadow-2xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-4xl flex flex-col animate-in zoom-in-95 duration-200 border">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-muted/20">
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
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
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