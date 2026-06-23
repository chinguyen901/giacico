import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Hệ Thống Quản Lý Sản Xuất | 生產管理系統",
  description: "Web App quản lý sản xuất AV - ND - GV",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="font-sans bg-slate-50 min-h-screen">
        <LangProvider>
          <Navbar />
          <main className="max-w-[1600px] mx-auto px-4 py-6">{children}</main>
        </LangProvider>
      </body>
    </html>
  );
}
