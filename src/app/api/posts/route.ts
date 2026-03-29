import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status ? { status } : {};

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        topic: true,
        status: true,
        createdAt: true,
        publishedAt: true,
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[Posts] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}
