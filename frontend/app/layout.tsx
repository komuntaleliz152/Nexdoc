import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "NexDoc — Brand-Aware AI Document Generator",
  description: "Generate brand-aware documents in PDF, DOCX, PPTX and Excel using AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#f4f6f9]">{children}</body>
    </html>
  );
}
