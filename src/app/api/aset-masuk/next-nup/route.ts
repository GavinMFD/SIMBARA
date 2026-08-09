import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/aset-masuk/next-nup?count=N
// Returns the next N available NUP values
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = Math.min(parseInt(searchParams.get("count") || "1"), 100);

    if (count <= 0) {
      return NextResponse.json(
        { success: false, error: "Count harus lebih dari 0." },
        { status: 400 }
      );
    }

    // Find the highest NUP number in the database
    // NUP format: NUP-XXXXXX (6-digit zero-padded)
    const lastAset = await prisma.masterAset.findFirst({
      select: { nup: true },
      orderBy: { nup: "desc" },
    });

    let nextNumber = 1;

    if (lastAset?.nup) {
      // Extract number from NUP-XXXXXX format
      const match = lastAset.nup.match(/NUP-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Generate N NUP values
    const nups: string[] = [];
    for (let i = 0; i < count; i++) {
      nups.push(`NUP-${String(nextNumber + i).padStart(6, "0")}`);
    }

    return NextResponse.json({
      success: true,
      data: nups,
      nextNumber,
    });
  } catch (error) {
    console.error("GET /api/aset-masuk/next-nup error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghasilkan NUP." },
      { status: 500 }
    );
  }
}
