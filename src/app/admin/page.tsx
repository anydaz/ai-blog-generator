"use client";

import { useEffect, useState, useCallback } from "react";
import TopicForm from "@/components/TopicForm";
import PostList from "@/components/PostList";

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

export default function AdminPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filter === "all" ? "/api/posts" : `/api/posts?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const counts = {
    all: posts.length,
    draft: posts.filter((p) => p.status === "draft").length,
    published: posts.filter((p) => p.status === "published").length,
    rejected: posts.filter((p) => p.status === "rejected").length,
  };

  const filteredPosts =
    filter === "all" ? posts : posts.filter((p) => p.status === filter);

  const filterBtn = (key: string, label: string) => (
    <button
      onClick={() => setFilter(key)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        filter === key
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
      }`}
    >
      {label}{" "}
      <span className="ml-1 opacity-60">
        ({counts[key as keyof typeof counts]})
      </span>
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Generate, review, and publish AI-written blog posts
        </p>
      </div>

      <div className="mb-8">
        <TopicForm onGenerated={fetchPosts} />
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {filterBtn("all", "All")}
          {filterBtn("draft", "Drafts")}
          {filterBtn("published", "Published")}
          {filterBtn("rejected", "Rejected")}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full" />
        </div>
      ) : (
        <PostList posts={filteredPosts} onAction={fetchPosts} />
      )}
    </div>
  );
}
