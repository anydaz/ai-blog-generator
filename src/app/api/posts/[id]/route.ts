import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("[Post] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, title, content, summary } = body;

    const updateData: Record<string, unknown> = {};

    if (status) {
      if (!["draft", "published", "rejected"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status. Must be: draft, published, or rejected" },
          { status: 400 },
        );
      }
      updateData.status = status;
      if (status === "published") {
        updateData.publishedAt = new Date();
      }
    }

    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (summary) updateData.summary = summary;

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("[Post] Error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Post deleted" });
  } catch (error) {
    console.error("[Post] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 },
    );
  }
}
