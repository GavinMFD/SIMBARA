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

interface MutasiFormProps {
  onSubmit?: (data: Record<string, unknown>) => void;
}

export default function MutasiForm({ onSubmit }: MutasiFormProps) {
  return (
    <form className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Barang */}
        <div className="space-y-2">
          <Label>Barang</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pilih barang" />
            </SelectTrigger>
            <SelectContent>
              {/* Populated dynamically */}
            </SelectContent>
          </Select>
        </div>

        {/* Tanggal Mutasi */}
        <div className="space-y-2">
          <Label htmlFor="tanggalMutasi">Tanggal Mutasi</Label>
          <Input id="tanggalMutasi" type="date" />
        </div>

        {/* Ruangan Asal */}
        <div className="space-y-2">
          <Label>Ruangan Asal</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pilih ruangan asal" />
            </SelectTrigger>
            <SelectContent>
              {/* Populated dynamically */}
            </SelectContent>
          </Select>
        </div>

        {/* Ruangan Tujuan */}
        <div className="space-y-2">
          <Label>Ruangan Tujuan</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pilih ruangan tujuan" />
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
        <Textarea
          id="keterangan"
          placeholder="Alasan mutasi (opsional)"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit">Simpan Mutasi</Button>
        <Button type="button" variant="outline">
          Batal
        </Button>
      </div>
    </form>
  );
}
