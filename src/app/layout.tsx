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
    default: "SIPANDAI - Sistem Informasi Pemantauan dan Tindak Lanjut Administrasi Internal",
    template: "%s | SIPANDAI",
  },
  description:
    "Sistem Informasi Pemantauan dan Tindak Lanjut Administrasi Internal - Aplikasi pengelolaan aset dan barang milik negara",
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
