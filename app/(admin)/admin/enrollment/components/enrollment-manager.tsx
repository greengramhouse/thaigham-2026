"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ManualEnrollmentForm from "./manual-enrollment-form";
import BatchPromotion from "./batch-promotion";

interface EnrollmentManagerProps {
  initialStudents: any[];
  academicYears: any[];
}

export default function EnrollmentManager({ initialStudents, academicYears }: EnrollmentManagerProps) {
  // เพื่อความเร็วในการโหลด เราจะ filter เฉพาะนักเรียนที่ยังไม่จบการศึกษา/พ้นสภาพ มาแสดง
  const activeStudents = initialStudents.filter(
    (student) => student.enrollments?.[0]?.status !== "จบการศึกษา" && student.enrollments?.[0]?.status !== "พ้นสภาพ"
  );

  return (
    <Tabs defaultValue="individual" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
        <TabsTrigger value="individual">จัดห้องรายบุคคล</TabsTrigger>
        <TabsTrigger value="batch">เลื่อนชั้นแบบกลุ่ม</TabsTrigger>
      </TabsList>

      <TabsContent value="individual">
        <Card>
          <CardHeader>
            <CardTitle>จัดห้องเรียน / ย้ายห้อง (รายบุคคล)</CardTitle>
            <CardDescription>
              ค้นหานักเรียนที่มีประวัติอยู่แล้ว เพื่อจับคู่กับห้องเรียนในปีการศึกษานั้นๆ
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* โยนข้อมูลไปให้ฟอร์มจัดห้องรายบุคคลจัดการต่อ */}
            <ManualEnrollmentForm
              students={activeStudents} 
              academicYears={academicYears} 
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="batch">
        <Card>
          <CardHeader>
            <CardTitle>ระบบเลื่อนชั้น / จัดห้องกลุ่ม</CardTitle>
            <CardDescription>
              ดึงรายชื่อนักเรียนจากห้องเรียนเดิม เพื่อเลื่อนชั้นไปยังห้องเรียนใหม่พร้อมกันทั้งห้อง
            </CardDescription>
          </CardHeader>
          {/* แก้ไขตรงนี้: เอา className ที่ล็อกความสูง h-[400px] ออกไปแล้ว */}
          <CardContent>
            <BatchPromotion students={activeStudents} academicYears={academicYears} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}