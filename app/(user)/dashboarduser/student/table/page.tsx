import StudentTable from "@/app/(admin)/admin/student/components/student-table";
import { getStudents } from "@/app/actions/student";

export default async function UserStudentTablePage() {
    const response = await getStudents();
    const students = response.data || [];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">รายชื่อนักเรียน</h1>
                <p className="text-muted-foreground">ดูข้อมูลรายชื่อนักเรียนทั้งหมด</p>
            </div>
            <StudentTable initialStudents={students} readOnly={true} />
        </div>
    );
}
