"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Barang } from "@/types";

interface BarangTableProps {
  data: Barang[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const kondisiColor: Record<string, string> = {
  BAIK: "bg-green-100 text-green-700",
  KURANG_BAIK: "bg-yellow-100 text-yellow-700",
  RUSAK_BERAT: "bg-red-100 text-red-700",
  TIDAK_DITEMUKAN: "bg-slate-100 text-slate-700",
};

export default function BarangTable({
  data,
  onEdit,
  onDelete,
}: BarangTableProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode</TableHead>
            <TableHead>Nama Barang</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Ruangan</TableHead>
            <TableHead>Kondisi</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-slate-400">
                Belum ada data barang
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">
                  {item.kodeBarang}
                </TableCell>
                <TableCell className="font-medium">{item.namaBarang}</TableCell>
                <TableCell>{item.kategori?.nama ?? "-"}</TableCell>
                <TableCell>{item.ruangan?.nama ?? "-"}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={kondisiColor[item.kondisi]}
                  >
                    {item.kondisi.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{item.jumlah}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item.id)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
