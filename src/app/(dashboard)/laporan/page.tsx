import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LaporanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Laporan
        </h1>
        <p className="text-sm text-slate-500">
          Buat dan unduh laporan barang inventaris
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laporan Daftar Barang</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-500">
              Laporan lengkap seluruh barang inventaris
            </p>
            <Button variant="outline" size="sm">
              <FileDown size={16} className="mr-2" />
              Export PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laporan per Ruangan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-500">
              Laporan barang berdasarkan lokasi ruangan
            </p>
            <Button variant="outline" size="sm">
              <FileDown size={16} className="mr-2" />
              Export Excel
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Laporan Mutasi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-500">
              Riwayat perpindahan barang antar ruangan
            </p>
            <Button variant="outline" size="sm">
              <FileDown size={16} className="mr-2" />
              Export PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
