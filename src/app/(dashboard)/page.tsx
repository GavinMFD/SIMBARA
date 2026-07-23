"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  ArrowUpRight,
  Monitor,
  Activity,
  Zap,
  Truck,
  Laptop,
  Plus,
  ArrowRightLeft,
  PlusCircle,
  Printer,
  ChevronRight,
  ArrowDownToLine,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"yearly" | "monthly" | "weekly">("yearly");
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [isLoadingLowStock, setIsLoadingLowStock] = useState(true);

  useEffect(() => {
    async function fetchLowStock() {
      try {
        const res = await fetch("/api/master-barang?lowStockOnly=true");
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setLowStockItems(json.data);
          }
        }
      } catch (e) {
        console.error("Error fetching low stock:", e);
      } finally {
        setIsLoadingLowStock(false);
      }
    }
    fetchLowStock();
  }, []);

  const stats = [
    {
      title: "TOTAL INVENTORY",
      value: "1,240",
      change: "+12% vs last month",
      changeType: "up",
      icon: Package,
      iconBg: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    },
    {
      title: "OUTGOING ITEMS",
      value: "482",
      change: "-5% vs last month",
      changeType: "down",
      icon: ArrowUpRight,
      iconBg: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    },
    {
      title: "PHYSICAL ASSETS",
      value: "2,150",
      change: "Stable this period",
      changeType: "neutral",
      icon: Monitor,
      iconBg: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {!isLoadingLowStock && lowStockItems.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
            <AlertTriangle className="text-red-500" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-red-500 font-bold text-sm mb-1">
              PERHATIAN: {lowStockItems.length} Barang Mencapai Batas Minimum Stok
            </h3>
            <p className="text-red-400/80 text-xs font-medium mb-3">
              Segera lakukan reorder untuk item berikut agar operasional tidak terganggu.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex flex-col bg-red-500/5 border border-red-500/10 rounded-lg p-2.5">
                  <span className="text-slate-300 font-semibold text-xs truncate" title={item.namaBarang}>{item.namaBarang}</span>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[10px] text-slate-500">Sisa Stok:</span>
                    <span className="text-xs font-bold text-red-400">{item.totalStok} {item.satuan}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Section / Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-[#071829] border-border hover:border-blue-500/25 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-500">
                {stat.title}
              </span>
              <div className={`rounded-lg p-2 ${stat.iconBg}`}>
                <stat.icon size={18} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {stat.value}
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs font-semibold">
                {stat.changeType === "up" && (
                  <>
                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="text-emerald-400">{stat.change}</span>
                  </>
                )}
                {stat.changeType === "down" && (
                  <>
                    <svg className="w-3 h-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="text-orange-400">{stat.change}</span>
                  </>
                )}
                {stat.changeType === "neutral" && (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                    <span className="text-slate-400 pl-1">{stat.change}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* System Status Card */}
        <Card className="bg-[#071829] border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              System Status
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-white tracking-tight">
              Asset Health
            </div>
            <div className="flex items-center gap-3 mt-3">
              {/* Fake user badges */}
              <div className="flex -space-x-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white uppercase border border-[#071829]">
                  SY
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-[8px] font-bold text-white uppercase border border-[#071829]">
                  DB
                </span>
              </div>
              {/* Progress bar */}
              <div className="flex-1">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: "94%" }}></div>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">94%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Chart & Inventory IQ */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Chart Card */}
        <Card className="bg-[#071829] border-border lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white">Aktivitas Persediaan</CardTitle>
              <p className="text-xs text-slate-500">Statistik pergerakan aset tahun anggaran 2024</p>
            </div>
            <div className="flex items-center bg-[#030d1a] border border-border p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("yearly")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "yearly" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setActiveTab("monthly")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "monthly" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setActiveTab("weekly")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "weekly" ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Weekly
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* SVG Area Chart */}
            <div className="relative h-60 w-full bg-[#030d1a]/50 rounded-xl border border-border/40 overflow-hidden px-2 pt-6">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between py-6 pointer-events-none opacity-20">
                <hr className="border-slate-700 w-full" />
                <hr className="border-slate-700 w-full" />
                <hr className="border-slate-700 w-full" />
                <hr className="border-slate-700 w-full" />
              </div>
              
              {/* Inline SVG Chart */}
              <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Dotted Orange Curve (Outgoing) */}
                <path
                  d="M0,130 C60,135 120,110 180,140 C240,170 300,120 360,115 C420,110 480,150 540,140 L600,145"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  className="opacity-70"
                />
                
                {/* Solid Blue Curve (Incoming) */}
                <path
                  d="M0,150 C60,120 120,110 180,140 C240,170 300,130 360,95 C420,60 480,110 540,80 L600,105"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                />
                
                {/* Gradient area underneath blue curve */}
                <path
                  d="M0,150 C60,120 120,110 180,140 C240,170 300,130 360,95 C420,60 480,110 540,80 L600,105 L600,200 L0,200 Z"
                  fill="url(#blueGrad)"
                />

                {/* Hotspot Hover Indicator Dot */}
                <circle cx="360" cy="95" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              </svg>

              {/* Tooltip Overlay */}
              <div className="absolute top-[50px] left-[310px] flex flex-col items-center pointer-events-none">
                <span className="px-2 py-1 text-[9px] font-bold text-white bg-blue-600 rounded shadow-lg border border-blue-400/30 whitespace-nowrap">
                  DEC 2024 / 13,250
                </span>
                <div className="w-1.5 h-1.5 bg-blue-600 rotate-45 -mt-1 shadow-lg"></div>
              </div>
            </div>

            {/* Legend & Summary */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs border-t border-border/30">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500"></span>
                  <span className="font-semibold text-slate-400">Barang Masuk (Incoming)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border-2 border-dashed border-orange-500 bg-transparent"></span>
                  <span className="font-semibold text-slate-400">Barang Keluar (Outgoing)</span>
                </div>
              </div>
              <div className="text-slate-400 font-semibold">
                Average daily inflow: <span className="text-white font-extrabold">4,320 units</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory IQ Card */}
        <Card className="bg-[#071829] border-border flex flex-col justify-between">
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4">
              <Zap size={20} className="fill-blue-400/20" />
            </div>
            <CardTitle className="text-lg font-bold text-white">Inventory IQ</CardTitle>
            <p className="text-sm text-slate-400 leading-relaxed mt-2">
              Smart predictive tools for national demand forecasting and automated restock alerts. Launch the engine to see historical trends and future predictions.
            </p>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <button className="w-full flex items-center justify-center gap-2 py-3 bg-white text-slate-950 font-bold rounded-lg hover:bg-slate-100 active:scale-98 transition-all">
              Launch Engine <Zap size={16} className="fill-current" />
            </button>
            <div className="text-center text-[9px] font-bold text-slate-600 tracking-wider">
              POWERED BY BPS AI CORE
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Activities, Stok Menipis, Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activities */}
        <Card className="bg-[#071829] border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-bold text-white">Recent Activities</CardTitle>
            <Link href="/laporan" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-0.5">
              View All <ChevronRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <Package size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">Office Supplies Bulk</p>
                <p className="text-[10px] text-slate-500">24 Jan • 10:30 AM</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 shrink-0">+2,450</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <Truck size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">Regional Distribution</p>
                <p className="text-[10px] text-slate-500">23 Jan • 08:15 PM</p>
              </div>
              <span className="text-xs font-bold text-orange-400 shrink-0">-9,99</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                <Laptop size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">Laptop Dell Latitude</p>
                <p className="text-[10px] text-slate-500">22 Jan • 04:20 PM</p>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded shrink-0">Update</span>
            </div>
          </CardContent>
        </Card>

        {/* Stok Menipis */}
        <Card className="bg-[#071829] border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Stok Menipis
            </CardTitle>
            <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[9px] font-bold text-orange-400 border border-orange-500/20">
              {isLoadingLowStock ? "..." : `${lowStockItems.length} ITEMS`}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingLowStock ? (
              <div className="text-xs text-slate-400 text-center py-4">Memuat data...</div>
            ) : lowStockItems.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Stok aman.</div>
            ) : (
              lowStockItems.slice(0, 3).map((item) => {
                const percentage = Math.min(100, (item.totalStok / (item.stokMinimum || 1)) * 100);
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300 truncate pr-2" title={item.namaBarang}>{item.namaBarang}</span>
                      <span className="text-slate-400 whitespace-nowrap">{item.totalStok}/{item.stokMinimum}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
            {!isLoadingLowStock && lowStockItems.length > 3 && (
              <div className="text-[10px] text-center text-slate-500 font-medium pt-2">
                +{lowStockItems.length - 3} item lainnya...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Legal Footer */}
        <div className="flex flex-col justify-between space-y-6">
          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/barang/tambah"
              className="flex flex-col items-center justify-center p-4 bg-[#071829] border border-border rounded-xl hover:border-blue-500/40 hover:bg-[#0f2b48]/30 transition-all text-center group active:scale-95"
            >
              <ArrowDownToLine size={20} className="text-slate-400 group-hover:text-blue-400 mb-2 transition-colors" />
              <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors">
                Catat Barang Masuk
              </span>
            </Link>

            <Link
              href="/barang/tambah"
              className="flex flex-col items-center justify-center p-4 bg-[#071829] border border-border rounded-xl hover:border-blue-500/40 hover:bg-[#0f2b48]/30 transition-all text-center group active:scale-95"
            >
              <PlusCircle size={20} className="text-slate-400 group-hover:text-blue-400 mb-2 transition-colors" />
              <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors">
                Input Aset Baru
              </span>
            </Link>

            <Link
              href="/mutasi/tambah"
              className="flex flex-col items-center justify-center p-4 bg-[#071829] border border-border rounded-xl hover:border-blue-500/40 hover:bg-[#0f2b48]/30 transition-all text-center group active:scale-95"
            >
              <ArrowRightLeft size={20} className="text-slate-400 group-hover:text-blue-400 mb-2 transition-colors" />
              <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors">
                Mutasi Aset
              </span>
            </Link>

            <Link
              href="/laporan"
              className="flex flex-col items-center justify-center p-4 bg-[#071829] border border-border rounded-xl hover:border-blue-500/40 hover:bg-[#0f2b48]/30 transition-all text-center group active:scale-95"
            >
              <Printer size={20} className="text-slate-400 group-hover:text-blue-400 mb-2 transition-colors" />
              <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors">
                Cetak DIR
              </span>
            </Link>
          </div>

          {/* Legal and System Links Footer */}
          <div className="space-y-3 px-1">
            <div className="text-[9px] font-bold text-slate-600 tracking-wider">
              © 2026 BPS INVENTORY MANAGEMENT SYSTEM
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
              <a href="#" className="hover:text-slate-300">HELP</a>
              <a href="#" className="hover:text-slate-300">TERMS</a>
              <a href="#" className="hover:text-slate-300">PRIVACY</a>
              <a href="#" className="hover:text-slate-300 flex items-center gap-1">
                <span>🌐</span> ENGLISH
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Add Action Button */}
      <Link
        href="/barang/tambah"
        className="fixed bottom-6 right-6 h-12 w-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400/20 transition-all active:scale-95 hover:rotate-90"
        title="Input Cepat"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}
