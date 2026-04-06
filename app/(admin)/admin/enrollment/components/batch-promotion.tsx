"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowRight, Search, Users, CheckSquare, Save } from "lucide-react";
import { promoteStudentsGroup } from "@/app/actions/student";


const CLASS_LEVELS = [
  "อ.1", "อ.2", "อ.3",
  "ป.1", "ป.2", "ป.3", "ป.4", "ป.5", "ป.6",
  "ม.1", "ม.2", "ม.3", "ม.4", "ม.5", "ม.6",
];

interface BatchPromotionProps {
  academicYears?: any[];
  students?: any[];
}

export default function BatchPromotion({
  academicYears = [],
  students = [],
}: BatchPromotionProps) {
  // === Source (ต้นทาง) ===
  const [sourceYearId, setSourceYearId] = useState("");
  const [sourceLevel, setSourceLevel] = useState("");
  const [sourceRoom, setSourceRoom] = useState("");

  // === Target (ปลายทาง) ===
  const [targetYearId, setTargetYearId] = useState(() => {
    const active = academicYears.find((y) => y.isActive);
    return active ? String(active.id) : "";
  });
  const [targetLevel, setTargetLevel] = useState("");
  const [targetRoom, setTargetRoom] = useState("");

  // === State การดึงข้อมูลและเลือกนักเรียน ===
  const [fetchedStudents, setFetchedStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // ค้นหานักเรียนใน Client-side (เพราะ parent component ดึงข้อมูลมาเผื่อไว้หมดแล้ว)
  const handleSearchStudents = () => {
    if (!sourceYearId || !sourceLevel || !sourceRoom) {
      toast.error("กรุณาระบุข้อมูลต้นทางให้ครบถ้วน");
      return;
    }

    const filtered = students.filter((student) => {
      const currentEnrollment = student.enrollments?.[0];
      if (!currentEnrollment) return false;
      
      return (
        String(currentEnrollment.academicYearId) === sourceYearId &&
        currentEnrollment.classLevel === sourceLevel &&
        String(currentEnrollment.classRoom) === sourceRoom
      );
    });

    setFetchedStudents(filtered);
    // เลือกนักเรียนทั้งหมดโดยปริยาย (Default checked)
    setSelectedStudentIds(filtered.map((s) => s.id));
    setHasSearched(true);
    
    if (filtered.length === 0) {
      toast.info("ไม่พบนักเรียนในห้องเรียนที่ระบุ");
    } else {
      toast.success(`พบนักเรียนทั้งหมด ${filtered.length} คน`);
    }
  };

  const handleToggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleAll = () => {
    if (selectedStudentIds.length === fetchedStudents.length) {
      setSelectedStudentIds([]); // ยกเลิกทั้งหมด
    } else {
      setSelectedStudentIds(fetchedStudents.map((s) => s.id)); // เลือกทั้งหมด
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) {
      toast.error("กรุณาเลือกนักเรียนอย่างน้อย 1 คน");
      return;
    }
    if (!targetYearId || !targetLevel || !targetRoom) {
      toast.error("กรุณาระบุข้อมูลปลายทางให้ครบถ้วน");
      return;
    }

    setIsPending(true);
    try {
      const res = await promoteStudentsGroup({
        studentIds: selectedStudentIds,
        academicYearId: parseInt(targetYearId),
        classLevel: targetLevel,
        classRoom: parseInt(targetRoom),
      });

      if (res.success) {
        toast.success(`เลื่อนชั้นนักเรียน ${res.count} คน สำเร็จ!`);
        
        // ล้างข้อมูลหลังทำเสร็จ
        setFetchedStudents([]);
        setSelectedStudentIds([]);
        setHasSearched(false);
        setSourceRoom("");
        setTargetRoom("");
        setTargetLevel("");
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการเลื่อนชั้น");
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
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* 1. ส่วนเลือกข้อมูลต้นทาง */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="bg-muted/40 px-6 py-4 border-b">
          <h3 className="font-semibold flex items-center gap-2 text-blue-600">
            <Search className="h-5 w-5" />
            1. ค้นหาห้องเรียนเดิม (ต้นทาง)
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">ปีการศึกษาเดิม</Label>
            <select
              value={sourceYearId}
              onChange={(e) => setSourceYearId(e.target.value)}
              className={selectClass}
            >
              <option value="">เลือกปีการศึกษา</option>
              {academicYears.map((y) => (
                <option key={y.id} value={y.id}>{y.year}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">ระดับชั้นเดิม</Label>
            <select
              value={sourceLevel}
              onChange={(e) => setSourceLevel(e.target.value)}
              className={selectClass}
            >
              <option value="">เลือกชั้น</option>
              {CLASS_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">ห้องเดิม</Label>
            <Input
              type="number"
              min={1}
              value={sourceRoom}
              onChange={(e) => setSourceRoom(e.target.value)}
              placeholder="เช่น 1"
            />
          </div>
          <Button 
            type="button" 
            onClick={handleSearchStudents}
            className="w-full"
            variant="secondary"
          >
            ดึงรายชื่อ
          </Button>
        </div>
      </div>

      {/* 2. แสดงรายชื่อ และ ส่วนปลายทาง (แสดงก็ต่อเมื่อกดค้นหาแล้ว) */}
      {hasSearched && (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* รายชื่อนักเรียน */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="bg-muted/40 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-muted-foreground" />
                2. เลือกนักเรียนที่จะเลื่อนชั้น
              </h3>
              <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                เลือกแล้ว {selectedStudentIds.length} / {fetchedStudents.length} คน
              </span>
            </div>
            
            <div className="p-0">
              {fetchedStudents.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/20 sticky top-0 backdrop-blur-sm shadow-sm z-10">
                      <tr>
                        <th className="px-6 py-3 font-medium text-muted-foreground w-16">
                          <button
                            type="button"
                            onClick={handleToggleAll}
                            className="text-primary hover:underline focus:outline-none flex items-center gap-1"
                          >
                            <CheckSquare className="h-4 w-4" />
                          </button>
                        </th>
                        <th className="px-6 py-3 font-medium text-muted-foreground">รหัสนักเรียน</th>
                        <th className="px-6 py-3 font-medium text-muted-foreground">ชื่อ - นามสกุล</th>
                        <th className="px-6 py-3 font-medium text-muted-foreground">เลขที่เดิม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {fetchedStudents.map((student) => {
                        const isSelected = selectedStudentIds.includes(student.id);
                        return (
                          <tr 
                            key={student.id} 
                            onClick={() => handleToggleStudent(student.id)}
                            className={`cursor-pointer transition-colors hover:bg-muted/30 ${isSelected ? 'bg-primary/[0.02]' : ''}`}
                          >
                            <td className="px-6 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}} // Handle ใน onClick ของ tr แล้ว
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                              />
                            </td>
                            <td className="px-6 py-3">{student.studentCode || "-"}</td>
                            <td className="px-6 py-3 font-medium">
                              {student.prefixName} {student.firstName} {student.lastName}
                            </td>
                            <td className="px-6 py-3 text-muted-foreground">
                              {student.enrollments?.[0]?.studentNumber || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  ไม่มีข้อมูลนักเรียนในห้องที่ระบุ
                </div>
              )}
            </div>
          </div>

          {/* 3. ส่วนปลายทาง */}
          <div className="rounded-xl border border-green-200 bg-green-50/30 dark:bg-green-950/10 dark:border-green-900 shadow-sm overflow-hidden">
            <div className="bg-green-100/50 dark:bg-green-900/20 px-6 py-4 border-b border-green-100 dark:border-green-900">
              <h3 className="font-semibold flex items-center gap-2 text-green-700 dark:text-green-500">
                <ArrowRight className="h-5 w-5" />
                3. ระบุห้องเรียนใหม่ (ปลายทาง)
              </h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-green-700 dark:text-green-500">ปีการศึกษาใหม่</Label>
                <select
                  value={targetYearId}
                  onChange={(e) => setTargetYearId(e.target.value)}
                  className={`${selectClass} border-green-200 focus-visible:ring-green-500`}
                  required
                >
                  <option value="">เลือกปีการศึกษา</option>
                  {academicYears.map((y) => (
                    <option key={y.id} value={y.id}>{y.year} {y.isActive ? " (ปัจจุบัน)" : ""}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-green-700 dark:text-green-500">ระดับชั้นใหม่</Label>
                <select
                  value={targetLevel}
                  onChange={(e) => setTargetLevel(e.target.value)}
                  className={`${selectClass} border-green-200 focus-visible:ring-green-500`}
                  required
                >
                  <option value="">เลือกชั้น</option>
                  {CLASS_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-green-700 dark:text-green-500">ห้องใหม่</Label>
                <Input
                  type="number"
                  min={1}
                  value={targetRoom}
                  onChange={(e) => setTargetRoom(e.target.value)}
                  placeholder="เช่น 1"
                  required
                  className="border-green-200 focus-visible:ring-green-500"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isPending || selectedStudentIds.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                ยืนยันการเลื่อนชั้น
              </Button>
            </div>
            <div className="px-6 pb-4">
              <p className="text-xs text-muted-foreground">
                * หมายเหตุ: ระบบจะล้างเลขที่ประจำชั้น (Student Number) ของนักเรียนกลุ่มนี้ออก เพื่อให้คุณครูประจำชั้นใหม่เป็นคนกำหนดเรียงเลขที่ใหม่อีกครั้ง
              </p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}