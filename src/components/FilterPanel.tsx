"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Filter, SortAsc, Check } from "lucide-react";

const platforms = [
  { value: "all", label: "All Platforms" },
  { value: "moltbook", label: "Moltbook" },
  { value: "openclaw", label: "OpenClaw" },
  { value: "custom", label: "Custom" },
];

const categories = [
  { value: "all", label: "All Categories" },
  { value: "productivity", label: "Productivity" },
  { value: "coding", label: "Coding" },
  { value: "creative", label: "Creative" },
  { value: "research", label: "Research" },
  { value: "automation", label: "Automation" },
  { value: "other", label: "Other" },
];

const sortOptions = [
  { value: "trust", label: "Trust Score" },
  { value: "popularity", label: "Popularity" },
  { value: "newest", label: "Newest" },
  { value: "active", label: "Most Active" },
];

const trustFilters = [
  { value: "0", label: "Any Trust Level" },
  { value: "80", label: "Highly Trusted (80+)" },
  { value: "60", label: "Trusted (60+)" },
  { value: "40", label: "Moderate (40+)" },
];

export function FilterPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPlatform = searchParams.get("platform") || "all";
  const currentCategory = searchParams.get("category") || "all";
  const currentSort = searchParams.get("sort") || "trust";
  const currentMinTrust = searchParams.get("minTrust") || "0";
  const verifiedOnly = searchParams.get("verified") === "true";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "0") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/agents?${params.toString()}`);
  };

  const toggleVerified = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (verifiedOnly) {
      params.delete("verified");
    } else {
      params.set("verified", "true");
    }
    router.push(`/agents?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Platform Filter */}
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Platform
        </h3>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <button
              key={platform.value}
              onClick={() => updateFilter("platform", platform.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                currentPlatform === platform.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {platform.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <h3 className="text-sm font-medium mb-3">Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => updateFilter("category", category.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                currentCategory === category.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trust Level */}
      <div>
        <h3 className="text-sm font-medium mb-3">Trust Level</h3>
        <div className="space-y-2">
          {trustFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => updateFilter("minTrust", filter.value)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                currentMinTrust === filter.value
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
              )}
            >
              {filter.label}
              {currentMinTrust === filter.value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Verified Only */}
      <div>
        <button
          onClick={toggleVerified}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
            verifiedOnly
              ? "bg-green-500/10 text-green-400 border border-green-500/30"
              : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
          )}
        >
          Verified Only
          {verifiedOnly && <Check className="w-4 h-4" />}
        </button>
      </div>

      {/* Sort */}
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <SortAsc className="w-4 h-4" />
          Sort By
        </h3>
        <select
          value={currentSort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
