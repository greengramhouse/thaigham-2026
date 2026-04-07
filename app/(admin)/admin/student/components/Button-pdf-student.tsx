"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Printer, FileText, X } from "lucide-react";

/** * ปลดคอมเมนต์ด้านล่างนี้เมื่อนำไปใช้ในโปรเจกต์จริง 
 * ตรวจสอบ Path ของ font.js และ urlImage.js ให้ถูกต้องตามโครงสร้างของคุณด้วยนะครับ
 */
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import pdfFontsConfig from "@/lib/pdffont/fontconfig";

interface ButtonPdfStudentProps {
  filteredStudents: any[];
  selectedClass?: string;
  selectedYear?: string;
  selectedStatus?: string; // ✅ เพิ่มการรับค่า selectedStatus ตรงนี้
}

const ButtonPdfStudent = ({ filteredStudents, selectedClass, selectedYear, selectedStatus }: ButtonPdfStudentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [title2, setTitle2] = useState("");
  const [useThaiNumerals, setUseThaiNumerals] = useState(false);
  const [showClassInfo, setShowClassInfo] = useState(true);
  const [colCount, setColCount] = useState(0);
  const [colNames, setColNames] = useState<string[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [pageOrientation, setPageOrientation] = useState("portrait");

  // ฟังก์ชันช่วยดึงข้อมูล Enrollment สำหรับจัดรูปแบบข้อมูล
  const getEnrollment = (student: any, targetYear: string) => {
    if (!student.enrollments || student.enrollments.length === 0) return null;
    if (targetYear === "all") return student.enrollments[0]; 
    return student.enrollments.find((e: any) => String(e.academicYearId) === targetYear) || null;
  };

  // ✅ กรองนักเรียนที่จะนำไปสร้าง PDF ให้ฉลาดขึ้น
  const studentCurrent = filteredStudents.filter((student: any) => {
    // ถ้าผู้ใช้จงใจกรองสถานะเฉพาะเจาะจง (เช่น ย้ายออก, พ้นสภาพ) ก็ให้พิมพ์ตามนั้นเลย
    if (selectedStatus && selectedStatus !== "all") {
      return true;
    }
    // แต่ถ้าเป็น "ทุกสถานะ" ค่าเริ่มต้นควรจะพิมพ์แค่เด็กที่ "กำลังศึกษา" เพื่อไม่ให้ใบเช็คชื่อรก
    const enrollment = getEnrollment(student, selectedYear || "all");
    return enrollment?.status === "กำลังศึกษา";
  });

  useEffect(() => {
    const baseColumns = [
      { name: "ลำดับ", key: "index", checked: true },
      { name: "เลขประจำตัว", key: "student_number", checked: true },
      { name: "เลขบัตร ปชช.", key: "code_citizen", checked: true },
      { name: "ชื่อ - นามสกุล", key: "fullname", checked: true },
    ];
    const customColumns = colNames.map((n, i) => ({
      name: n || `คอลัมน์ ${i + 1}`,
      key: `custom_${i}`,
      checked: true,
    }));
    setColumns([...baseColumns, ...customColumns]);
  }, [colNames]);

  const convertToThai = (text: any) => {
    if (!text) return "";
    if (!useThaiNumerals) return text.toString();
    const thaiNums = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
    return text.toString().replace(/\d/g, (match: any) => thaiNums[match]);
  };

  const generatePDF = () => {
    const filteredColumns = columns.filter((c) => c.checked);

    const tableHeader = filteredColumns.map((c) => ({
      text: convertToThai(c.name),
      bold: true,
      style: "tableHeader",
      alignment: "center",
    }));

    const tableBody = [
      tableHeader,
      ...studentCurrent.map((s: any, i: number) => {
        const row: any[] = [];
        const enrollment = getEnrollment(s, selectedYear || "all");

        filteredColumns.forEach((c) => {
          switch (c.key) {
            case "index":
              row.push({ text: convertToThai(i + 1), alignment: "center" });
              break;
            case "student_number":
              row.push({ text: convertToThai(enrollment?.studentNumber || s.studentCode || "-"), alignment: "center" });
              break;
            case "code_citizen":
              row.push({ text: convertToThai(s.codeCitizen || "-"), alignment: "center" });
              break;
            case "fullname":
              row.push({
                text: convertToThai(`${s.prefixName || ""} ${s.firstName || ""} ${s.lastName || ""}`),
                alignment: "left",
              });
              break;
            default:
              row.push({ text: "" });
          }
        });
        return row;
      }),
    ];

    let topMargin = 100;
    if (showClassInfo) topMargin += 20;
    if (title) topMargin += 20;
    if (title2) topMargin += 20;
    if (selectedStatus && selectedStatus !== "all") topMargin += 20; // เผื่อที่ให้ข้อความสถานะบนหัวกระดาษ

    // คำนวณชื่อชั้นเรียนและห้อง
    const displayLevel = !selectedClass || selectedClass === "all" ? "ทุกระดับชั้น" : selectedClass.split(" / ")[0];
    const displayRoom = !selectedClass || selectedClass === "all" ? "ทุกห้อง" : (selectedClass.split(" / ")[1] || "รวม");

    const docDefinition: any = {
      pageMargins: [30, topMargin, 20, 20],
      pageOrientation: pageOrientation,
      images: { logo: "https://res.cloudinary.com/gukkghu/image/upload/v1646575846/gukkghu/%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%AD%E0%B8%AD%E0%B8%81%E0%B9%81%E0%B8%9A%E0%B8%9A%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B9%84%E0%B8%A1%E0%B9%88%E0%B8%A1%E0%B8%B5%E0%B8%8A%E0%B8%B7%E0%B9%88%E0%B8%AD_aytvpq.png" }, // ปลดคอมเมนต์ในงานจริง
      header: function () {
        return {
          margin: [0, 15, 0, 0],
          stack: [
            {
              image: "logo",
              fit: [80, 80],
              alignment: "center",
            },
            {
              text: convertToThai("โรงเรียนชุมชนวัดไทยงาม"),
              style: "header",
              alignment: "center",
              margin: [0, 5, 0, 0],
            },
            showClassInfo
              ? {
                  text: convertToThai(`ใบรายชื่อนักเรียน : ${displayLevel} / ${displayRoom}`),
                  style: "header",
                  alignment: "center",
                  margin: [0, 5, 0, 0], // ลดขอบล่างลงนิดนึง
                }
              : null,
            // ✅ เพิ่มวงเล็บสถานะให้บน PDF ทันที ถ้าเลือกสถานะอื่นๆ เช่น (สถานะ: ย้ายออก)
            selectedStatus && selectedStatus !== "all"
              ? {
                  text: convertToThai(`(สถานะ: ${selectedStatus})`),
                  style: "header",
                  alignment: "center",
                  color: "gray",
                  margin: [0, 0, 0, 5],
                }
              : { text: "", margin: [0, 0, 0, 5] },
            title ? { text: convertToThai(title), style: "header", alignment: "center" } : null,
            title2 ? { text: convertToThai(title2), style: "header", alignment: "center" } : null,
          ].filter(Boolean),
        };
      },
      content: [
        {
          table: {
            headerRows: 1,
            widths: filteredColumns.map((c) => {
              if (["index", "student_number", "code_citizen"].includes(c.key)) return "auto";
              if (c.key === "fullname") return "*";
              return 80;
            }),
            body: tableBody,
          },
        },
      ],
      defaultStyle: { lineHeight: 1, font: "THSarabunNew", fontSize: 14 },
      styles: {
        tableHeader: {
          fontSize: 8,
          font: "THSarabunNew",
          alignment: "center",
          margin: [0, 5, 0, 5],
        },
        header: { bold: true, fontSize: 11, margin: [0, 0, 0, 3] },
      },
    };

    try {
      // --- ปลดคอมเมนต์เพื่อใช้งาน pdfmake ในโปรเจกต์จริง ---
      // @ts-ignore
      pdfMake.vfs = pdfFonts.vfs;
      // @ts-ignore
      pdfMake.fonts = pdfFontsConfig;
      // @ts-ignore
      pdfMake.createPdf(docDefinition).open();
      

      // จำลองการสำเร็จใน Preview หากยังไม่ได้ลงไลบรารี
      toast.success("กดสร้าง PDF (ปลดคอมเมนต์คำสั่ง pdfmake ในโค้ดเพื่อเปิดไฟล์จริง)");
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  const handleColCountChange = (e: any) => {
    let count = parseInt(e.target.value) || 0;
    if (count > 4) count = 4;
    setColCount(count);
    setColNames(Array(count).fill(""));
  };

  const handleColNameChange = (index: number, value: string) => {
    const newCols = [...colNames];
    newCols[index] = value;
    setColNames(newCols);
  };

  const handleRemoveCol = (index: number) => {
    const newCols = [...colNames];
    newCols.splice(index, 1);
    setColNames(newCols);
    setColCount(newCols.length);
  };

  const toggleColumn = (index: number) => {
    const newCols = [...columns];
    newCols[index].checked = !newCols[index].checked;
    setColumns(newCols);
  };

  return (
    <>
      <Button
        variant="outline"
        className="cursor-pointer border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 h-11"
        onClick={() => setIsOpen(true)}
      >
        <Printer className="mr-2 h-4 w-4" />
        พิมพ์รายชื่อ
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-foreground">
                ตั้งค่าคอลัมน์และ PDF
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xl transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                <input
                  type="checkbox"
                  id="showClassInfo"
                  checked={showClassInfo}
                  onChange={(e) => setShowClassInfo(e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="showClassInfo" className="text-sm font-medium text-blue-900 dark:text-blue-200 cursor-pointer select-none">
                  แสดงบรรทัด "ใบรายชื่อนักเรียน : ระดับชั้น / ห้อง"
                </label>
              </div>

              <div className="flex items-center gap-2 p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900">
                <input
                  type="checkbox"
                  id="thaiNumerals"
                  checked={useThaiNumerals}
                  onChange={(e) => setUseThaiNumerals(e.target.checked)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="thaiNumerals" className="text-sm font-medium text-purple-900 dark:text-purple-200 cursor-pointer select-none">
                  เปลี่ยนตัวเลขทั้งหมดให้เป็นเลขไทย (๑, ๒, ๓...)
                </label>
              </div>

              <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900">
                <label className="block text-sm font-medium text-green-900 dark:text-green-200 mb-2">
                  ทิศทางกระดาษ
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="orientation"
                      value="portrait"
                      checked={pageOrientation === "portrait"}
                      onChange={(e) => setPageOrientation(e.target.value)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm text-green-900 dark:text-green-200 select-none">แนวตั้ง (Portrait)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="orientation"
                      value="landscape"
                      checked={pageOrientation === "landscape"}
                      onChange={(e) => setPageOrientation(e.target.value)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm text-green-900 dark:text-green-200 select-none">แนวนอน (Landscape)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mt-2">
                  หัวตารางบรรทัดที่ 1 (ตัวเลือกเสริม)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="กรอกข้อความที่ต้องการ"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  หัวตารางบรรทัดที่ 2 (ตัวเลือกเสริม)
                </label>
                <input
                  type="text"
                  value={title2}
                  onChange={(e) => setTitle2(e.target.value)}
                  placeholder="กรอกข้อความที่ต้องการ"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                />
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-foreground">
                  จำนวนคอลัมน์ที่เพิ่มเอง (สูงสุด 4)
                </label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={colCount}
                  onChange={handleColCountChange}
                  className="mt-1 w-20 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                />
              </div>

              {colNames.map((name, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleColNameChange(index, e.target.value)}
                    placeholder={`ชื่อคอลัมน์ ${index + 1}`}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                  />
                  <button
                    onClick={() => handleRemoveCol(index)}
                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-500 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              <div className="mt-4 border-t pt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  เลือกคอลัมน์ที่ต้องการพิมพ์
                </label>
                <div className="space-y-1 max-h-40 overflow-auto border rounded-lg bg-muted/20 p-3 shadow-inner">
                  {columns.map((col, idx) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={col.checked}
                        onChange={() => toggleColumn(idx)}
                        className="rounded h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 cursor-pointer"
                      />
                      <span className="text-sm font-medium select-none">{col.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto cursor-pointer"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={() => {
                  generatePDF();
                  setIsOpen(false);
                }}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" /> สร้าง PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ButtonPdfStudent;