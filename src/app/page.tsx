import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      topic: true,
      publishedAt: true,
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          AI-Generated Blog
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Fresh insights powered by AI research and writing. Every post is
          researched from the web and crafted by artificial intelligence.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-xl mb-2">No published posts yet</p>
          <p className="text-gray-400">
            Head to the{" "}
            <Link href="/admin" className="text-blue-600 hover:underline">
              Admin Dashboard
            </Link>{" "}
            to generate your first post.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <article className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-md hover:border-gray-300 transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {post.topic}
                  </span>
                  {post.publishedAt && (
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(post.publishedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-500 mt-2 leading-relaxed">
                  {post.summary}
                </p>
                <span className="inline-flex items-center text-sm text-blue-600 font-medium mt-4">
                  Read more →
                </span>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
