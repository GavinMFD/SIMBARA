export default function RuanganPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Data Ruangan
        </h1>
        <p className="text-sm text-slate-500">
          Kelola data ruangan untuk penempatan barang
        </p>
      </div>

      {/* Data Table Placeholder */}
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950">
        Tabel ruangan akan ditampilkan di sini
      </div>
    </div>
  );
}
