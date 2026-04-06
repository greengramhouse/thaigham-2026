import { getAcademicYears } from "@/app/actions/academic-year";
import AcademicYearManager from "./components/academic-year-manager";

export default async function SettingsPage() {
    const response = await getAcademicYears();
    const academicYears = response.data || [];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">ตั้งค่า</h1>
                <p className="text-muted-foreground">ตั้งค่าระบบ</p>
            </div>

            <div className="max-w-2xl">
                <AcademicYearManager initialData={academicYears} />
            </div>
        </div>
    );
}