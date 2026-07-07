export default function KategoriPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Kategori Barang
        </h1>
        <p className="text-sm text-slate-500">
          Kelola kategori untuk pengelompokan barang
        </p>
      </div>

      {/* Data Table Placeholder */}
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950">
        Tabel kategori akan ditampilkan di sini
      </div>
    </div>
  );
}
