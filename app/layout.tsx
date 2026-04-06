import type { Metadata } from "next";
import { Anuphan, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";


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
