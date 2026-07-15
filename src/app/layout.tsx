import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SIMBARA - Sistem Informasi Manajemen Barang",
    template: "%s | SIMBARA",
  },
  description:
    "Sistem Informasi Manajemen Barang - Aplikasi pengelolaan aset dan barang milik negara",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("h-full", "antialiased", "dark", inter.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
