import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        isActive: true,
        needsPasswordReset: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error("GET /api/pengguna error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat pengguna." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.isAuthorized) return auth.errorResponse!;

    const body = await request.json();
    const { nama, email, role } = body;

    if (!nama || !email || !role) {
      return NextResponse.json({ success: false, error: "Data tidak lengkap" }, { status: 400 });
    }

    // Default password for new users
    const tempPassword = "BpsPalu123!";

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: nama, role },
    });

    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: authError?.message || "Gagal membuat akun di Supabase" }, { status: 400 });
    }

    // Create user in Prisma with matching ID
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        nama,
        email,
        role,
        isActive: true,
        needsPasswordReset: true,
      },
    });

    return NextResponse.json({ success: true, data: user, message: "Pengguna berhasil dibuat" });
  } catch (error: any) {
    console.error("POST /api/pengguna error:", error);
    return NextResponse.json({ success: false, error: "Gagal membuat pengguna" }, { status: 500 });
  }
}
