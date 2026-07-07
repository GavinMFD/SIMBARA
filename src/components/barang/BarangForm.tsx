"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KondisiBarang } from "@/types";

interface BarangFormProps {
  mode: "tambah" | "edit";
  onSubmit?: (data: Record<string, unknown>) => void;
}

export default function BarangForm({ mode, onSubmit }: BarangFormProps) {
  return (
    <form className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Kode Barang */}
        <div className="space-y-2">
          <Label htmlFor="kodeBarang">Kode Barang</Label>
          <Input id="kodeBarang" placeholder="Contoh: BRG-001" />
        </div>

        {/* Nama Barang */}
        <div className="space-y-2">
          <Label htmlFor="namaBarang">Nama Barang</Label>
          <Input id="namaBarang" placeholder="Nama barang" />
        </div>

        {/* Merek */}
        <div className="space-y-2">
          <Label htmlFor="merek">Merek</Label>
          <Input id="merek" placeholder="Merek barang (opsional)" />
        </div>

        {/* Tahun Perolehan */}
        <div className="space-y-2">
          <Label htmlFor="tahunPerolehan">Tahun Perolehan</Label>
          <Input id="tahunPerolehan" type="number" placeholder="2024" />
        </div>

        {/* Nilai Perolehan */}
        <div className="space-y-2">
          <Label htmlFor="nilaiPerolehan">Nilai Perolehan (Rp)</Label>
          <Input id="nilaiPerolehan" type="number" placeholder="0" />
        </div>

        {/* Jumlah */}
        <div className="space-y-2">
          <Label htmlFor="jumlah">Jumlah</Label>
          <Input id="jumlah" type="number" placeholder="1" defaultValue={1} />
        </div>

        {/* Kondisi */}
        <div className="space-y-2">
          <Label>Kondisi</Label>
          <Select defaultValue={KondisiBarang.BAIK}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kondisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={KondisiBarang.BAIK}>Baik</SelectItem>
              <SelectItem value={KondisiBarang.KURANG_BAIK}>
                Kurang Baik
              </SelectItem>
              <SelectItem value={KondisiBarang.RUSAK_BERAT}>
                Rusak Berat
              </SelectItem>
              <SelectItem value={KondisiBarang.TIDAK_DITEMUKAN}>
                Tidak Ditemukan
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Kategori */}
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {/* Populated dynamically */}
            </SelectContent>
          </Select>
        </div>

        {/* Ruangan */}
        <div className="space-y-2">
          <Label>Ruangan</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pilih ruangan" />
            </SelectTrigger>
            <SelectContent>
              {/* Populated dynamically */}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Keterangan */}
      <div className="space-y-2">
        <Label htmlFor="keterangan">Keterangan</Label>
        <Textarea id="keterangan" placeholder="Catatan tambahan (opsional)" />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit">
          {mode === "tambah" ? "Simpan Barang" : "Update Barang"}
        </Button>
        <Button type="button" variant="outline">
          Batal
        </Button>
      </div>
    </form>
  );
}
