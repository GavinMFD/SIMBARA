"use server";

import { createServerSupabaseClient } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function login(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi" };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email atau password salah" };
  }

  // Verifikasi role di Prisma
  const user = await prisma.user.findUnique({
    where: { id: data.user.id },
  });

  if (!user) {
    // Jika user tidak ada di tabel Prisma, batalkan sesi
    await supabase.auth.signOut();
    return { error: "Akun tidak ditemukan di database sistem" };
  }

  if (!user.isActive) {
    await supabase.auth.signOut();
    return { error: "Akun Anda sedang dinonaktifkan" };
  }

  if (user.role !== "super_admin" && user.role !== "admin" && user.role !== "kasubag") {
    await supabase.auth.signOut();
    return { error: "Anda tidak memiliki akses ke halaman ini" };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
