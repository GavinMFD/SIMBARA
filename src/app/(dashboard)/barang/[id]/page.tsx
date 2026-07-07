export default function DetailBarangPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Detail Barang
        </h1>
        <p className="text-sm text-slate-500">
          Informasi lengkap tentang barang
        </p>
      </div>

      {/* Detail Placeholder */}
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-950">
        Detail barang akan ditampilkan di sini
      </div>
    </div>
  );
}
