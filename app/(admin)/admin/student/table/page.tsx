import { getStudents, getAcademicYears } from "@/app/actions/student";
import StudentTable from "../components/Student-table";

export default async function StudentTablePage() {
    // ดึงข้อมูลนักเรียน
    const response = await getStudents();
    const students = response.data || [];

    // ดึงข้อมูลปีการศึกษาทั้งหมด (เพิ่มใหม่)
    const yearResponse = await getAcademicYears();
    const academicYears = yearResponse.data || [];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">นักเรียน</h1>
                <p className="text-muted-foreground">จัดการข้อมูลนักเรียน (เพิ่ม, แก้ไข, ลบ)</p>
            </div>
            {/* ส่ง academicYears เข้าไปใน Table ด้วย */}
            <StudentTable initialStudents={students} academicYears={academicYears} />
        </div>
    );
}