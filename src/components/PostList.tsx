"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string;
  topic: string;
  status: string;
  createdAt: string;
  publishedAt: string | null;
}

interface PostListProps {
  posts: Post[];
  onAction: () => void;
}

export default function PostList({ posts, onAction }: PostListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);

  const handleAction = async (
    postId: string,
    action: "published" | "rejected" | "delete",
  ) => {
    setLoadingAction(`${postId}-${action}`);
    try {
      if (action === "delete") {
        await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action }),
        });
      }
      onAction();
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePreview = async (postId: string) => {
    if (expandedId === postId) {
      setExpandedId(null);
      setPreviewContent(null);
      setPreviewTitle(null);
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}`);
      const data = await res.json();
      setPreviewContent(data.post.content);
      setPreviewTitle(data.post.title);
      setExpandedId(postId);
    } catch (error) {
      console.error("Failed to load preview:", error);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-yellow-100 text-yellow-800",
      published: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-lg">No posts yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Generate your first blog post above!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {statusBadge(post.status)}
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {post.summary}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Topic: {post.topic}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => handlePreview(post.id)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {expandedId === post.id ? "Hide Preview" : "Preview"}
              </button>

              {post.status === "draft" && (
                <>
                  <button
                    onClick={() => handleAction(post.id, "published")}
                    disabled={loadingAction === `${post.id}-published`}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {loadingAction === `${post.id}-published`
                      ? "Publishing..."
                      : "✅ Publish"}
                  </button>
                  <button
                    onClick={() => handleAction(post.id, "rejected")}
                    disabled={loadingAction === `${post.id}-rejected`}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {loadingAction === `${post.id}-rejected`
                      ? "Rejecting..."
                      : "❌ Reject"}
                  </button>
                </>
              )}

              {post.status === "rejected" && (
                <button
                  onClick={() => handleAction(post.id, "delete")}
                  disabled={loadingAction === `${post.id}-delete`}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {loadingAction === `${post.id}-delete`
                    ? "Deleting..."
                    : "🗑 Delete"}
                </button>
              )}
            </div>
          </div>

          {expandedId === post.id && previewContent && (
            <div className="border-t border-gray-200 bg-gray-50 p-6">
              <div className="prose prose-sm max-w-none">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {previewTitle}
                </h2>
                <div
                  className="text-gray-700 whitespace-pre-wrap"
                  style={{ lineHeight: "1.8" }}
                >
                  {previewContent}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
