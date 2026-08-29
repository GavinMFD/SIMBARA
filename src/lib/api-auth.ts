import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export interface AuthResult {
  isAuthorized: boolean;
  user?: any;
  errorResponse?: NextResponse;
}

/**
 * Memastikan request memiliki session valid dan role yang memiliki akses (Admin/Kasubag/Super Admin).
 * Digunakan untuk memproteksi API routes yang bersifat mutasi atau read-only yang rahasia.
 */
export async function requireAdminOrKasubag(): Promise<AuthResult> {
  const session = await getSession();
  
  if (!session) {
    return {
      isAuthorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: "Unauthorized. Harap login terlebih dahulu." },
        { status: 401 }
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !user.isActive) {
    return {
      isAuthorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: "Akun tidak ditemukan atau tidak aktif." },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "admin" && user.role !== "kasubag" && user.role !== "super_admin") {
    return {
      isAuthorized: false,
      errorResponse: NextResponse.json(
        { success: false, error: "Forbidden. Akses ditolak untuk role Anda." },
        { status: 403 }
      ),
    };
  }

  return {
    isAuthorized: true,
    user,
  };
}
