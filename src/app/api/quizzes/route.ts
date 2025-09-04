import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
      await prisma.$queryRaw`SELECT 1`
      
      const quizzes = await prisma.quiz.findMany()
      console.log('Quizzes found:', quizzes.length)
      
      return NextResponse.json(quizzes)
    } catch (error) {
      console.error("Full error:", error)
      console.error("Prisma error code:", error.code)
      console.error("Meta:", error.meta)
      
      return NextResponse.json(
        { 
          error: "Database operation failed",
          details: error.message,
          code: error.code,
          meta: error.meta
        },
        { status: 500 }
      )
    }
  }


    // return NextResponse.json({hello: "world"});