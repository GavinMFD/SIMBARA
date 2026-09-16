import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const body = await request.json();
    const { nama, role, isActive, resetPassword } = body;

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ success: false, error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // Jika Super Admin meminta reset password
    if (resetPassword) {
      const tempPassword = "BpsPalu123!";
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(params.id, {
        password: tempPassword,
      });

      if (authError) {
        return NextResponse.json({ success: false, error: "Gagal mereset password di Supabase" }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: params.id },
        data: { needsPasswordReset: true },
      });

      return NextResponse.json({ success: true, message: "Password berhasil direset (BpsPalu123!)" });
    }

    // Update profil/role
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        nama: nama !== undefined ? nama : undefined,
        role: role !== undefined ? role : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    // Update metadata di Supabase (opsional)
    if (nama || role) {
      await supabaseAdmin.auth.admin.updateUserById(params.id, {
        user_metadata: { name: updatedUser.nama, role: updatedUser.role },
      });
    }

    return NextResponse.json({ success: true, data: updatedUser, message: "Berhasil memperbarui pengguna" });
  } catch (error: any) {
    console.error("PUT /api/pengguna/[id] error:", error);
    return NextResponse.json({ success: false, error: "Gagal memperbarui pengguna" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.isAuthorized) return auth.errorResponse!;

    // Jangan biarkan super_admin menghapus dirinya sendiri
    if (auth.user?.id === params.id) {
      return NextResponse.json({ success: false, error: "Tidak dapat menghapus akun Anda sendiri" }, { status: 400 });
    }

    // Hapus dari Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(params.id);
    if (authError) {
      return NextResponse.json({ success: false, error: "Gagal menghapus pengguna dari Supabase" }, { status: 400 });
    }

    // Hapus dari Prisma
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Pengguna berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE /api/pengguna/[id] error:", error);
    // Handle specific Prisma constraint error if user has related records
    if (error.code === 'P2003') {
       return NextResponse.json({ success: false, error: "Gagal: Pengguna ini masih memiliki data transaksi/riwayat. Coba nonaktifkan akunnya (isActive = false) alih-alih menghapus." }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "Gagal menghapus pengguna" }, { status: 500 });
  }
}
