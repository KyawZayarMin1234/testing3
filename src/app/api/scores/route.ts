import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.$queryRaw`SELECT 1`;

    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { scores: true },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userData);
  } catch (error: any) {
    console.error("Full error:", error);
    return NextResponse.json(
      {
        error: "Database operation failed",
        details: error.message,
        code: error.code,
        meta: error.meta
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gainedScore } = await req.json();

    if (typeof gainedScore !== "number") {
      return NextResponse.json(
        { error: "Invalid score value" },
        { status: 400 }
      );
    }

    // Get current score
    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { scores: true }
    });

    if (!current) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update score
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { scores: current.scores + gainedScore },
      select: { scores: true }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating score:", error);
    return NextResponse.json(
      {
        error: "Failed to update score",
        details: error.message
      },
      { status: 500 }
    );
  }
}
