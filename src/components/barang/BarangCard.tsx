import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Barang } from "@/types";

interface BarangCardProps {
  barang: Barang;
  onClick?: () => void;
}

export default function BarangCard({ barang, onClick }: BarangCardProps) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950">
          <Package size={18} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base">{barang.namaBarang}</CardTitle>
          <p className="font-mono text-xs text-slate-500">
            {barang.kodeBarang}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            {barang.kategori?.nama ?? "—"}
          </span>
          <Badge variant="secondary">{barang.kondisi.replace("_", " ")}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
