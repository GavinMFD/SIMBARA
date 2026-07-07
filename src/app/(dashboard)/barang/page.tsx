import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BarangPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Daftar Barang
          </h1>
          <p className="text-sm text-slate-500">
            Kelola semua data barang inventaris
          </p>
        </div>
        <Link href="/barang/tambah">
          <Button>
            <Plus size={16} className="mr-2" />
            Tambah Barang
          </Button>
        </Link>
      </div>

      {/* Data Table Placeholder */}
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950">
        Tabel data barang akan ditampilkan di sini
      </div>
    </div>
  );
}
