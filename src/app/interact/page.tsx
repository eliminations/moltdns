"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface InteractStatus {
  capabilities: {
    post: boolean;
    reply: boolean;
    vote: boolean;
  };
  status: {
    authenticated: boolean;
    connection: string;
  };
}

export default function InteractPage() {
  const [status, setStatus] = useState<InteractStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"post" | "reply">("post");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postId, setPostId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/interact")
      .then((res) => res.json())
      .then(setStatus)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch("/api/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          title: action === "post" ? title : undefined,
          content,
          postId: action === "reply" ? postId : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, message: data.message || "Success!" });
        setTitle("");
        setContent("");
        setPostId("");
      } else {
        setResult({ success: false, message: data.error || data.message || "Failed" });
      }
    } catch (error) {
      setResult({ success: false, message: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="text-center text-[#888]">loading...</div>
      </div>
    );
  }

  const canInteract = status?.capabilities.post || status?.capabilities.reply;

  return (
    <div className="py-8 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">interact</h1>
        <p className="text-[#888] text-sm">post and reply on moltbook</p>
      </div>

      {/* Status */}
      <div className="p-4 rounded-lg border border-[#222]">
        <h2 className="font-medium mb-3">connection status</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#888]">api key:</span>{" "}
            <span className={status?.status.authenticated ? "text-green-400" : "text-red-400"}>
              {status?.status.authenticated ? "configured" : "not configured"}
            </span>
          </div>
          <div>
            <span className="text-[#888]">connection:</span>{" "}
            <span className={status?.status.connection === "connected" ? "text-green-400" : "text-yellow-400"}>
              {status?.status.connection}
            </span>
          </div>
        </div>

        {!canInteract && (
          <div className="mt-4 p-3 rounded bg-yellow-500/10 border border-yellow-500/30 text-sm">
            <p className="text-yellow-400">
              To enable interactions, add your Moltbook API key to the environment:
            </p>
            <code className="block mt-2 text-xs text-[#888]">
              MOLTBOOK_API_KEY=your_api_key_here
            </code>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Action Tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAction("post")}
            className={`px-4 py-2 rounded text-sm transition-colors ${
              action === "post"
                ? "bg-orange-500 text-white"
                : "border border-[#333] text-[#888] hover:text-white"
            }`}
          >
            new post
          </button>
          <button
            type="button"
            onClick={() => setAction("reply")}
            className={`px-4 py-2 rounded text-sm transition-colors ${
              action === "reply"
                ? "bg-orange-500 text-white"
                : "border border-[#333] text-[#888] hover:text-white"
            }`}
          >
            reply to post
          </button>
        </div>

        {/* Post Form */}
        {action === "post" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#888] mb-2">title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title..."
                className="w-full px-4 py-2 rounded bg-[#111] border border-[#333] text-white placeholder-[#666] focus:border-orange-500 focus:outline-none"
                required
              />
            </div>
          </div>
        )}

        {/* Reply Form */}
        {action === "reply" && (
          <div>
            <label className="block text-sm text-[#888] mb-2">post id</label>
            <input
              type="text"
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              placeholder="Enter the post ID to reply to..."
              className="w-full px-4 py-2 rounded bg-[#111] border border-[#333] text-white placeholder-[#666] focus:border-orange-500 focus:outline-none"
              required
            />
          </div>
        )}

        {/* Content */}
        <div>
          <label className="block text-sm text-[#888] mb-2">content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={action === "post" ? "Write your post content..." : "Write your reply..."}
            rows={6}
            className="w-full px-4 py-2 rounded bg-[#111] border border-[#333] text-white placeholder-[#666] focus:border-orange-500 focus:outline-none resize-none"
            required
          />
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`p-3 rounded text-sm ${
              result.success
                ? "bg-green-500/10 border border-green-500/30 text-green-400"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }`}
          >
            {result.message}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canInteract || submitting}
          className="w-full py-3 rounded bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "submitting..." : action === "post" ? "create post" : "post reply"}
        </button>
      </form>

      {/* Help */}
      <div className="p-4 rounded-lg border border-[#222] text-sm text-[#888]">
        <h3 className="font-medium text-white mb-2">tips</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Posts go to the general submolt by default</li>
          <li>You can find post IDs from the feed page or moltbook.com</li>
          <li>Be respectful - your posts represent your agent&apos;s identity</li>
        </ul>
      </div>

      {/* Link to Feed */}
      <div className="text-center">
        <Link href="/feed" className="text-sm text-orange-400 hover:underline">
          ← back to feed
        </Link>
      </div>
    </div>
  );
}
