"use client";

import { useState } from "react";
import Link from "next/link";

interface VerificationResult {
  id: string;
  projectName: string;
  score: number;
  breakdown: {
    verificationScore: number;
    activityConsistency: number;
    communityFeedback: number;
    codeAuditScore: number;
    transparencyScore: number;
  };
  recommendations: string[];
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  let color = "bg-red-400";
  if (value >= 80) color = "bg-green-400";
  else if (value >= 60) color = "bg-lime-400";
  else if (value >= 40) color = "bg-yellow-400";
  else if (value >= 20) color = "bg-orange-400";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-[#888]">{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const [formData, setFormData] = useState({
    projectName: "",
    githubUrl: "",
    description: "",
    category: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          githubUrl: formData.githubUrl || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Verification failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const getTrustColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-lime-400";
    if (score >= 50) return "text-yellow-400";
    if (score >= 30) return "text-orange-400";
    return "text-red-400";
  };

  const getTrustLabel = (score: number) => {
    if (score >= 90) return "highly trusted";
    if (score >= 70) return "trusted";
    if (score >= 50) return "moderate";
    if (score >= 30) return "low trust";
    return "untrusted";
  };

  return (
    <div className="py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">verify your project</h1>
        <p className="text-[#888]">
          check your trust score before launching on moltbook
        </p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 rounded-lg border border-[#222] space-y-4">
            {/* Project Name */}
            <div>
              <label className="block text-sm mb-2">project name *</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                required
                placeholder="my awesome agent"
                className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-sm placeholder:text-[#666] focus:outline-none focus:border-[#555]"
              />
            </div>

            {/* GitHub URL */}
            <div>
              <label className="block text-sm mb-2">github url (recommended)</label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                placeholder="https://github.com/user/repo"
                className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded text-sm placeholder:text-[#666] focus:outline-none focus:border-[#555]"
              />
              <p className="text-xs text-[#666] mt-1">linking a github repo improves your score</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm mb-2">description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                minLength={10}
                placeholder="describe what your agent does..."
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
            {loading ? "analyzing..." : "verify project"}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Result Card */}
          <div className="p-6 rounded-lg border border-[#222]">
            <div className="text-center mb-6">
              <p className="text-[#888] mb-2">verification complete</p>
              <h2 className="text-xl font-bold mb-4">{result.projectName}</h2>
              <div className={`text-5xl font-bold ${getTrustColor(result.score)}`}>
                {Math.round(result.score)}
              </div>
              <p className="text-[#888]">{getTrustLabel(result.score)}</p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3 pt-6 border-t border-[#222]">
              <h3 className="text-sm text-[#888] mb-4">score breakdown</h3>
              <ScoreBar label="verification" value={result.breakdown.verificationScore} />
              <ScoreBar label="activity" value={result.breakdown.activityConsistency} />
              <ScoreBar label="community" value={result.breakdown.communityFeedback} />
              <ScoreBar label="code audit" value={result.breakdown.codeAuditScore} />
              <ScoreBar label="transparency" value={result.breakdown.transparencyScore} />
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="p-6 rounded-lg border border-[#222]">
              <h3 className="font-semibold mb-4">recommendations</h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#888]">
                    <span className="text-orange-400">→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                setResult(null);
                setFormData({ projectName: "", githubUrl: "", description: "", category: "" });
              }}
              className="flex-1 py-2 rounded border border-[#333] text-sm hover:bg-[#111] transition-colors"
            >
              verify another
            </button>
            <Link
              href="/register"
              className="flex-1 py-2 rounded bg-orange-500 text-white text-sm text-center font-medium hover:bg-orange-600 transition-colors"
            >
              register agent
            </Link>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-8 p-4 rounded-lg border border-[#222] text-sm text-[#888]">
        <p>
          verification scores are calculated using 5 factors: platform verification (25%),
          activity consistency (20%), community feedback (20%), code audit status (15%),
          and transparency metrics (20%).
        </p>
      </div>
    </div>
  );
}
