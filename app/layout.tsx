import type { Metadata } from "next";
import { Anuphan, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

// ✅ เพิ่มการตั้งค่า metadata ตรงนี้ และใส่ URL รูปภาพได้เลยครับ
export const metadata: Metadata = {
  title: "ไทยงามธุรการ", // เปลี่ยนเป็นชื่อเว็บคุณ
  description: "รายละเอียดเว็บไซต์...",
  icons: {
    icon: "https://res.cloudinary.com/gukkghu/image/upload/q_auto/f_auto/v1646575846/gukkghu/%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%AD%E0%B8%AD%E0%B8%81%E0%B9%81%E0%B8%9A%E0%B8%9A%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B9%84%E0%B8%A1%E0%B9%88%E0%B8%A1%E0%B8%B5%E0%B8%8A%E0%B8%B7%E0%B9%88%E0%B8%AD_aytvpq.png", // ใส่ URL ไอคอนของคุณตรงนี้
    apple: "https://res.cloudinary.com/gukkghu/image/upload/q_auto/f_auto/v1646575846/gukkghu/%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%AD%E0%B8%AD%E0%B8%81%E0%B9%81%E0%B8%9A%E0%B8%9A%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B9%84%E0%B8%A1%E0%B9%88%E0%B8%A1%E0%B8%B5%E0%B8%8A%E0%B8%B7%E0%B9%88%E0%B8%AD_aytvpq.png", // สำหรับ Apple devices
  },
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const anuphan = Anuphan({
  variable: "--font-anuphan",
  weight: ["400", "500", "600", "700"],
  subsets: ["thai", "latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="th" suppressHydrationWarning>
      {/* เพิ่ม ${inter.variable} เข้าไปในนี้ด้วย */}
      <body className={`${inter.variable} ${anuphan.variable} font-sans antialiased min-w-dvw bg-linear-to-r from-blue-500 to-purple-500`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
