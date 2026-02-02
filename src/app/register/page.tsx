"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    platform: "moltbook" as "moltbook" | "openclaw" | "custom",
    platformUrl: "",
    category: "",
    tags: "",
    capabilities: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
          capabilities: formData.capabilities.split(",").map((c) => c.trim()).filter(Boolean),
          platformUrl: formData.platformUrl || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Registration failed");
      }

      const agent = await response.json();
      setSuccess(true);

      setTimeout(() => {
        router.push(`/agents/${agent.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="py-8 max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold mb-2">agent registered</h1>
        <p className="text-[#888]">redirecting to your agent page...</p>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <Link href="/agents" className="text-sm text-[#888] hover:text-white">
        ← back to agents
      </Link>

      <div className="mt-6 mb-8">
        <h1 className="text-2xl font-bold mb-2">register an agent</h1>
        <p className="text-[#888]">add your agent to the moltdns registry</p>
      </div>

      {/* Info */}
      <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/10 text-sm text-[#888] mb-6">
        <p>
          <span className="text-blue-400">tip:</span>{" "}
          <Link href="/verify" className="text-blue-400 hover:underline">
            verify your project
          </Link>{" "}
          first to see your trust score. new agents start with a base score of 20.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 rounded-lg border border-[#222] space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm mb-2">agent name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              maxLength={100}
              placeholder="my awesome agent"
              className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-sm placeholder:text-[#666] focus:outline-none focus:border-[#555]"
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-sm mb-2">platform *</label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value as "moltbook" | "openclaw" | "custom" })}
              className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-sm focus:outline-none focus:border-[#555]"
            >
              <option value="moltbook">moltbook</option>
              <option value="openclaw">openclaw</option>
              <option value="custom">custom / self-hosted</option>
            </select>
          </div>

          {/* Platform URL */}
          <div>
            <label className="block text-sm mb-2">platform url</label>
            <input
              type="url"
              value={formData.platformUrl}
              onChange={(e) => setFormData({ ...formData, platformUrl: e.target.value })}
              placeholder="https://moltbook.com/agents/your-agent"
              className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-sm placeholder:text-[#666] focus:outline-none focus:border-[#555]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm mb-2">description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              maxLength={1000}
              placeholder="what does your agent do?"
              className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-sm placeholder:text-[#666] focus:outline-none focus:border-[#555] resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm mb-2">category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-sm focus:outline-none focus:border-[#555]"
            >
              <option value="">select category</option>
              <option value="productivity">productivity</option>
              <option value="coding">coding</option>
              <option value="creative">creative</option>
              <option value="research">research</option>
              <option value="automation">automation</option>
              <option value="other">other</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm mb-2">tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="ai, automation, productivity"
              className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-sm placeholder:text-[#666] focus:outline-none focus:border-[#555]"
            />
          </div>

          {/* Capabilities */}
          <div>
            <label className="block text-sm mb-2">capabilities (comma separated)</label>
            <input
              type="text"
              value={formData.capabilities}
              onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
              placeholder="text generation, code analysis"
              className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-sm placeholder:text-[#666] focus:outline-none focus:border-[#555]"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "registering..." : "register agent"}
        </button>
      </form>
    </div>
  );
}
