"use server";

import { createServerSupabaseClient } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function resetPasswordFirstTime(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "Semua kolom wajib diisi" };
  }

  if (password !== confirmPassword) {
    return { error: "Konfirmasi password tidak cocok" };
  }

  if (password.length < 6) {
    return { error: "Password minimal 6 karakter" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    return { error: "Sesi tidak valid, silakan login kembali" };
  }

  // Update password in Supabase
  const { error: updateError } = await supabase.auth.updateUser({
    password: password
  });

  if (updateError) {
    return { error: updateError.message || "Gagal mengubah password" };
  }

  // Update needsPasswordReset in Prisma
  await prisma.user.update({
    where: { id: session.user.id },
    data: { needsPasswordReset: false },
  });

  redirect("/");
}
