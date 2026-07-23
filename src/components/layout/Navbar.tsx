"use client";

import React, { useTransition } from "react";
import { Bell, Search, LogOut, Grid } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/(auth)/login/actions";

export default function Navbar({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(() => {
      logout();
    });
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-border bg-[#030d1a] px-6 print:hidden">
      {/* Left: Search Box */}
      <div className="relative flex items-center w-full max-w-lg">
        <Search size={16} className="absolute left-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search asset inventory, serial numbers, or reports..."
          className="w-full pl-10 pr-16 py-2.5 bg-[#071829] border border-border/60 hover:border-blue-500/40 focus:border-blue-500 rounded-lg text-sm text-slate-200 outline-none placeholder:text-slate-500 transition-all"
        />
        <kbd className="absolute right-3 inline-flex items-center gap-0.5 rounded border border-border bg-[#030d1a] px-1.5 font-mono text-[10px] font-medium text-slate-500 select-none pointer-events-none">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-6">
        {/* Support Link */}
        <a
          href="#"
          className="hidden md:block text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          Support
        </a>

        {/* Admin Console Pill */}
        <div className="hidden sm:block">
          <span className="inline-flex items-center rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer px-4 py-1.5 text-xs font-semibold text-slate-200 transition-colors">
            Admin Console
          </span>
        </div>

        {/* Action icons group */}
        <div className="flex items-center gap-3 border-l border-border/60 pl-6">
          {/* Notifications */}
          <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-850 hover:text-white transition-colors">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-500 ring-2 ring-[#030d1a]" />
          </button>

          {/* Grid Menu Icon */}
          <button className="hidden sm:block rounded-lg p-2 text-slate-400 hover:bg-slate-850 hover:text-white transition-colors">
            <Grid size={18} />
          </button>

          {/* User Menu (useful for mobile & quick access) */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-850 outline-none">
              <Avatar className="h-8 w-8 border border-slate-700">
                <AvatarFallback className="bg-blue-600 text-xs text-white uppercase">
                  {user?.nama?.substring(0, 2) || "AD"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-[#071829] border-border text-slate-200">
              <div className="px-2.5 py-2">
                <p className="text-sm font-semibold text-white capitalize leading-none mb-1">
                  {user?.nama || "Alex Morgan"}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.email || "admin@simbara.id"}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem className="focus:bg-[#0f2b48] focus:text-white cursor-pointer">
                Profil Saya
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-[#0f2b48] focus:text-white cursor-pointer">
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="text-red-400 focus:bg-red-950/20 focus:text-red-450 cursor-pointer"
                onClick={handleLogout}
                disabled={isPending}
              >
                <LogOut size={14} className="mr-2" />
                {isPending ? "Keluar..." : "Keluar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
