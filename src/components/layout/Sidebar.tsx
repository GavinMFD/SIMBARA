"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  DoorOpen,
  ArrowLeftRight,
  FileBarChart2,
  Users,
  ChevronLeft,
  Menu,
  Settings,
  Plus,
  LogOut,
  ClipboardList,
  PackagePlus,
  PackageOpen,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logout } from "@/app/(auth)/login/actions";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Asset Inventory", href: "/barang", icon: Package },
  { name: "Kategori", href: "/kategori", icon: Tags },
  { name: "Ruangan", href: "/ruangan", icon: DoorOpen },
  { name: "Movement Tracking", href: "/mutasi", icon: ArrowLeftRight },
  { name: "Log ATK", href: "/atk", icon: ClipboardList },
  { name: "Kelola Barang ATK", href: "/master-barang", icon: PackagePlus },
  { name: "Stok Masuk", href: "/stok-masuk", icon: PackageOpen },
  { name: "Reports", href: "/laporan", icon: FileBarChart2 },
  { name: "Pengguna", href: "/pengguna", icon: Users },
];

export default function Sidebar({ user }: { user?: any }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(() => {
      logout();
    });
  };

  return (
    <aside
      className={`flex h-screen flex-col border-r border-border bg-[#041424] text-slate-300 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo & Toggle Header */}
      <div className={`flex h-20 items-center border-b border-border px-3 ${
        collapsed ? "justify-center" : "justify-between"
      }`}>
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <Image
              src="/logo-simbara.png"
              alt="Logo SIMBARA"
              width={40}
              height={40}
              className="shrink-0 rounded-lg"
              priority
            />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-white tracking-wider">
                SIMBARA
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-widest mt-0.5">
                BPS Kota Palu
              </span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-[#0f2b48] text-white shadow-sm border-l-2 border-blue-500"
                    : "text-slate-400 hover:bg-[#0b2136] hover:text-slate-200"
                }`}
                title={item.name}
              >
                <item.icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Preferences Section */}
        <div className="space-y-2">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Preferences
            </p>
          )}
          <nav className="space-y-1">
            <Link
              href="/pengaturan"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                pathname === "/pengaturan"
                  ? "bg-[#0f2b48] text-white shadow-sm border-l-2 border-blue-500"
                  : "text-slate-400 hover:bg-[#0b2136] hover:text-slate-200"
              }`}
              title="Settings"
            >
              <Settings
                size={18}
                className={`shrink-0 ${
                  pathname === "/pengaturan" ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              {!collapsed && <span className="truncate">Settings</span>}
            </Link>
          </nav>
        </div>

        {/* Action Button: + New Asset */}
        <div className="pt-2">
          <Link
            href="/barang/tambah"
            className={`flex items-center justify-center gap-2 rounded-lg bg-[#ff7e47] text-white font-semibold transition-all duration-200 hover:bg-[#e06833] active:scale-95 shadow-md shadow-[#ff7e47]/10 ${
              collapsed ? "h-10 w-10 rounded-full" : "w-full py-2.5 text-sm"
            }`}
            title="Tambah Aset Baru"
          >
            <Plus size={18} className="shrink-0" />
            {!collapsed && <span>New Asset</span>}
          </Link>
        </div>
      </div>

      {/* Footer Profile Block */}
      <div className="border-t border-border p-3 bg-[#030d1a]/50 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <Avatar className="h-9 w-9 shrink-0 border border-slate-700">
              <AvatarFallback className="bg-blue-600 text-xs font-semibold text-white uppercase">
                {user?.nama?.substring(0, 2) || "AD"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-white truncate capitalize">
                  {user?.nama || "Alex Morgan"}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate">
                  {user?.role === 'super_admin' ? 'SUPER ADMIN' : user?.role === 'admin' ? 'ADMIN CONSOLE' : 'KASUBAG'}
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              disabled={isPending}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-colors shrink-0"
              title="Keluar Aplikasi"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
        
        {!collapsed ? (
          <div className="flex items-center justify-between text-[10px] text-slate-600 font-semibold px-1 mt-1">
            <span>ADMIN CONSOLE</span>
            <span>v1.0.4</span>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="flex items-center justify-center rounded-lg py-1 text-slate-400 hover:text-red-400"
            title="Keluar"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
