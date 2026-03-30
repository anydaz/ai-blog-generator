"use client";

import { useState } from "react";
import { onMessageReceived } from "@/utils/onMessageReceived";

interface TopicFormProps {
  onGenerated: () => void;
}

const STEPS = [
  { step: 1, label: "Searching the web with Playwright..." },
  { step: 2, label: "Writing blog post..." },
  { step: 3, label: "Saving to database..." },
];

export default function TopicForm({ onGenerated }: TopicFormProps) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setError(null);
    setStatus(null);
    setCurrentStep(0);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate post");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      await onMessageReceived(reader, decoder, {
        onProgress: (step, message) => {
          setCurrentStep(step);
          setStatus(message);
        },
        onComplete: (data) => {
          setStatus(`✅ "${data.title}" generated!`);
          setTopic("");
          onGenerated();
          setTimeout(() => {
            setStatus(null);
            setCurrentStep(0);
          }, 3000);
        },
        onError: (message) => {
          throw new Error(message);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus(null);
    } finally {
      setLoading(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Generate New Blog Post
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="topic"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Topic
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The Future of AI in Healthcare"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating...
            </span>
          ) : (
            "🚀 Research & Generate"
          )}
        </button>
      </form>

      {status && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
          {status}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
          ❌ {error}
        </div>
      )}

      {loading && (
        <div className="mt-4 space-y-3">
          {STEPS.map(({ step, label }) => {
            const isActive = step === currentStep;
            const isDone = step < currentStep;
            const isPending = step > currentStep;

            return (
              <div key={step} className="flex items-center gap-3 text-sm">
                {isDone && (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                {isActive && (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
                {isPending && (
                  <div className="w-5 h-5 border-2 border-gray-200 rounded-full flex-shrink-0" />
                )}
                <span
                  className={
                    isDone
                      ? "text-green-600 line-through"
                      : isActive
                        ? "text-blue-700 font-medium"
                        : "text-gray-400"
                  }
                >
                  {label}
                </span>
              </div>
            );
          })}
          <p className="text-xs text-gray-400 mt-2 pl-8">
            This may take 1-2 minutes depending on research depth.
          </p>
        </div>
      )}
    </div>
  );
}
