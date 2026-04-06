import { getStudents, getAcademicYears } from "@/app/actions/student";
import EnrollmentManager from "./components/enrollment-manager";

export default async function EnrollmentPage() {
  // ดึงข้อมูลนักเรียนทั้งหมด (เพื่อนำไปค้นหา/จัดห้อง)
  const response = await getStudents();
  const students = response.data || [];

  // ดึงปีการศึกษาทั้งหมด
  const yearResponse = await getAcademicYears();
  const academicYears = yearResponse.data || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">จัดการห้องเรียนและการเลื่อนชั้น</h1>
        <p className="text-muted-foreground">
          จัดนักเรียนเข้าห้องเรียน, ย้ายห้อง, และจัดการเลื่อนชั้นปีการศึกษา
        </p>
      </div>
      
      <EnrollmentManager 
        initialStudents={students} 
        academicYears={academicYears} 
      />
    </div>
  );
}