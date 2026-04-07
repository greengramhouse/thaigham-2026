import StudentTable from "@/app/(admin)/admin/student/components/student-table";
import { getAcademicYears } from "@/app/actions/academic-year";
import { getStudents } from "@/app/actions/student";

export default async function UserStudentTablePage() {
    const response = await getStudents();
    const students = response.data || [];

    // 2. ดึงข้อมูลปีการศึกษา (ตรงนี้แหละครับที่น่าจะหายไป) 👇
    const yearsRes = await getAcademicYears();
    const academicYears = yearsRes.success ? yearsRes.data : [];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">รายชื่อนักเรียน</h1>
                <p className="text-muted-foreground">ดูข้อมูลรายชื่อนักเรียนทั้งหมด</p>
            </div>
            <StudentTable
                initialStudents={students}
                academicYears={academicYears}
                readOnly={true} // ฝั่ง User ให้เป็น true เพื่อซ่อนปุ่มลบ/แก้ไข
            />
        </div>
    );
}
