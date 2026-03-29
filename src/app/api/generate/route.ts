import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import researchTopic from "../../../services/researchTopic";
import generateBlogPost from "../../../services/generateBlogPost";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
            ),
          );
        };

        try {
          // Step 1: Research
          send("progress", {
            step: 1,
            message: "Searching the web with Playwright...",
          });
          console.log(`[Generate] Researching topic: "${topic}"...`);
          let research = "";
          try {
            research = await researchTopic(topic.trim());
            console.log(
              `[Generate] Research complete (${research.length} chars)`,
            );
          } catch (error) {
            console.error(
              "[Generate] Research failed, continuing with LLM knowledge:",
              error,
            );
            research = "";
          }

          // Step 2: Analyze
          send("progress", {
            step: 2,
            message: "Analyzing sources with AI...",
          });

          // Step 3: Generate
          send("progress", {
            step: 3,
            message: "Writing blog post...",
          });
          console.log("[Generate] Generating blog post...");
          const generated = await generateBlogPost(topic.trim(), research);
          console.log(`[Generate] Generated: "${generated.title}"`);

          // Step 4: Save
          send("progress", {
            step: 4,
            message: "Saving to database...",
          });

          // Create slug
          let slug = slugify(generated.title);
          const existing = await prisma.post.findUnique({ where: { slug } });
          if (existing) {
            slug = `${slug}-${Date.now()}`;
          }

          const post = await prisma.post.create({
            data: {
              title: generated.title,
              slug,
              content: generated.content,
              summary: generated.summary,
              topic: topic.trim(),
              research,
              status: "draft",
            },
          });

          send("complete", {
            id: post.id,
            title: post.title,
            slug: post.slug,
            message: "Blog post generated!",
          });
        } catch (error) {
          console.error("[Generate] Error:", error);
          const message =
            error instanceof Error ? error.message : "Failed to generate post";
          send("error", { message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Generate] Invalid request:", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
